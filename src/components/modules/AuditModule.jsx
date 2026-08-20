import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAuditLog } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { ClipboardList, RefreshCw, ShieldAlert, CheckCircle } from 'lucide-react';

export default function AuditModule() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLog(100);
      setEntries(res.entries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="module-title tamil-text">{t('sidebar.audit')}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
            அனைத்து பயனர் நடவடிக்கைகள், ஆவண ஒப்புதல்கள் மற்றும் மாற்றங்களின் மாற்ற முடியாத தணிக்கை பதிவு
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadAudit} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={64} style={{ color: 'var(--color-text-muted)' }} className="empty-icon" />
          <div className="empty-title tamil-text">தணிக்கை பதிவுகள் ஏதுமில்லை</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>தேதி & நேரம்</th>
                <th>செயல் (Action)</th>
                <th>அலுவலர் (Officer)</th>
                <th>ஆதார எண் (Source ID)</th>
                <th>விவரங்கள் (Details)</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((ent) => (
                <tr key={ent.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(ent.timestamp)}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: ent.action.includes('APPROVE') ? '#d1fae5' : '#fee2e2',
                      color: ent.action.includes('APPROVE') ? '#065f46' : '#991b1b',
                    }}>
                      {ent.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{ent.officer_id || 'SYSTEM'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {ent.source_id ? `${ent.source_id.slice(0, 10)}…` : '—'}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{ent.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
