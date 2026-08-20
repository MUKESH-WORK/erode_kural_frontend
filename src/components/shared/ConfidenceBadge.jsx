import React from 'react';

/**
 * SVG-based Confidence Badge.
 * 🟢 high (≥0.85) | 🟡 medium (≥0.60) | 🔴 low (<0.60)
 */
export default function ConfidenceBadge({ score, showLabel = true, size = 14 }) {
  const level = score >= 0.85 ? 'high' : score >= 0.60 ? 'medium' : 'low';
  const colors = {
    high: '#22c55e',
    medium: '#f59e0b',
    low: '#ef4444',
  };
  const labels = {
    high: 'உயர் நம்பிக்கை',
    medium: 'நடுத்தர நம்பிக்கை',
    low: 'குறைந்த நம்பிக்கை',
  };
  const color = colors[level];
  const pct = Math.round(score * 100);

  return (
    <span className="confidence-badge" title={`${labels[level]} — ${pct}%`}>
      <svg width={size} height={size} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" fill={color} opacity="0.2" />
        <circle cx="8" cy="8" r="5" fill={color} />
        {level === 'high' && (
          <path d="M5.5 8 L7 9.5 L10.5 6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {level === 'medium' && (
          <text x="8" y="10.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">!</text>
        )}
        {level === 'low' && (
          <text x="8" y="10.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">✕</text>
        )}
      </svg>
      {showLabel && (
        <span style={{ color, fontSize: '0.75rem', fontWeight: 600 }}>{pct}%</span>
      )}
    </span>
  );
}
