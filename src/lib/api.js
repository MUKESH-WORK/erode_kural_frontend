const API_BASE = '/api';

/**
 * Centralized API call wrapper with error handling.
 * All frontend data fetching goes through this function.
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    // Handle file downloads
    if (response.headers.get('content-type')?.includes('application/vnd.openxmlformats')) {
      return response.blob();
    }
    return response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// ─── Config ──────────────────────────────────────────
export const fetchConfig = () => apiCall('/config');

// ─── Dashboard Stats ─────────────────────────────────
export const fetchStats = () => apiCall('/stats');

// ─── Bulk Workflow ───────────────────────────────────
export const fetchBulkItems = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.department) query.set('department', params.department);
  if (params.priority) query.set('priority', params.priority);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiCall(`/bulk/items${qs ? `?${qs}` : ''}`);
};

export const fetchBulkItemDetail = (sourceId) => apiCall(`/bulk/${sourceId}`);

export const approveItem = (sourceId, officerId, action = 'approve') =>
  apiCall(`/bulk/${sourceId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ officer_id: officerId, action }),
  });

export const editDraft = (sourceId, officerId, draftText) =>
  apiCall(`/bulk/${sourceId}/edit-draft`, {
    method: 'POST',
    body: JSON.stringify({ officer_id: officerId, draft_text: draftText }),
  });

export const generateFileNumber = (sourceId, department, officerId) =>
  apiCall(`/bulk/${sourceId}/generate-file-number`, {
    method: 'POST',
    body: JSON.stringify({ department, officer_id: officerId }),
  });

export const exportDocx = (sourceId) => apiCall(`/bulk/${sourceId}/export-docx`);

export const ingestFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiCall('/bulk/ingest', { method: 'POST', body: formData });
};

// ─── Audit ───────────────────────────────────────────
export const fetchAuditLog = (limit = 100) => apiCall(`/audit?limit=${limit}`);

// ─── Chat (stub) ─────────────────────────────────────
export const sendChat = (message, officerId) =>
  apiCall('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, officer_id: officerId }),
  });

// ─── Document (stub) ─────────────────────────────────
export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiCall('/document/upload', { method: 'POST', body: formData });
};

export const fetchDocumentSummary = (docId) => apiCall(`/document/${docId}/summary`);

// ─── Module 2: Data & Visualization ─────────────────
export const fetchDatasets = (officerId = null) => {
  const query = officerId ? `?officer_id=${encodeURIComponent(officerId)}` : '';
  return apiCall(`/v2/data/datasets${query}`);
};

export const fetchDatasetSchema = (datasetId) =>
  apiCall(`/v2/data/datasets/${datasetId}/schema`);

export const uploadDataset = (file, officerId = 'OFFICER') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('officer_id', officerId);
  return apiCall('/v2/data/upload', { method: 'POST', body: formData });
};

export const queryDataset = (datasetId, question, officerId = 'OFFICER', outputFormat = 'both', chartType = null) =>
  apiCall('/v2/data/query', {
    method: 'POST',
    body: JSON.stringify({
      dataset_id: datasetId,
      question,
      officer_id: officerId,
      output_format: outputFormat,
      chart_type: chartType,
    }),
  });

export const detectOutliers = (datasetId, column, method = 'iqr', groupBy = null) =>
  apiCall('/v2/data/outliers', {
    method: 'POST',
    body: JSON.stringify({
      dataset_id: datasetId,
      column,
      method,
      group_by: groupBy,
    }),
  });

export const createCustomChart = (datasetId, chartType, xCol, yCol, titleTamil, officerId = 'OFFICER') =>
  apiCall('/v2/data/chart', {
    method: 'POST',
    body: JSON.stringify({
      dataset_id: datasetId,
      chart_type: chartType,
      x_column: xCol,
      y_column: yCol,
      title_tamil: titleTamil,
      officer_id: officerId,
    }),
  });

export const deleteDatasetApi = (datasetId, officerId = 'OFFICER') =>
  apiCall(`/v2/data/datasets/${datasetId}?officer_id=${encodeURIComponent(officerId)}`, {
    method: 'DELETE',
  });

// ─── Content (stub) ──────────────────────────────────
export const generateContent = (templateType, fields, officerId) =>
  apiCall('/content/generate', {
    method: 'POST',
    body: JSON.stringify({ template_type: templateType, fields, officer_id: officerId }),
  });

