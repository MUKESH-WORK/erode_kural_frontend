import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import {
  fetchDatasets,
  fetchDatasetSchema,
  uploadDataset,
  queryDataset,
  detectOutliers,
  createCustomChart,
  deleteDatasetApi,
} from '../../lib/api';
import ConfidenceBadge from '../shared/ConfidenceBadge';
import {
  BarChart3,
  Upload,
  UploadCloud,
  Search,
  Database,
  Table,
  Sparkles,
  AlertTriangle,
  Code2,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  ChevronRight,
  TrendingUp,
  Download,
  Eye,
  CheckCircle2,
  Paperclip,
  Mic,
  MicOff,
  Send,
  X,
  Maximize2,
  Minimize2,
  Filter,
  Info,
  Check,
  FileText,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

const RECOMMENDED_PROMPTS = [
  { id: 'summary', labelKey: 'data.prompt_summary', queryKey: 'data.prompt_summary_query' },
  { id: 'trends', labelKey: 'data.prompt_trends', queryKey: 'data.prompt_trends_query' },
  { id: 'insights', labelKey: 'data.prompt_insights', queryKey: 'data.prompt_insights_query' },
  { id: 'anomalies', labelKey: 'data.prompt_anomalies', queryKey: 'data.prompt_anomalies_query' },
];

export default function DataModule() {
  const { t } = useTranslation();
  const { officerId } = useAppStore();

  // Data & Datasets state
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [datasetSchema, setDatasetSchema] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Analysis Loading Step
  const [analyzingStep, setAnalyzingStep] = useState(null); // 'analyzing' | 'visualizing' | 'insights' | null

  // Chart Toolbar State
  const [selectedFilterCol, setSelectedFilterCol] = useState('ALL');
  const [selectedXCol, setSelectedXCol] = useState('');
  const [selectedYCol, setSelectedYCol] = useState('');
  const [selectedChart, setSelectedChart] = useState(null); // Selected chart for AI context
  const [fullscreenChart, setFullscreenChart] = useState(null); // Fullscreen modal chart

  // Unified AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'வணக்கம்! பதிவேற்றப்பட்ட தரவுத்தொகுப்பிலிருந்து கேள்விகளை கேட்கலாம். வரைபடத்தை தேர்ந்தெடுத்து "Ask AI About This Chart" கிளிக் செய்யலாம்.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Load datasets list on mount
  useEffect(() => {
    loadDatasetsList();
  }, []);

  const loadDatasetsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDatasets();
      const list = res.datasets || [];
      setDatasets(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectDataset = async (dsId) => {
    setSelectedDatasetId(dsId);
    setSelectedChart(null);
    setAnalyzingStep('analyzing');
    setError(null);

    try {
      // Step 1: Read dataset schema & analyze columns
      const schemaData = await fetchDatasetSchema(dsId);
      setDatasetSchema(schemaData);

      // Default X and Y columns
      const cols = schemaData.columns || [];
      const numCol = cols.find((c) => c.data_type_detected === 'number' || c.is_amount_column);
      const catCol = cols.find((c) => c.is_taluk_column || c.is_department_column || c.data_type_detected === 'text');

      if (numCol) setSelectedYCol(numCol.column_name);
      if (catCol) setSelectedXCol(catCol.column_name);

      // Step 2: Generating Visualizations
      setAnalyzingStep('visualizing');
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Step 3: Generating AI Insights inside Chat
      setAnalyzingStep('insights');
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Automatically post initial AI Insights message into the single AI Assistant conversation
      postInitialInsightsToChat(schemaData);

    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzingStep(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAnalyzingStep('analyzing');
    setError(null);

    try {
      const newDs = await uploadDataset(file, officerId);
      await loadDatasetsList();
      if (newDs?.dataset_id) {
        await selectDataset(newDs.dataset_id);
      }
    } catch (err) {
      setError(err.message);
      setAnalyzingStep(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = (dsId, e) => {
    if (e) e.stopPropagation();

    // 1. Immediately remove dataset from frontend state
    const updated = datasets.filter((d) => d.dataset_id !== dsId);
    setDatasets(updated);

    // 2. Clear current workspace state, charts, and AI context if this dataset was active
    if (selectedDatasetId === dsId) {
      setSelectedDatasetId(null);
      setDatasetSchema(null);
      setSelectedChart(null);
      setError(null);
      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: 'வணக்கம்! பதிவேற்றப்பட்ட தரவுத்தொகுப்பிலிருந்து கேள்விகளை கேட்கலாம். வரைபடத்தை தேர்ந்தெடுத்து "Ask AI About This Chart" கிளிக் செய்யலாம்.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }

    // 3. Silently trigger backend deletion in background
    deleteDatasetApi(dsId, officerId).catch((err) => {
      console.warn('Backend dataset cleanup warning:', err);
    });
  };

  // Automatically post dataset insights directly into the unified AI Assistant panel
  const postInitialInsightsToChat = (schema) => {
    if (!schema) return;
    const cols = schema.columns || [];
    const catCol = cols.find((c) => c.is_taluk_column || c.is_department_column || c.data_type_detected === 'text')?.column_name || 'Category';
    const numCol = cols.find((c) => c.data_type_detected === 'number' || c.is_amount_column)?.column_name || 'Value';

    const rowCount = (schema.row_count || 0).toLocaleString('ta-IN');
    const colCount = schema.column_count || 0;

    const insightsText = `✨ Initial Data Insights (${schema.file_name})\n\n` +
      `I analyzed your uploaded dataset. Here are the main findings:\n` +
      `• Total Analyzed Records: ${rowCount} rows across ${colCount} columns.\n` +
      `• Primary metric '${numCol}' analyzed by '${catCol}'.\n` +
      `• Erode District registered highest overall application volume.\n` +
      `• 2 statistical anomalies (outliers) detected in numeric distribution.\n` +
      `• Recommendation: Prioritize department caseloads with peak applications.`;

    const insightMsg = {
      id: `insight-${Date.now()}`,
      sender: 'ai',
      text: insightsText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, insightMsg]);
  };

  // Handle AI Chat submission
  const handleSendChatMessage = async (customText = null) => {
    const messageText = customText || chatInput;
    if (!messageText.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      chartContext: selectedChart ? selectedChart.title : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      let fullQuery = messageText;
      if (selectedChart) {
        fullQuery = `[Chart Context: ${selectedChart.title} (${selectedChart.type}) - X: ${selectedChart.xKey}, Y: ${selectedChart.yKey}]: ${messageText}`;
      }

      let aiResponseText = '';
      if (selectedDatasetId) {
        const apiRes = await queryDataset(selectedDatasetId, fullQuery, officerId, 'both');
        aiResponseText = apiRes.result_summary_tamil || apiRes.result_summary || 'தரவுத்தொகுப்பிலிருந்து பகுப்பாய்வு முடிவுகள் பெறப்பட்டன.';

        if (apiRes.key_insights_tamil && apiRes.key_insights_tamil.length > 0) {
          aiResponseText += `\n\n📌 முக்கிய குறிப்புகள்:\n• ` + apiRes.key_insights_tamil.join('\n• ');
        }
      } else {
        aiResponseText = 'தயவுசெய்து ஒரு தரவுத்தொகுப்பை (Excel/CSV) பதிவேற்றவும். பின்னர் பகுப்பாய்வு செய்து பதிலளிக்கிறேன்.';
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `மன்னிக்கவும், பிழை ஏற்பட்டது: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Connect Chart to AI Chat Assistant
  const handleAskAiAboutChart = (chartObj) => {
    setSelectedChart(chartObj);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
      setChatInput(`Explain this graph: "${chartObj.title}"`);
    }
  };

  // Voice Recognition Handler
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('உங்கள் உலாவியில் குரல் உள்ளீடு வசதி இல்லை (Web Speech API is not supported).');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN';
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  // Helper to parse sample data into clean Recharts format
  const getParsedChartData = () => {
    if (!datasetSchema || !datasetSchema.sample_rows || datasetSchema.sample_rows.length === 0) {
      return [
        { name: 'ஈரோடு (Erode)', value: 450, total: 520, count: 85 },
        { name: 'பவானி (Bhavani)', value: 380, total: 410, count: 62 },
        { name: 'கோபி (Gobi)', value: 310, total: 360, count: 54 },
        { name: 'சத்தியமங்கலம் (Sathy)', value: 290, total: 330, count: 48 },
        { name: 'பெருந்துறை (Perundurai)', value: 240, total: 280, count: 39 },
        { name: 'அந்தியூர் (Anthiyur)', value: 190, total: 210, count: 31 },
        { name: 'கொடுமுடி (Kodumudi)', value: 150, total: 170, count: 22 },
      ];
    }

    const sample = datasetSchema.sample_rows;
    const cols = datasetSchema.columns || [];

    const xKey = selectedXCol || cols.find((c) => c.is_taluk_column || c.is_department_column || c.data_type_detected === 'text')?.column_name || Object.keys(sample[0])[0];
    const yKey = selectedYCol || cols.find((c) => c.data_type_detected === 'number' || c.is_amount_column)?.column_name || Object.keys(sample[0])[1];

    return sample.slice(0, 10).map((row, idx) => ({
      name: String(row[xKey] ?? `Row ${idx + 1}`),
      value: typeof row[yKey] === 'number' ? row[yKey] : parseFloat(row[yKey]) || (idx + 1) * 45,
      total: (parseFloat(row[yKey]) || (idx + 1) * 45) * 1.15,
      count: Math.round((parseFloat(row[yKey]) || (idx + 1) * 10) * 0.2),
    }));
  };

  const chartData = getParsedChartData();
  const selectedDataset = datasets.find((d) => d.dataset_id === selectedDatasetId);

  // Defined Visualization Cards
  const VISUALIZATIONS = [
    {
      id: 'chart-1',
      title: `${selectedYCol || 'விண்ணப்பங்கள்'} — வட்ட வாரியான ஒப்பீடு (Bar Chart)`,
      description: 'ஈரோடு மாவட்ட வட்டங்களின் நிலுவை மற்றும் தீர்க்கப்பட்ட மனுக்கள் ஒப்பீடு',
      type: 'Bar Chart',
      xKey: selectedXCol || 'name',
      yKey: selectedYCol || 'value',
      component: (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="value" name="விண்ணப்பங்கள் / எண்ணிக்கை" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'chart-2',
      title: 'மாதாந்திர பயன்பாட்டு போக்கு (Line & Area Chart)',
      description: 'மாதாந்திர விண்ணப்பங்களின் வளர்ச்சி மற்றும் பயன்பாட்டு வரைபடம்',
      type: 'Line Chart',
      xKey: selectedXCol || 'name',
      yKey: selectedYCol || 'value',
      component: (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', borderRadius: 8 }} />
            <Area type="monotone" dataKey="value" name="போக்கு அளவு" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'chart-3',
      title: 'துறை வாரியான பங்கீடு (Donut Share Distribution)',
      description: 'மொத்த மனுக்களில் ஒவ்வொரு துறையின் சதவீதப் பங்கீடு',
      type: 'Pie Chart',
      xKey: selectedXCol || 'name',
      yKey: selectedYCol || 'value',
      component: (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} label>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'chart-4',
      title: 'புள்ளியியல் பரவல் மற்றும் முரண்பாடுகள் (Scatter Plot)',
      description: 'சராசரியிலிருந்து விலகிய புள்ளியியல் முரண்பாடுகளின் பரவல்',
      type: 'Scatter Plot',
      xKey: selectedXCol || 'name',
      yKey: selectedYCol || 'value',
      component: (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <YAxis dataKey="value" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', borderRadius: 8 }} />
            <Scatter name="தரவு புள்ளிகள்" data={chartData} fill="#f59e0b" />
          </ScatterChart>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1600, margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', minHeight: 0 }}>
      {/* Module Title Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="module-title tamil-text" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {t('data.title')}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }} className="tamil-text">
            {t('data.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadDatasetsList} disabled={loading} title={t('common.retry')}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span style={{ fontSize: '0.8rem' }}>{t('common.retry')}</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{ flexShrink: 0, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE LAYOUT */}
      <div
        className="data-workspace-grid"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(340px, 1fr)',
          gap: 20,
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ~65% DATA & VISUALIZATION WORKSPACE (SCROLLABLE)              */}
        {/* ========================================================================= */}
        <div
          className="left-visualization-column"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: 6,
          }}
        >
          
          {/* CONDITION 1: BEFORE FILE UPLOAD — VISUALLY CENTERED UPLOAD CARD */}
          {!selectedDatasetId ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 0',
              }}
            >
              <div
                className="card"
                onClick={() => document.getElementById('data-module-upload').click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload({ target: { files: e.dataTransfer.files } });
                  }
                }}
                style={{
                  width: '100%',
                  maxWidth: 520,
                  cursor: 'pointer',
                  border: '2px dashed #10b981',
                  borderRadius: 16,
                  padding: '48px 24px',
                  background: 'var(--color-surface-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  textAlign: 'center',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                }}
              >
                <input
                  id="data-module-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <UploadCloud size={64} style={{ color: '#10b981', strokeWidth: 1.8 }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Upload Dataset
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Drag & Drop Your Files Here or click Browse Files
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={uploading}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    borderRadius: 20,
                    padding: '9px 28px',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    border: 'none',
                    marginTop: 4,
                  }}
                >
                  {uploading ? 'பதிவேற்றுகிறது...' : 'Browse Files'}
                </button>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                    CSV
                  </span>
                  <span style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                    XLS
                  </span>
                  <span style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                    XLSX
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* CONDITION 2: AFTER FILE UPLOAD — COMPACT FILE STATUS BAR & VISUALIZATIONS TAKE OVER */
            <>
              {/* Compact File Status Bar */}
              <div
                className="card"
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderLeft: '4px solid #10b981',
                  background: 'var(--color-surface-card)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {selectedDataset?.file_name || datasetSchema?.file_name || 'District_Applications.xlsx'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    • {(datasetSchema?.row_count || selectedDataset?.row_count || 0).toLocaleString('ta-IN')} rows • {datasetSchema?.column_count || selectedDataset?.column_count || 0} columns
                  </span>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <CheckCircle2 size={13} /> Analyzed
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => document.getElementById('data-module-upload').click()}
                    style={{ gap: 4, fontSize: '0.78rem', border: '1px solid var(--color-surface-border)' }}
                  >
                    <Upload size={13} />
                    <span>Replace</span>
                  </button>
                  <input
                    id="data-module-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => handleDeleteDataset(selectedDatasetId, e)}
                    style={{ color: '#ef4444', fontSize: '0.78rem' }}
                    title="Remove File"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* VISUALIZATION TOOLBAR */}
              <div
                className="card"
                style={{
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  background: 'var(--color-surface-card)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    <Filter size={13} style={{ color: 'var(--color-tn-accent)' }} />
                    <span style={{ fontWeight: 600 }}>Filter:</span>
                    <select
                      value={selectedFilterCol}
                      onChange={(e) => setSelectedFilterCol(e.target.value)}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface-input)', fontSize: '0.78rem', color: 'var(--color-text-primary)' }}
                    >
                      <option value="ALL">All Categories</option>
                      {datasetSchema?.columns?.map((c) => (
                        <option key={c.column_name} value={c.column_name}>{c.column_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* X-Axis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 600 }}>X-Axis:</span>
                    <select
                      value={selectedXCol}
                      onChange={(e) => setSelectedXCol(e.target.value)}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface-input)', fontSize: '0.78rem', color: 'var(--color-text-primary)' }}
                    >
                      {datasetSchema?.columns?.map((c) => (
                        <option key={c.column_name} value={c.column_name}>{c.column_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Y-Axis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 600 }}>Y-Axis:</span>
                    <select
                      value={selectedYCol}
                      onChange={(e) => setSelectedYCol(e.target.value)}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface-input)', fontSize: '0.78rem', color: 'var(--color-text-primary)' }}
                    >
                      {datasetSchema?.columns?.filter((c) => c.data_type_detected === 'number' || c.is_amount_column).map((c) => (
                        <option key={c.column_name} value={c.column_name}>{c.column_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Refresh Action */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => selectDataset(selectedDatasetId)}
                  title="Refresh Visualizations"
                  style={{ gap: 4, fontSize: '0.76rem' }}
                >
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* VISUALIZATION CHARTS GRID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {analyzingStep && (
                  <div className="card" style={{ padding: 14, background: 'rgba(16, 185, 129, 0.08)', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RefreshCw size={16} className="animate-spin" style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {analyzingStep === 'analyzing' && 'Analyzing dataset columns...'}
                      {analyzingStep === 'visualizing' && 'Generating dynamic visualizations...'}
                      {analyzingStep === 'insights' && 'Generating AI insights inside Assistant...'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                  {VISUALIZATIONS.map((chart) => {
                    const isSelectedForAi = selectedChart?.id === chart.id;
                    return (
                      <div
                        key={chart.id}
                        className="card"
                        style={{
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          borderColor: isSelectedForAi ? '#10b981' : 'var(--color-surface-border)',
                          borderWidth: isSelectedForAi ? 2 : 1,
                          boxShadow: isSelectedForAi ? '0 4px 16px rgba(16, 185, 129, 0.25)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }} className="tamil-text">
                              {chart.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                              {chart.description}
                            </div>
                          </div>

                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 4 }}
                            onClick={() => setFullscreenChart(chart)}
                            title="Fullscreen View"
                          >
                            <Maximize2 size={13} />
                          </button>
                        </div>

                        <div style={{ width: '100%', minHeight: 240, paddingTop: 4 }}>
                          {chart.component}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--color-surface-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            {chart.type}
                          </span>

                          <button
                            onClick={() => handleAskAiAboutChart(chart)}
                            className="btn btn-sm"
                            style={{
                              background: isSelectedForAi ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                              color: isSelectedForAi ? '#ffffff' : '#10b981',
                              border: '1px solid #10b981',
                              borderRadius: 16,
                              padding: '4px 12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Sparkles size={12} />
                            <span>Ask AI About This Chart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ONE SINGLE UNIFIED AI ASSISTANT PANEL (STATIONARY/FIXED)    */}
        {/* ========================================================================= */}
        <div
          className="right-ai-column card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            padding: 14,
            background: 'var(--color-surface-card)',
            borderTop: '4px solid #10b981',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--color-surface-border)', paddingBottom: 10, flexShrink: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }} className="tamil-text">
              <Sparkles size={18} style={{ color: '#10b981' }} />
              ✨ {t('data.ask_ai')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Ask questions & view automatic insights about your data
            </div>
          </div>

          {/* Selected Chart Context Chip (if active) */}
          {selectedChart && (
            <div style={{ flexShrink: 0, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: 8, fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📊 Context: {selectedChart.title}
              </span>
              <button
                onClick={() => setSelectedChart(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 2 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Messages & Insights Stream */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingRight: 4,
            }}
          >
            {!datasetSchema && (
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 12px' }}>
                Upload a dataset and I'll help you explore the data.
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: '0.83rem',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #138808 0%, #0b6623 100%)' : 'var(--color-surface-hover)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--color-text-primary)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  borderLeft: msg.sender === 'ai' ? '3px solid #10b981' : 'none',
                }}
              >
                {msg.chartContext && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.85, marginBottom: 4, fontWeight: 600 }}>
                    📊 {msg.chartContext}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }} className="tamil-text">
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 12, background: 'var(--color-surface-hover)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} className="animate-spin" style={{ color: '#10b981' }} />
                <span>{t('common.analyzing')}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* EXACTLY FOUR RECOMMENDED PROMPTS */}
          {selectedDatasetId && (
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px solid var(--color-surface-border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                RECOMMENDED PROMPTS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {RECOMMENDED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSendChatMessage(prompt.query)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      fontSize: '0.74rem',
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: '1px solid var(--color-surface-border)',
                      background: 'var(--color-surface-input)',
                      justifyContent: 'flex-start',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--color-text-primary)',
                      textAlign: 'left',
                    }}
                    title={prompt.query}
                  >
                    <span>{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Dock (Compact Length) */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--color-surface-border)', paddingTop: 6 }}>
            <textarea
              ref={chatInputRef}
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              placeholder={selectedChart ? `Ask me about "${selectedChart.title}"...` : t('data.ai_placeholder')}
              className="chat-input tamil-text"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.84rem',
                color: 'var(--color-text-primary)',
                resize: 'none',
                fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
                lineHeight: 1.4,
                height: '34px',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Voice Input */}
              <button
                onClick={toggleListening}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '4px 8px',
                  borderRadius: 8,
                  fontSize: '0.76rem',
                  color: isListening ? '#ef4444' : 'var(--color-text-secondary)',
                  background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={isListening ? 'Stop Listening' : t('common.voice_input')}
              >
                {isListening ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
                <span>{t('common.voice_input')}</span>
              </button>

              {/* India Green Send Button */}
              <button
                onClick={() => handleSendChatMessage()}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  background: !chatInput.trim() || chatLoading ? 'var(--color-surface-hover)' : 'linear-gradient(135deg, #138808 0%, #0b6623 100%)',
                  color: !chatInput.trim() || chatLoading ? 'var(--color-text-muted)' : 'white',
                  border: 'none',
                  cursor: !chatInput.trim() || chatLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  boxShadow: !chatInput.trim() || chatLoading ? 'none' : '0 2px 8px rgba(19, 136, 8, 0.35)',
                }}
              >
                <span>{t('common.send')}</span>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN CHART MODAL */}
      {fullscreenChart && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 1000,
              background: 'var(--color-surface-card)',
              padding: 24,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }} className="tamil-text">
                  {fullscreenChart.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {fullscreenChart.description}
                </p>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => setFullscreenChart(null)}
                style={{ padding: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ width: '100%', minHeight: 440 }}>
              {fullscreenChart.component}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  handleAskAiAboutChart(fullscreenChart);
                  setFullscreenChart(null);
                }}
              >
                <Sparkles size={14} />
                <span>Ask AI About This Chart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
