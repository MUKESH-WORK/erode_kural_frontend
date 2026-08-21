import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  UploadCloud,
  RefreshCw,
  Search,
  ChevronDown,
  Eye,
  RotateCcw,
} from 'lucide-react';

// Safely parse date from item fields
function parseItemDate(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

// Truncate option text cleanly for fixed-width select dropdowns
function truncateOption(str, maxLen = 30) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

const monthList = [
  { value: '01', labelEn: 'January', labelTa: 'ஜனவரி' },
  { value: '02', labelEn: 'February', labelTa: 'பிப்ரவரி' },
  { value: '03', labelEn: 'March', labelTa: 'மார்ச்' },
  { value: '04', labelEn: 'April', labelTa: 'ஏப்ரல்' },
  { value: '05', labelEn: 'May', labelTa: 'மே' },
  { value: '06', labelEn: 'June', labelTa: 'ஜூன்' },
  { value: '07', labelEn: 'July', labelTa: 'ஜூலை' },
  { value: '08', labelEn: 'August', labelTa: 'ஆகஸ்ட்' },
  { value: '09', labelEn: 'September', labelTa: 'செப்டம்பர்' },
  { value: '10', labelEn: 'October', labelTa: 'அக்டோபர்' },
  { value: '11', labelEn: 'November', labelTa: 'நவம்பர்' },
  { value: '12', labelEn: 'December', labelTa: 'டிசம்பர்' },
];

const collectorateDepartments = [
  {
    value: 'Revenue and Disaster Management',
    nameEn: 'Revenue and Disaster Management',
    nameTa: 'வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை',
  },
  {
    value: 'Rural Development and Panchayat Raj',
    nameEn: 'Rural Development and Panchayat Raj',
    nameTa: 'ஊரக வளர்ச்சி மற்றும் ஊராட்சித் துறை',
  },
  {
    value: 'Survey and Land Records',
    nameEn: 'Survey and Land Records',
    nameTa: 'நில அளவை மற்றும் நில வரித்திட்டத் துறை',
  },
  {
    value: 'Education',
    nameEn: 'Education',
    nameTa: 'கல்வித் துறை',
  },
  {
    value: 'Public Health and Preventive Medicine',
    nameEn: 'Public Health and Preventive Medicine',
    nameTa: 'பொதுச்சுகாதாரம் மற்றும் நோய்த்தடுப்பு மருந்துத் துறை',
  },
  {
    value: 'Agriculture',
    nameEn: 'Agriculture',
    nameTa: 'வேளாண்மைத் துறை',
  },
  {
    value: 'Forest',
    nameEn: 'Forest',
    nameTa: 'வனத்துறை',
  },
  {
    value: 'Highways',
    nameEn: 'Highways',
    nameTa: 'நெடுஞ்சாலைத் துறை',
  },
  {
    value: 'Election',
    nameEn: 'Election',
    nameTa: 'தேர்தல் துறை',
  },
  {
    value: 'Adi Dravidar and Tribal Welfare',
    nameEn: 'Adi Dravidar and Tribal Welfare',
    nameTa: 'ஆதிதிராவிடர் மற்றும் பழங்குடியினர் நலத்துறை',
  },
  {
    value: 'BC, MBC, DNC and Minorities Welfare',
    nameEn: 'BC, MBC, DNC and Minorities Welfare',
    nameTa: 'பிற்படுத்தப்பட்டோர், மிகவும் பிற்படுத்தப்பட்டோர் மற்றும் சிறுபான்மையினர் நலத்துறை',
  },
  {
    value: 'District Rural Development Agency',
    nameEn: 'District Rural Development Agency',
    nameTa: 'மாவட்ட ஊரக வளர்ச்சி முகமை (DRDA)',
  },
  {
    value: 'Tamil Nadu Housing Board, Erode',
    nameEn: 'Tamil Nadu Housing Board, Erode',
    nameTa: 'தமிழ்நாடு வீட்டுவசதி வாரியம், ஈரோடு',
  },
  {
    value: 'Co-operation, Food and Consumer Protection',
    nameEn: 'Co-operation, Food and Consumer Protection',
    nameTa: 'கூட்டுறவு, உணவு மற்றும் நுகர்வோர் பாதுகாப்புத் துறை',
  },
  {
    value: 'District Industries Centre',
    nameEn: 'District Industries Centre',
    nameTa: 'மாவட்ட தொழில் மையம் (DIC)',
  },
  {
    value: 'Youth Welfare and Sports Development',
    nameEn: 'Youth Welfare and Sports Development',
    nameTa: 'இளைஞர் நலன் மற்றும் விளையாட்டு மேம்பாட்டுத் துறை',
  },
  {
    value: 'Erode Local Planning Authority (ELPA)',
    nameEn: 'Erode Local Planning Authority (ELPA)',
    nameTa: 'ஈரோடு உள்ளூர் திட்டக் குழுமம் (ELPA)',
  },
  {
    value: 'Department of Handlooms',
    nameEn: 'Department of Handlooms',
    nameTa: 'கைத்தறி மற்றும் துணிநூல் துறை',
  },
  {
    value: 'Special District Revenue Office (L.A.), National Highways',
    nameEn: 'Special District Revenue Office (L.A.), National Highways',
    nameTa: 'சிறப்பு மாவட்ட வருவாய் அலுவலர் (நில எடுப்பு), தேசிய நெடுஞ்சாலைகள்',
  },
];

export default function BulkModule() {
  const { t, i18n } = useTranslation();
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
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

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

  // Dynamically generate available years and months from items dataset
  const { dynamicYears, dynamicMonths } = useMemo(() => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    items.forEach((item) => {
      const d = parseItemDate(item.received_at || item.date || item.created_at || item.processed_at);
      if (d) {
        yearsSet.add(String(d.getFullYear()));
        monthsSet.add(String(d.getMonth() + 1).padStart(2, '0'));
      }
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    const sortedMonths = monthList.filter((m) => monthsSet.size === 0 || monthsSet.has(m.value));

    return {
      dynamicYears: sortedYears.length > 0 ? sortedYears : [String(new Date().getFullYear())],
      dynamicMonths: sortedMonths.length > 0 ? sortedMonths : monthList,
    };
  }, [items]);

  // Combined client-side filter (Search -> Year -> Month -> Date -> Dept -> Priority -> Status)
  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.file_name?.toLowerCase().includes(q) ||
        item.source_id?.toLowerCase().includes(q) ||
        item.department?.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter && item.status !== statusFilter) {
      return false;
    }

    if (deptFilter) {
      const selectedDept = collectorateDepartments.find((d) => d.value === deptFilter);
      if (selectedDept) {
        const itemDept = (item.department || '').toLowerCase();
        const val = selectedDept.value.toLowerCase();
        const en = selectedDept.nameEn.toLowerCase();
        const ta = selectedDept.nameTa.toLowerCase();
        const match =
          itemDept === val ||
          itemDept === en ||
          itemDept === ta ||
          itemDept.includes(val) ||
          itemDept.includes(en) ||
          itemDept.includes(ta) ||
          en.includes(itemDept) ||
          ta.includes(itemDept);
        if (!match) return false;
      } else if (item.department !== deptFilter) {
        return false;
      }
    }

    if (priorityFilter && item.priority !== priorityFilter) {
      return false;
    }

    if (dateFilter || monthFilter || yearFilter) {
      const itemDate = parseItemDate(item.received_at || item.date || item.created_at || item.processed_at);
      if (!itemDate) return false;

      if (dateFilter) {
        const itemDateIso = itemDate.toISOString().slice(0, 10);
        const y = itemDate.getFullYear();
        const m = String(itemDate.getMonth() + 1).padStart(2, '0');
        const d = String(itemDate.getDate()).padStart(2, '0');
        const itemDateLocal = `${y}-${m}-${d}`;
        if (itemDateIso !== dateFilter && itemDateLocal !== dateFilter) {
          return false;
        }
      }

      if (monthFilter) {
        const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
        if (itemMonth !== monthFilter && String(itemDate.getMonth() + 1) !== monthFilter) {
          return false;
        }
      }

      if (yearFilter) {
        const itemYear = String(itemDate.getFullYear());
        if (itemYear !== yearFilter) {
          return false;
        }
      }
    }

    return true;
  });

  const hasActiveFilters = Boolean(
    statusFilter || deptFilter || priorityFilter || searchQuery || dateFilter || monthFilter || yearFilter
  );

  const handleClearFilters = () => {
    setStatusFilter('');
    setDeptFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setDateFilter('');
    setMonthFilter('');
    setYearFilter('');
  };

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="module-title tamil-text">{t('bulk.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={loadData}
            disabled={loading}
            style={{ color: 'var(--color-text-primary)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--color-text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
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
                style={{
                  borderLeft: `4px solid ${card.color}`,
                  padding: '10px 14px',
                  gap: 4,
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
                <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{card.value}</div>
                <div className="stat-label tamil-text" style={{ fontSize: '0.75rem' }}>{t(`bulk.${card.key}`)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Zone (Optimized compact footprint to fit 4+ documents in viewport) */}
      <div
        className={`card ${dragOver ? 'drag-over' : ''}`}
        onClick={() => document.getElementById('file-upload-input').click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: '100%',
          cursor: 'pointer',
          border: dragOver ? '2px dashed var(--color-tn-primary, #1a3a5c)' : '2px dashed #10b981',
          borderRadius: 12,
          padding: '10px 14px',
          background: dragOver ? 'rgba(26, 58, 92, 0.04)' : 'var(--color-surface-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.eml"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <UploadCloud size={26} style={{ color: '#10b981', strokeWidth: 1.8 }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }} className="tamil-text">
          {uploading ? t('common.loading') : t('bulk.upload')}
        </div>
        <button
          type="button"
          className="btn"
          disabled={uploading}
          style={{
            background: '#10b981',
            color: '#ffffff',
            borderRadius: 20,
            padding: '4px 16px',
            fontWeight: 600,
            fontSize: '0.78rem',
            border: 'none',
            marginTop: 1,
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById('file-upload-input').click();
          }}
        >
          <span className="tamil-text">{uploading ? t('common.loading') : t('bulk.choose_file', 'Browse Files')}</span>
        </button>

        {/* Separator with dashed lines on both sides */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 220, gap: 8, margin: '1px 0' }}>
          <div style={{ flex: 1, borderBottom: '1px dashed var(--color-surface-border, #cbd5e1)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} className="tamil-text">
            {t('bulk.or_drag_drop', 'or drag and drop here')}
          </span>
          <div style={{ flex: 1, borderBottom: '1px dashed var(--color-surface-border, #cbd5e1)' }} />
        </div>

        {/* File format badges below */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['PDF', 'JPG', 'PNG', 'TIFF', 'EML'].map((ext) => (
            <span
              key={ext}
              style={{
                padding: '1px 6px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                borderRadius: 4,
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              {ext}
            </span>
          ))}
        </div>
      </div>

      {/* Filters Row - Identical width, layout & position stability in English & Tamil */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--color-surface-input)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 8,
          padding: '6px 12px',
          flex: '0 0 200px',
          width: 200,
          boxSizing: 'border-box',
          height: 36,
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
              fontSize: '0.85rem',
              color: 'var(--color-text-primary)',
              minWidth: 0,
            }}
          />
        </div>

        {/* 1. Year Filter */}
        <div style={{ position: 'relative', flex: '0 0 135px', width: 135, boxSizing: 'border-box' }}>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{
              width: '100%',
              height: 36,
              paddingRight: 24,
              appearance: 'none',
              cursor: 'pointer',
              color: '#000000',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
              {t('bulk.filter_by_year', 'Filter by Year')}
            </option>
            {dynamicYears.map((yr) => (
              <option key={yr} value={yr} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                {yr}
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>

        {/* 2. Month Filter */}
        <div style={{ position: 'relative', flex: '0 0 145px', width: 145, boxSizing: 'border-box' }}>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{
              width: '100%',
              height: 36,
              paddingRight: 24,
              appearance: 'none',
              cursor: 'pointer',
              color: '#000000',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
              {t('bulk.filter_by_month', 'Filter by Month')}
            </option>
            {dynamicMonths.map((m) => (
              <option key={m.value} value={m.value} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                {i18n.language === 'ta' ? m.labelTa : m.labelEn}
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>

        {/* 3. Date Filter */}
        <div style={{ position: 'relative', flex: '0 0 140px', width: 140, boxSizing: 'border-box' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{
              width: '100%',
              height: 36,
              paddingRight: 6,
              cursor: 'pointer',
              color: '#000000',
              boxSizing: 'border-box',
            }}
            title={t('bulk.filter_by_date', 'Filter by Date')}
          />
        </div>

        {/* 4. Department Filter */}
        <div style={{ position: 'relative', flex: '0 0 210px', width: 210, boxSizing: 'border-box' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm tamil-text"
            style={{
              width: '100%',
              height: 36,
              paddingRight: 24,
              appearance: 'none',
              cursor: 'pointer',
              color: '#000000',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
            title={
              deptFilter
                ? (collectorateDepartments.find((d) => d.value === deptFilter)?.[i18n.language === 'ta' ? 'nameTa' : 'nameEn'] || deptFilter)
                : t('bulk.filter_by_dept')
            }
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{t('bulk.filter_by_dept')}</option>
            {collectorateDepartments.map((dept) => {
              const deptName = i18n.language === 'ta' ? dept.nameTa : dept.nameEn;
              return (
                <option
                  key={dept.value}
                  value={dept.value}
                  title={deptName}
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  {truncateOption(deptName, 30)}
                </option>
              );
            })}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>

        {/* 5. Priority Filter */}
        <div style={{ position: 'relative', flex: '0 0 140px', width: 140, boxSizing: 'border-box' }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{
              width: '100%',
              height: 36,
              paddingRight: 24,
              appearance: 'none',
              cursor: 'pointer',
              color: '#000000',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{t('bulk.filter_by_priority')}</option>
            <option value="HIGH" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getPriorityLabel('HIGH')}</option>
            <option value="MEDIUM" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getPriorityLabel('MEDIUM')}</option>
            <option value="LOW" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{getPriorityLabel('LOW')}</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#000000' }} />
        </div>

        {/* 6. Status Filter */}
        <div style={{ position: 'relative', flex: '0 0 130px', width: 130, boxSizing: 'border-box' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select btn btn-ghost btn-sm"
            style={{
              width: '100%',
              height: 36,
              paddingRight: 24,
              appearance: 'none',
              cursor: 'pointer',
              color: '#000000',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
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

        {/* Clear/Reset Filters Button */}
        {hasActiveFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClearFilters}
            style={{
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              height: 36,
              flex: '0 0 auto',
              whiteSpace: 'nowrap',
            }}
            title={t('bulk.clear_filters', 'Clear Filters')}
          >
            <RotateCcw size={14} />
            <span>{t('bulk.clear_filters', 'Clear Filters')}</span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: 8,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertTriangle size={16} />
          {error}
          <button className="btn btn-sm btn-danger" onClick={loadData} style={{ marginLeft: 'auto' }}>
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
          <div className="empty-title tamil-text">{t('bulk.no_items')}</div>
          <div className="empty-desc tamil-text">{t('bulk.no_items_desc')}</div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: 0,
            height: '270px',
            maxHeight: '270px',
            overflowY: 'scroll',
            overflowX: 'auto',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            border: '1px solid var(--color-surface-border)',
            marginBottom: 16,
          }}
        >
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.file_name')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.type')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.department')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.priority')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.status')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.received')}</th>
                <th className="tamil-text" style={{ position: 'sticky', top: 0, background: 'var(--color-surface-hover)', zIndex: 5, boxShadow: '0 1px 0 var(--color-surface-border)' }}>{t('bulk.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr
                  key={item.source_id}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="animate-fade-in"
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{truncate(item.file_name, 30)}</span>
                      {item.hallucination_score != null && (
                        <ConfidenceBadge score={1 - item.hallucination_score} showLabel={false} size={12} />
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: item.source_type === 'email' ? '#dbeafe' : '#fef3c7',
                      color: item.source_type === 'email' ? '#1e40af' : '#92400e',
                    }}>
                      {item.source_type === 'email' ? '📧 Email' : '📄 Scan'}
                    </span>
                  </td>
                  <td className="tamil-text" style={{ fontSize: '0.8rem' }}>
                    {item.department}
                  </td>
                  <td>
                    <span className={`priority-${item.priority?.toLowerCase()}`}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(item.received_at)}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedId(item.source_id)}
                      title={t('bulk.view_detail')}
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
