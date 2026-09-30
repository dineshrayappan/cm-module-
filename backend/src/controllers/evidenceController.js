import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/dbAdapter.js';

// Setup local uploads storage directory
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${Date.now()}${ext}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

export const evidenceController = {
  // Upload and register evidence attachment
  async uploadEvidence(req, res, next) {
    try {
      const {
        related_task_id,
        related_nc_id,
        related_cap_id,
        description,
        file_url_manual,
        file_name_manual,
        file_type_manual
      } = req.body;

      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = 'application/octet-stream';
      let fileType = 'document';

      if (req.file) {
        fileName = req.file.originalname;
        fileUrl = `/uploads/${req.file.filename}`;
        fileSize = req.file.size;
        mimeType = req.file.mimetype;

        if (mimeType.startsWith('image/')) fileType = 'image';
        else if (mimeType.includes('pdf')) fileType = 'pdf';
        else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) fileType = 'spreadsheet';
        else fileType = 'document';

        // If Supabase Storage is configured, also upload to Supabase bucket
        if (db.isSupabase() && db.supabase) {
          try {
            const fileBuffer = fs.readFileSync(req.file.path);
            const { data, error } = await db.supabase.storage
              .from('compliance-evidence')
              .upload(`evidence/${req.file.filename}`, fileBuffer, {
                contentType: mimeType,
                upsert: true
              });
            if (!error && data) {
              const { data: publicUrlData } = db.supabase.storage
                .from('compliance-evidence')
                .getPublicUrl(data.path);
              if (publicUrlData?.publicUrl) {
                fileUrl = publicUrlData.publicUrl;
              }
            }
          } catch (storageErr) {
            console.warn('[Storage] Supabase upload note:', storageErr.message);
          }
        }
      } else if (file_url_manual) {
        fileUrl = file_url_manual;
        fileName = file_name_manual || 'compliance_attachment.pdf';
        fileType = file_type_manual || 'document';
      } else {
        return res.status(400).json({ success: false, message: 'No file was uploaded or file URL provided.' });
      }

      const evidenceDoc = await db.insert('evidence', {
        file_name: fileName,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        mime_type: mimeType,
        uploaded_by: req.user?.id || null,
        upload_date: new Date().toISOString(),
        related_task_id: related_task_id || null,
        related_nc_id: related_nc_id || null,
        related_cap_id: related_cap_id || null,
        description: description || '',
        verification_status: 'Pending'
      });

      // If attached to a task, update task evidence_url
      if (related_task_id) {
        await db.updateById('tasks', related_task_id, { evidence_url: fileUrl });
      }

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPLOAD_EVIDENCE',
        entityType: 'EVIDENCE',
        entityId: evidenceDoc.id,
        entityName: fileName,
        newValue: evidenceDoc,
        req
      });

      res.status(201).json({ success: true, message: 'Evidence uploaded successfully', evidence: evidenceDoc });
    } catch (err) {
      next(err);
    }
  },

  // Get evidence list
  async getEvidence(req, res, next) {
    try {
      const { related_task_id, related_nc_id, related_cap_id } = req.query;
      const filter = {};
      if (related_task_id) filter.related_task_id = related_task_id;
      if (related_nc_id) filter.related_nc_id = related_nc_id;
      if (related_cap_id) filter.related_cap_id = related_cap_id;

      const evidence = await db.find('evidence', filter, { sortBy: 'created_at', sortOrder: 'desc' });
      res.json({ success: true, count: evidence.length, evidence });
    } catch (err) {
      next(err);
    }
  },

  // Verify evidence
  async verifyEvidence(req, res, next) {
    try {
      const { status } = req.body; // 'Verified' or 'Rejected'
      const updated = await db.updateById('evidence', req.params.id, {
        verification_status: status || 'Verified'
      });
      res.json({ success: true, message: 'Evidence verification status updated', evidence: updated });
    } catch (err) {
      next(err);
    }
  }
};
