import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/\s+/g, '-');

  let badgeClass = 'badge-open';
  if (['compliant', 'verified', 'closed', 'approved', 'completed'].includes(normalized)) {
    badgeClass = 'badge-compliant';
  } else if (['critical', 'non-compliant', 'rejected', 'overdue'].includes(normalized)) {
    badgeClass = 'badge-critical';
  } else if (['major', 'in-progress'].includes(normalized)) {
    badgeClass = 'badge-major';
  } else if (['minor', 'pending'].includes(normalized)) {
    badgeClass = 'badge-minor';
  } else if (['observation', 'draft'].includes(normalized)) {
    badgeClass = 'badge-observation';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
      {status}
    </span>
  );
};

export const RiskBadge = ({ level, score }) => {
  let bg = '#eff6ff';
  let color = '#1e40af';
  let border = '#dbeafe';

  const l = String(level || '').toLowerCase();

  if (l === 'critical' || (score && score >= 16)) {
    bg = '#fff1f2';
    color = '#be123c';
    border = '#ffe4e6';
  } else if (l === 'high' || (score && score >= 12)) {
    bg = '#fff7ed';
    color = '#c2410c';
    border = '#ffedd5';
  } else if (l === 'medium' || (score && score >= 6)) {
    bg = '#fefce8';
    color = '#a16207';
    border = '#fef9c3';
  } else {
    bg = '#f0fdf4';
    color = '#15803d';
    border = '#dcfce7';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: '700',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`
      }}
    >
      {level || 'Normal'}
      {score !== undefined && score !== null && <span style={{ opacity: 0.75 }}>({score})</span>}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, subtitle, children, footer, maxWidth = '650px' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
