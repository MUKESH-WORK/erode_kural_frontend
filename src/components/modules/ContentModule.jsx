import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { generateContent } from '../../lib/api';
import { Stamp, Sparkles, Send, FileCheck } from 'lucide-react';

const TEMPLATES = [
  { id: 'press_release', titleKey: 'content.press_release_title', descKey: 'content.press_release_desc' },
  { id: 'circular', titleKey: 'content.circular_title', descKey: 'content.circular_desc' },
  { id: 'memo', titleKey: 'content.memo_title', descKey: 'content.memo_desc' },
  { id: 'meeting_minutes', titleKey: 'content.meeting_minutes_title', descKey: 'content.meeting_minutes_desc' },
];

export default function ContentModule() {
  const { t } = useTranslation();
  const { officerId } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setLoading(true);
    try {
      const res = await generateContent(selectedTemplate, { subject, details }, officerId);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="module-title tamil-text">{t('sidebar.content')}</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
          {t('content.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className={`card ${selectedTemplate === tmpl.id ? 'active' : ''}`}
            onClick={() => setSelectedTemplate(tmpl.id)}
            style={{
              cursor: 'pointer',
              borderColor: selectedTemplate === tmpl.id ? 'var(--color-tn-accent)' : 'var(--color-surface-border)',
              background: selectedTemplate === tmpl.id ? 'rgba(200, 169, 81, 0.08)' : 'var(--color-surface-card)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }} className="tamil-text">
              {t(tmpl.titleKey)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }} className="tamil-text">
              {t(tmpl.descKey)}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleGenerate} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="tamil-text" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            {t('content.subject')}:
          </label>
          <input
            type="text"
            placeholder={t('content.subject_placeholder')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="tamil-text"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-surface-input)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label className="tamil-text" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            {t('content.key_points')}:
          </label>
          <textarea
            rows={4}
            placeholder={t('content.key_points_placeholder')}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="tamil-text"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-surface-input)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={!subject.trim() || loading} style={{ alignSelf: 'flex-start' }}>
          <Sparkles size={16} />
          <span className="tamil-text">{loading ? t('content.generating') : t('content.generate_btn')}</span>
        </button>

        {result && (
          <div style={{ padding: 16, background: 'var(--color-surface-hover)', borderRadius: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-tn-success)' }}>
              <FileCheck size={18} />
              <span className="tamil-text" style={{ fontWeight: 700 }}>{t('content.success_title')}</span>
            </div>
            <p className="tamil-text" style={{ fontSize: '0.9rem', marginTop: 8 }}>
              {result.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
