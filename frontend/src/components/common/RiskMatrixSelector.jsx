import React from 'react';

export const RiskMatrixSelector = ({ likelihood, impact, onChange, readOnly = false }) => {
  const levels = [
    { value: 5, label: '5 - Almost Certain' },
    { value: 4, label: '4 - Likely' },
    { value: 3, label: '3 - Possible' },
    { value: 2, label: '2 - Unlikely' },
    { value: 1, label: '1 - Rare' }
  ];

  const impacts = [
    { value: 1, label: '1 - Insignificant' },
    { value: 2, label: '2 - Minor' },
    { value: 3, label: '3 - Moderate' },
    { value: 4, label: '4 - Major' },
    { value: 5, label: '5 - Catastrophic' }
  ];

  const getScoreInfo = (l, i) => {
    const score = l * i;
    if (score >= 16) return { score, level: 'Critical', bg: '#fee2e2', color: '#991b1b', border: '#f87171' };
    if (score >= 12) return { score, level: 'High', bg: '#ffedd5', color: '#9a3412', border: '#fb923c' };
    if (score >= 6) return { score, level: 'Medium', bg: '#fef9c3', color: '#854d0e', border: '#facc15' };
    return { score, level: 'Low', bg: '#dcfce7', color: '#166534', border: '#4ade80' };
  };

  const currentInfo = getScoreInfo(likelihood, impact);

  return (
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Risk Assessment Matrix (5 × 5)
          </span>
          <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
            Likelihood: <strong>{likelihood}</strong> × Impact: <strong>{impact}</strong>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: currentInfo.bg,
              color: currentInfo.color,
              border: `1.5px solid ${currentInfo.border}`,
              fontWeight: 800,
              fontSize: '13.5px'
            }}
          >
            <span>Score: {currentInfo.score}</span>
            <span>•</span>
            <span>{currentInfo.level} Risk</span>
          </div>
        </div>
      </div>

      {/* 5x5 Interactive Grid */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ width: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'right', paddingRight: '6px' }}>
          <span>L5 Almost</span>
          <span>L4 Likely</span>
          <span>L3 Possible</span>
          <span>L2 Unlikely</span>
          <span>L1 Rare</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {[5, 4, 3, 2, 1].map((lVal) =>
              [1, 2, 3, 4, 5].map((iVal) => {
                const info = getScoreInfo(lVal, iVal);
                const isSelected = likelihood === lVal && impact === iVal;

                return (
                  <button
                    key={`${lVal}-${iVal}`}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange && onChange(lVal, iVal)}
                    style={{
                      height: '42px',
                      borderRadius: '6px',
                      backgroundColor: info.bg,
                      color: info.color,
                      border: isSelected ? '2.5px solid #0f172a' : `1px solid ${info.border}`,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: readOnly ? 'default' : 'pointer',
                      transform: isSelected ? 'scale(1.08)' : 'none',
                      boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: isSelected ? 2 : 1
                    }}
                    title={`Likelihood: ${lVal}, Impact: ${iVal} => Score: ${info.score} (${info.level})`}
                  >
                    {info.score}
                  </button>
                );
              })
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
            <span>I1 Low</span>
            <span>I2 Minor</span>
            <span>I3 Mod</span>
            <span>I4 Major</span>
            <span>I5 Catast</span>
          </div>
        </div>
      </div>
    </div>
  );
};
