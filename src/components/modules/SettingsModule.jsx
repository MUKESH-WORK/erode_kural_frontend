import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { Settings, Server, Cpu, Database, Shield, Globe } from 'lucide-react';

export default function SettingsModule() {
  const { t } = useTranslation();
  const { appConfig, officerId, setOfficerId } = useAppStore();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="module-title tamil-text">{t('sidebar.settings')}</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
          {t('settings.desc')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Officer Profile */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--color-tn-primary-light)' }} />
            <h3 className="tamil-text" style={{ fontSize: '1rem', fontWeight: 700 }}>
              {t('settings.session_title')}
            </h3>
          </div>
          <div>
            <label className="tamil-text" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('settings.officer_id_label')}
            </label>
            <input
              type="text"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-surface-border)',
                background: 'var(--color-surface-input)',
                color: 'var(--color-text-primary)',
                fontWeight: 600,
              }}
            />
          </div>
        </div>

        {/* System Backend Config */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} style={{ color: 'var(--color-tn-accent)' }} />
            <h3 className="tamil-text" style={{ fontSize: '1rem', fontWeight: 700 }}>
              {t('settings.backend_config')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-surface-border)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{t('settings.ai_model')}</span>
              <strong>{appConfig?.ollama_model || 'qwen2.5:7b (Local Ollama)'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-surface-border)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{t('settings.ocr_engine')}</span>
              <strong>{appConfig?.ocr_engine || 'Indic-OCR (Transformer)'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-surface-border)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{t('settings.database')}</span>
              <strong>{appConfig?.database || 'collectorate_workflow.db'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{t('settings.imap_server')}</span>
              <strong>{appConfig?.imap_server || 'imap.nic.in'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
