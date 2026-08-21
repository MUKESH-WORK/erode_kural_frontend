import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAuditLog } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import {
  ClipboardList,
  RefreshCw,
  Filter,
  Calendar,
  Layers,
  RotateCcw,
  Bot,
  BarChart2,
  FileText,
  FileCheck,
} from 'lucide-react';

const MOCK_AUDIT_SEED = [
  { id: 'aud_101', timestamp: '2026-08-20T17:40:00', category: 'general', action: 'GENERAL_CHAT', officer_id: 'OFFICER_01', source_id: 'chat_882', details: 'Queried district welfare policy details in Tamil' },
  { id: 'aud_102', timestamp: '2026-08-20T16:15:22', category: 'data_viz', action: 'QUERY_DATASET', officer_id: 'OFFICER_02', source_id: 'ds_paddy_2026', details: 'Generated bar chart for Taluk-wise paddy procurement' },
  { id: 'aud_103', timestamp: '2026-08-20T14:30:10', category: 'bulk', action: 'APPROVE_DRAFT', officer_id: 'DISTRICT_COLLECTOR', source_id: 'doc_991823', details: 'Approved revenue patta transfer draft acknowledgement' },
  { id: 'aud_104', timestamp: '2026-08-20T11:05:44', category: 'content', action: 'GENERATE_CONTENT', officer_id: 'OFFICER_01', source_id: 'doc_press_44', details: 'Generated official press release for Jal Jeevan review' },
  { id: 'aud_105', timestamp: '2026-08-19T18:22:15', category: 'data_viz', action: 'DETECT_OUTLIERS', officer_id: 'OFFICER_03', source_id: 'ds_water_levels', details: 'Detected IQR statistical outliers in groundwater data' },
  { id: 'aud_106', timestamp: '2026-08-19T10:45:00', category: 'general', action: 'DOC_UPLOAD', officer_id: 'OFFICER_01', source_id: 'doc_erode_memo.pdf', details: 'Uploaded document for General Assistant summary' },
  { id: 'aud_107', timestamp: '2026-08-18T15:10:30', category: 'content', action: 'GENERATE_CIRCULAR', officer_id: 'OFFICER_02', source_id: 'doc_circ_12', details: 'Created inter-departmental circular for Independence Day prep' },
  { id: 'aud_108', timestamp: '2026-08-18T09:30:00', category: 'bulk', action: 'INGEST_FILE', officer_id: 'SYSTEM', source_id: 'doc_email_993', details: 'Ingested scanned petition for Revenue Department' },
  { id: 'aud_109', timestamp: '2026-07-15T12:00:00', category: 'data_viz', action: 'CREATE_CHART', officer_id: 'OFFICER_01', source_id: 'ds_health_2026', details: 'Created custom pie chart for hospital bed occupancy' },
  { id: 'aud_110', timestamp: '2026-06-10T14:20:00', category: 'bulk', action: 'GENERATE_FILE_NO', officer_id: 'OFFICER_02', source_id: 'doc_88214', details: 'Generated official file number ERD/REV/2026/1042' },
  { id: 'aud_111', timestamp: '2025-12-05T10:15:00', category: 'general', action: 'GENERAL_CHAT', officer_id: 'OFFICER_03', source_id: 'chat_102', details: 'Searched Tamil Nadu G.O. guidelines for social welfare' },
  { id: 'aud_112', timestamp: '2025-11-20T16:50:00', category: 'content', action: 'MEMO_CREATE', officer_id: 'DISTRICT_COLLECTOR', source_id: 'doc_memo_05', details: 'Issued office memorandum regarding weekly grievance hearings' },
];

