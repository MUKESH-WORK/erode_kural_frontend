import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import ConfidenceBadge from '../shared/ConfidenceBadge';
import { X, Search, ShieldCheck } from 'lucide-react';

export default function SourceInspector() {
  const { t } = useTranslation();
  const { inspectorOpen, inspectorData, closeInspector } = useAppStore();

  if (!inspectorOpen || !inspectorData) return null;

  return (
    <aside className="inspector-panel open animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-tn-accent)' }} />
          <h3 className="module-title tamil-text" style={{ fontSize: '1.1rem' }}>
            {t('inspector.title')}
          </h3>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={closeInspector} title={t('inspector.close')}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(inspectorData).map(([field, item]) => {
          if (!item) return null;
          return (
            <div key={field} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="tamil-text" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {field}
                </span>
                <ConfidenceBadge score={item.confidence || 0} />
              </div>
              <div className="tamil-text" style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 600, wordBreak: 'break-word' }}>
                {item.value || <span style={{ color: 'var(--color-tn-danger)' }}>[தகவல் இல்லை]</span>}
              </div>
              {item.source && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>{t('inspector.source')}:</span> {item.source}
                </div>
              )}
              {item.source_chunk && (
                <div
                  className="tamil-text"
                  style={{
                    marginTop: 6,
                    padding: 8,
                    background: 'var(--color-surface-hover)',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  «{item.source_chunk}»
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
