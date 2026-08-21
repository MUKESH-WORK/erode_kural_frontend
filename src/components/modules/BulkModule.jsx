import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { fetchBulkItems, fetchStats, ingestFile } from '../../lib/api';
import { formatDate, getStatusLabel, getPriorityLabel, truncate } from '../../lib/utils';
import ConfidenceBadge from '../shared/ConfidenceBadge';
import BulkDetailView from './BulkDetailView';
import {
  Inbox,
  Clock,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  ChevronDown,
  Eye,
} from 'lucide-react';

export default function BulkModule() {
  const { t } = useTranslation();
  const { appConfig } = useAppStore();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, itemsData] = await Promise.all([
        fetchStats(),
        fetchBulkItems({
          status: statusFilter || undefined,
          department: deptFilter || undefined,
          priority: priorityFilter || undefined,
        }),
      ]);
      setStats(statsData);
      setItems(itemsData.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deptFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await ingestFile(file);
      }
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.file_name?.toLowerCase().includes(q) ||
      item.source_id?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q)
    );
  });

  // If an item is selected, show detail view
  if (selectedId) {
    return <BulkDetailView sourceId={selectedId} onBack={() => setSelectedId(null)} onRefresh={loadData} />;
  }

  const statCards = stats
    ? [
        { key: 'total', value: stats.total, icon: Inbox, color: '#1a3a5c' },
        { key: 'pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
        { key: 'draft_ready', value: stats.draft_ready, icon: FileCheck, color: '#8b5cf6' },
        { key: 'approved', value: stats.approved, icon: CheckCircle2, color: '#22c55e' },
        { key: 'rejected', value: stats.rejected, icon: XCircle, color: '#ef4444' },
        { key: 'urgent', value: stats.urgent, icon: AlertTriangle, color: '#dc2626' },
      ]
    : [];

  const departments = appConfig?.departments || {};

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Title Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="module-title tamil-text" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('bulk.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading} style={{ fontSize: '0.88rem' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="stat-card"
                onClick={() => {
                  if (card.key !== 'total' && card.key !== 'urgent') {
                    setStatusFilter(card.key === 'pending' ? 'pending' : card.key);
                  } else {
                    setStatusFilter('');
                  }
                }}
                style={{ borderLeft: `4px solid ${card.color}`, padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
                <div className="stat-value" style={{ fontSize: '1.8rem' }}>{card.value}</div>
                <div className="stat-label tamil-text" style={{ fontSize: '0.95rem' }}>{t(`bulk.${card.key}`)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-input').click()}
        style={{ padding: '24px 16px' }}
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.eml"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }} className="tamil-text">
          {uploading ? t('common.loading') : t('bulk.upload')}
        </div>
        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: 4 }} className="tamil-text">
          {t('bulk.upload_desc')}
        </div>
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--color-surface-input)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 8,
          padding: '6px 12px',
          flex: '1 1 240px',
          maxWidth: 360,
        }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{ paddingRight: 28, appearance: 'none', cursor: 'pointer', color: '#000000', fontSize: '1rem' }}
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{t('bulk.filter_all')}</option>
            <option value="pending" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getStatusLabel('pending')}</option>
            <option value="ocr_done" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getStatusLabel('ocr_done')}</option>
            <option value="draft_ready" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getStatusLabel('draft_ready')}</option>
            <option value="approved" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getStatusLabel('approved')}</option>
            <option value="rejected" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getStatusLabel('rejected')}</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>

        {/* Department Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm tamil-text"
            style={{ paddingRight: 28, appearance: 'none', cursor: 'pointer', color: '#000000', fontSize: '1rem' }}
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{t('bulk.filter_by_dept')}</option>
            {Object.entries(departments).map(([tamilName, engName]) => (
              <option key={tamilName} value={tamilName} style={{ color: '#000000', backgroundColor: '#ffffff' }}>{tamilName}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>

        {/* Priority Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{ paddingRight: 28, appearance: 'none', cursor: 'pointer', color: '#000000', fontSize: '1rem' }}
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{t('bulk.filter_by_priority')}</option>
            <option value="HIGH" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getPriorityLabel('HIGH')}</option>
            <option value="MEDIUM" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getPriorityLabel('MEDIUM')}</option>
            <option value="LOW" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getPriorityLabel('LOW')}</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: 8,
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertTriangle size={16} />
          {error}
          <button className="btn btn-sm btn-danger" onClick={loadData} style={{ marginLeft: 'auto', fontSize: '0.88rem' }}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <Inbox size={64} style={{ color: 'var(--color-text-muted)' }} className="empty-icon" />
          <div className="empty-title tamil-text" style={{ fontSize: '1.05rem' }}>{t('bulk.no_items')}</div>
          <div className="empty-desc tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.no_items_desc')}</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.file_name')}</th>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.type')}</th>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.department')}</th>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.priority')}</th>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.status')}</th>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.received')}</th>
                <th className="tamil-text" style={{ fontSize: '0.95rem' }}>{t('bulk.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr
                  key={item.source_id}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="animate-fade-in"
                >
                  <td style={{ fontSize: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{truncate(item.file_name, 30)}</span>
                      {item.hallucination_score != null && (
                        <ConfidenceBadge score={1 - item.hallucination_score} showLabel={false} size={12} />
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '1rem' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      background: item.source_type === 'email' ? '#dbeafe' : '#fef3c7',
                      color: item.source_type === 'email' ? '#1e40af' : '#92400e',
                    }}>
                      {item.source_type === 'email' ? '📧 Email' : '📄 Scan'}
                    </span>
                  </td>
                  <td className="tamil-text" style={{ fontSize: '1rem' }}>
                    {item.department}
                  </td>
                  <td style={{ fontSize: '1rem' }}>
                    <span className={`priority-${item.priority?.toLowerCase()}`}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </td>
                  <td style={{ fontSize: '1rem' }}>
                    <span className={`status-badge status-${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(item.received_at)}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedId(item.source_id)}
                      title={t('bulk.view_detail')}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
