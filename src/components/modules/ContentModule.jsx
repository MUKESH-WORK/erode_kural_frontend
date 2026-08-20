import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { generateContent } from '../../lib/api';
import { Stamp, Sparkles, Send, FileCheck } from 'lucide-react';

const TEMPLATES = [
  { id: 'press_release', title: 'செய்தி குறிப்பு (Press Release)', desc: 'மாவட்ட ஆட்சியர் அலுவலக அதிகாரப்பூர்வ செய்தி வெளியீடு' },
  { id: 'circular', title: 'அலுவலக சுற்றறிக்கை (Official Circular)', desc: 'துறை சார்ந்த அனைத்து அலுவலர்களுக்கான சுற்றறிக்கை' },
  { id: 'memo', title: 'அலுவலக குறிப்பாணை (Office Memorandum)', desc: 'உள் விவகாரங்கள் மற்றும் ஒழுங்குமுறை உத்தரவுகள்' },
  { id: 'meeting_minutes', title: 'கூட்ட நடவடிக்கை பதிவேடு (Minutes)', desc: 'திங்கள் மக்கள் குறைதீர்க்கும் நாள் கூட்ட விவரம்' }
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
          அரசு விதிமுறைகளுக்குட்பட்ட அதிகாரப்பூர்வ செய்தி வெளியீடுகள், சுற்றறிக்கைகள் மற்றும் குறிப்பாணைகள் தயாரித்தல்
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
              {tmpl.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }} className="tamil-text">
              {tmpl.desc}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleGenerate} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="tamil-text" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            பொருள் (Subject):
          </label>
          <input
            type="text"
            placeholder="எ.கா: ஈரோடு மாவட்டத்தில் ஜல் ஜீவன் இயக்க திட்ட ஆய்வுக் கூட்டம் - செய்தி குறிப்பு"
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
            முக்கிய குறிப்புகள் (Key Points / Context):
          </label>
          <textarea
            rows={4}
            placeholder="கூட்டத்தின் முக்கிய முடிவுகள், கலந்து கொண்ட அலுவலர்கள், பயனாளிகள் எண்ணிக்கை..."
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
          <span className="tamil-text">{loading ? "உருவாக்குகிறது..." : "உள்ளடக்கம் உருவாக்கு"}</span>
        </button>

        {result && (
          <div style={{ padding: 16, background: 'var(--color-surface-hover)', borderRadius: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-tn-success)' }}>
              <FileCheck size={18} />
              <span className="tamil-text" style={{ fontWeight: 700 }}>வெற்றிகரமாக பதிவு செய்யப்பட்டது</span>
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
