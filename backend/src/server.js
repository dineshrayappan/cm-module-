import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { escalationService } from './services/escalationService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
const handleHealth = (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Garment Compliance Management System Backend',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime()
  });
};
app.get('/health', handleHealth);
app.get('/api/health', handleHealth);

// API Routes
app.use('/api', apiRouter);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route '${req.originalUrl}' not found.`
  });
});

// Global Error Handler
app.use(errorHandler);

// Periodic background check for task and NC overdue escalations (Every 10 minutes when running as persistent daemon)
if (!process.env.VERCEL) {
  setInterval(async () => {
    try {
      await escalationService.processEscalations();
    } catch (err) {
      console.error('[Escalation Cron Error]', err.message);
    }
  }, 10 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Garment Compliance Backend running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 REST API base: http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
}

export default app;
