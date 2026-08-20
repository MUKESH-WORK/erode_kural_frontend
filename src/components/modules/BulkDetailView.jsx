import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import {
  fetchBulkItemDetail,
  approveItem,
  editDraft,
  generateFileNumber,
  exportDocx,
} from '../../lib/api';
import { formatDate, getStatusLabel, getPriorityLabel, downloadBlob } from '../../lib/utils';
import ConfidenceBadge from '../shared/ConfidenceBadge';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Download,
  Hash,
  Edit3,
  Save,
  Shield,
  FileText,
  Tag,
  FileCheck,
  Search,
} from 'lucide-react';

const TABS = ['tab_ocr', 'tab_entities', 'tab_classification', 'tab_draft', 'tab_grounding'];

export default function BulkDetailView({ sourceId, onBack, onRefresh }) {
  const { t } = useTranslation();
  const { officerId, openInspector } = useAppStore();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tab_ocr');
  const [editMode, setEditMode] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [fileNumber, setFileNumber] = useState(null);

  useEffect(() => {
    loadDetail();
  }, [sourceId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await fetchBulkItemDetail(sourceId);
      setDetail(data);
      if (data.draft?.draft_text) {
        setDraftText(data.draft.draft_text);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (action) => {
    setActionLoading(true);
    try {
      await approveItem(sourceId, officerId, action);
      await loadDetail();
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setActionLoading(true);
    try {
      await editDraft(sourceId, officerId, draftText);
      setEditMode(false);
      await loadDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateFileNo = async () => {
    setActionLoading(true);
    try {
      const dept = detail?.classification?.department || 'பொது_வழக்கு';
      const result = await generateFileNumber(sourceId, dept, officerId);
      setFileNumber(result.file_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportDocx = async () => {
    setActionLoading(true);
    try {
      const blob = await exportDocx(sourceId);
      downloadBlob(blob, `Ack_${sourceId.slice(0, 8)}.docx`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-tn-danger)' }}>{error || 'Not found'}</p>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> {t('detail.back_to_list')}
        </button>
      </div>
    );
  }

  const { ocr_pages = [], entities = [], classification, draft } = detail;
  const groundingMap = draft?.grounding_map || {};

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="tamil-text">{t('detail.back_to_list')}</span>
        </button>
        <div style={{ flex: 1 }}>
          <h2 className="module-title" style={{ fontSize: '1.1rem' }}>
            {detail.file_name}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`status-badge status-${detail.status}`}>{getStatusLabel(detail.status)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {detail.source_type === 'email' ? '📧' : '📄'} {detail.source_id?.slice(0, 12)}…
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {formatDate(detail.received_at)}
            </span>
            {fileNumber && (
              <span style={{
                padding: '2px 10px',
                background: 'var(--color-tn-accent)',
                color: 'var(--color-tn-primary-dark)',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                📁 {fileNumber}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleGenerateFileNo} disabled={actionLoading} title={t('bulk.generate_file_no')}>
            <Hash size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleExportDocx} disabled={actionLoading} title={t('bulk.export_docx')}>
            <Download size={14} />
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleApprove('approve')}
            disabled={actionLoading || draft?.officer_approved}
          >
            <CheckCircle2 size={14} />
            <span className="tamil-text">{t('bulk.approve')}</span>
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleApprove('reject')}
            disabled={actionLoading}
          >
            <XCircle size={14} />
            <span className="tamil-text">{t('bulk.reject')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab tamil-text ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`detail.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card animate-fade-in" key={activeTab}>
        {/* ─── OCR Text ─────────────── */}
        {activeTab === 'tab_ocr' && (
          <div>
            {ocr_pages.length === 0 ? (
              <p className="tamil-text" style={{ color: 'var(--color-text-muted)' }}>OCR தரவு இல்லை</p>
            ) : (
              ocr_pages.map((page, i) => (
                <div key={page.id || i} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontWeight: 600 }}>{t('detail.ocr_page')} {page.page_number}</span>
                    <ConfidenceBadge score={page.avg_confidence || 0} />
                  </div>
                  <pre
                    className="tamil-text"
                    style={{
                      background: 'var(--color-surface-hover)',
                      padding: 16,
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    {page.full_text_corrected || page.full_text}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Entities ─────────────── */}
        {activeTab === 'tab_entities' && (
          <div>
            {entities.length === 0 ? (
              <p className="tamil-text" style={{ color: 'var(--color-text-muted)' }}>பிரித்தெடுக்கப்பட்ட நிறுவனங்கள் இல்லை</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="tamil-text">{t('detail.entity_type')}</th>
                    <th className="tamil-text">{t('detail.entity_value')}</th>
                    <th>{t('detail.ocr_confidence')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((ent, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          background: 'var(--color-surface-hover)',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          {ent.entity_type}
                        </span>
                      </td>
                      <td className="tamil-text">{ent.entity_value}</td>
                      <td>
                        {ent.confidence != null ? (
                          <ConfidenceBadge score={ent.confidence} />
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── Classification ─────────── */}
        {activeTab === 'tab_classification' && (
          <div>
            {!classification ? (
              <p className="tamil-text" style={{ color: 'var(--color-text-muted)' }}>வகைப்பாடு இல்லை</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-tn-primary)' }}>
                  <Tag size={16} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
                    {t('detail.dept_label')}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }} className="tamil-text">
                    {classification.department}
                  </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-tn-warning)' }}>
                  <Shield size={16} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
                    {t('detail.priority_label')}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }} className={`priority-${classification.priority?.toLowerCase()}`}>
                    {getPriorityLabel(classification.priority)}
                  </div>
                </div>
                <div className="card" style={{ gridColumn: '1 / -1', borderLeft: '4px solid var(--color-tn-accent)' }}>
                  <FileCheck size={16} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
                    {t('detail.decision_label')}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 4 }} className="tamil-text">
                    {classification.final_decision || '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Draft ─────────────── */}
        {activeTab === 'tab_draft' && (
          <div>
            {!draft ? (
              <p className="tamil-text" style={{ color: 'var(--color-text-muted)' }}>வரைவு தயாரிக்கப்படவில்லை</p>
            ) : (
              <>
                {/* Hallucination Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span className="tamil-text" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {t('detail.hallucination_score')}:
                  </span>
                  <ConfidenceBadge score={1 - (draft.hallucination_score || 0)} />
                  {draft.officer_approved && (
                    <span style={{
                      padding: '2px 10px',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: 9999,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}>
                      ✓ {t('bulk.approved')}
                    </span>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {editMode ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={handleSaveDraft} disabled={actionLoading}>
                          <Save size={14} />
                          <span className="tamil-text">{t('common.save')}</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(false); setDraftText(draft.draft_text); }}>
                          <span className="tamil-text">{t('common.cancel')}</span>
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}>
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Draft Text */}
                {editMode ? (
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="tamil-text"
                    style={{
                      width: '100%',
                      minHeight: 300,
                      padding: 16,
                      borderRadius: 8,
                      border: '2px solid var(--color-tn-primary)',
                      background: 'var(--color-surface-input)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.8,
                      resize: 'vertical',
                      fontFamily: "'Noto Sans Tamil', sans-serif",
                    }}
                  />
                ) : (
                  <pre
                    className="tamil-text"
                    style={{
                      background: 'var(--color-surface-hover)',
                      padding: 20,
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {draft.draft_text}
                  </pre>
                )}

                {/* Missing Fields */}
                {draft.missing_fields?.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#92400e' }}>
                      ⚠️ Missing Fields: {draft.missing_fields.join(', ')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Grounding Inspector ─────── */}
        {activeTab === 'tab_grounding' && (
          <div>
            {Object.keys(groundingMap).length === 0 ? (
              <p className="tamil-text" style={{ color: 'var(--color-text-muted)' }}>ஆதார தரவு இல்லை</p>
            ) : (
              <table className="grounding-table">
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
                      {t('detail.grounding_field')}
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
                      {t('detail.grounding_value')}
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
                      {t('detail.grounding_source')}
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {t('detail.grounding_confidence')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groundingMap).map(([field, entry]) => (
                    <tr key={field}>
                      <td className="field-name tamil-text">{field}</td>
                      <td className="field-value tamil-text">
                        {entry.value || <span style={{ color: 'var(--color-tn-danger)' }}>[தகவல் இல்லை]</span>}
                      </td>
                      <td>
                        <div className="field-value" style={{ fontSize: '0.75rem' }}>
                          {entry.source || '—'}
                        </div>
                        {entry.source_chunk && (
                          <div className="source-chunk tamil-text">
                            «{entry.source_chunk}»
                          </div>
                        )}
                      </td>
                      <td>
                        <ConfidenceBadge score={entry.confidence || 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => openInspector(groundingMap)}
              >
                <Search size={14} />
                <span className="tamil-text">{t('inspector.title')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