export default function AuditModule() {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLog(100);
      const fetched = res.entries || [];
      const combined = fetched.length > 0 ? fetched : MOCK_AUDIT_SEED;
      setEntries(combined);
    } catch (err) {
      console.error(err);
      setEntries(MOCK_AUDIT_SEED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  // Categorize each log entry
  const getCategoryMeta = (entry) => {
    const cat = (entry.category || '').toLowerCase();
    const act = (entry.action || '').toUpperCase();
    const det = (entry.details || '').toUpperCase();

    if (cat === 'general' || act.includes('CHAT') || act.includes('GENERAL') || det.includes('ASSISTANT') || det.includes('CHAT')) {
      return { id: 'general', label: t('audit.cat_general'), icon: Bot, color: '#b45309', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    }
    if (cat === 'data_viz' || act.includes('DATA') || act.includes('CHART') || act.includes('DATASET') || act.includes('OUTLIER') || det.includes('DATASET') || det.includes('QUERY')) {
      return { id: 'data_viz', label: t('audit.cat_data_viz'), icon: BarChart2, color: '#1d4ed8', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' };
    }
    if (cat === 'content' || act.includes('CONTENT') || act.includes('LETTER') || act.includes('MEMO') || act.includes('CIRCULAR') || det.includes('PRESS') || det.includes('CIRCULAR') || det.includes('OFFICIAL CONTENT')) {
      return { id: 'content', label: t('audit.cat_content'), icon: FileText, color: '#7e22ce', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' };
    }
    return { id: 'bulk', label: t('audit.cat_bulk'), icon: FileCheck, color: '#047857', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
  };

  // Synchronize date input change with Y-M-D dropdowns
  const handleDateInputChange = (e) => {
    const val = e.target.value; // "YYYY-MM-DD"
    setSelectedDate(val);
    if (val) {
      const [y, m, d] = val.split('-');
      setSelectedYear(y);
      setSelectedMonth(m);
      setSelectedDay(String(parseInt(d, 10)));
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDay('all');
    setSelectedDate('');
  };

  // Available Years, Months, Days derived dynamically
  const yearsList = useMemo(() => ['2026', '2025', '2024'], []);
  const monthsList = useMemo(() => [
    { value: '01', label: '01 - Jan' },
    { value: '02', label: '02 - Feb' },
    { value: '03', label: '03 - Mar' },
    { value: '04', label: '04 - Apr' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - Jun' },
    { value: '07', label: '07 - Jul' },
    { value: '08', label: '08 - Aug' },
    { value: '09', label: '09 - Sep' },
    { value: '10', label: '10 - Oct' },
    { value: '11', label: '11 - Nov' },
    { value: '12', label: '12 - Dec' },
  ], []);
  const daysList = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);

  // Filtered audit entries
  const filteredEntries = useMemo(() => {
    return entries.filter((ent) => {
      const meta = getCategoryMeta(ent);
      if (selectedCategory !== 'all' && meta.id !== selectedCategory) {
        return false;
      }

      if (!ent.timestamp) return true;
      const d = new Date(ent.timestamp);
      if (isNaN(d.getTime())) return true;

      const entYear = d.getFullYear().toString();
      const entMonth = (d.getMonth() + 1).toString().padStart(2, '0');
      const entDay = d.getDate().toString();
      const entDateStr = `${entYear}-${entMonth}-${entDay.padStart(2, '0')}`;

      if (selectedDate && entDateStr !== selectedDate) {
        return false;
      }
      if (selectedYear !== 'all' && entYear !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'all' && entMonth !== selectedMonth) {
        return false;
      }
      if (selectedDay !== 'all' && entDay !== selectedDay) {
        return false;
      }

      return true;
    });
  }, [entries, selectedCategory, selectedYear, selectedMonth, selectedDay, selectedDate]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || selectedDay !== 'all' || selectedDate !== '';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="module-title tamil-text">{t('audit.title')}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
            {t('audit.desc')}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={loadAudit}
          disabled={loading}
          title="Refresh Audit Log"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--color-text-primary)' }} />
        </button>
      </div>

      {/* Filter Dock */}
      <div
        className="card"
        style={{
          padding: 16,
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            <Layers size={14} style={{ color: 'var(--color-tn-primary)' }} />
            <span className="tamil-text">{t('audit.filter_category')}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { id: 'all', label: t('audit.all_categories'), icon: Layers },
              { id: 'general', label: t('audit.cat_general'), icon: Bot },
              { id: 'data_viz', label: t('audit.cat_data_viz'), icon: BarChart2 },
              { id: 'content', label: t('audit.cat_content'), icon: FileText },
              { id: 'bulk', label: t('audit.cat_bulk'), icon: FileCheck },
            ].map((cat) => {
              const IconComp = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="tamil-text"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: '0.78rem',
                    fontWeight: active ? 600 : 500,
                    border: active ? '1px solid var(--color-tn-primary)' : '1px solid var(--color-surface-border)',
                    background: active ? 'var(--color-tn-primary)' : 'var(--color-surface-bg)',
                    color: active ? '#ffffff' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <IconComp size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date / Month / Year Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 10, borderTop: '1px solid var(--color-surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: 4 }}>
            <Calendar size={14} style={{ color: 'var(--color-tn-primary)' }} />
            <span className="tamil-text">{t('audit.filter_date')}:</span>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateInputChange}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: '1px solid var(--color-surface-border)',
                background: 'var(--color-surface-bg)',
                color: 'var(--color-text-primary)',
                fontSize: '0.78rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setSelectedDate(''); }}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-surface-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('audit.all_years')}</option>
            {yearsList.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(''); }}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-surface-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('audit.all_months')}</option>
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Day Dropdown */}
          <select
            value={selectedDay}
            onChange={(e) => { setSelectedDay(e.target.value); setSelectedDate(''); }}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-surface-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('audit.all_days')}</option>
            {daysList.map((d) => (
              <option key={d} value={d}>{t('audit.day')} {d}</option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="tamil-text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <RotateCcw size={13} />
              <span>{t('audit.reset_filters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count & Table View */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }} className="tamil-text">
          {t('audit.showing_results', { count: filteredEntries.length })}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={56} style={{ color: 'var(--color-text-muted)' }} className="empty-icon" />
          <div className="empty-title tamil-text">{t('audit.empty')}</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', borderRadius: 12, border: '1px solid var(--color-surface-border)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)', whiteSpace: 'nowrap' }}>{t('audit.date_time')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)', whiteSpace: 'nowrap' }}>{t('audit.category')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)', whiteSpace: 'nowrap' }}>{t('audit.action')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)', whiteSpace: 'nowrap' }}>{t('audit.officer')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)', whiteSpace: 'nowrap' }}>{t('audit.source_id')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((ent) => {
                const catMeta = getCategoryMeta(ent);
                const CatIcon = catMeta.icon;
                return (
                  <tr key={ent.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(ent.timestamp, i18n.language)}
                    </td>
                    <td>
                      <span
                        className="tamil-text"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          background: catMeta.bg,
                          color: catMeta.color,
                          border: `1px solid ${catMeta.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <CatIcon size={12} />
                        <span>{catMeta.label}</span>
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: ent.action.includes('APPROVE') ? '#d1fae5' : 'var(--color-surface-bg)',
                          color: ent.action.includes('APPROVE') ? '#065f46' : 'var(--color-text-primary)',
                          border: '1px solid var(--color-surface-border)',
                        }}
                      >
                        {ent.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{ent.officer_id || 'SYSTEM'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {ent.source_id ? `${ent.source_id.slice(0, 12)}${ent.source_id.length > 12 ? '…' : ''}` : '—'}
                    </td>
                    <td className="tamil-text" style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
                      {ent.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
