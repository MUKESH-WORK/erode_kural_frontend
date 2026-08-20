import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format ISO date to Tamil-friendly display */
export function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleString('ta-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

/** Truncate text with ellipsis */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Get confidence level from numeric score */
export function getConfidenceLevel(score) {
  if (score >= 0.85) return 'high';
  if (score >= 0.60) return 'medium';
  return 'low';
}

/** Get status display label (Tamil) */
export function getStatusLabel(status) {
  const map = {
    pending: 'நிலுவையில்',
    ocr_done: 'OCR முடிந்தது',
    classified: 'வகைப்படுத்தப்பட்டது',
    draft_ready: 'வரைவு தயார்',
    approved: 'அங்கீகரிக்கப்பட்டது',
    rejected: 'நிராகரிக்கப்பட்டது',
  };
  return map[status] || status;
}

/** Get priority label (Tamil) */
export function getPriorityLabel(priority) {
  const map = {
    HIGH: 'உயர்',
    MEDIUM: 'நடுத்தர',
    LOW: 'குறைந்த',
  };
  return map[priority] || priority;
}

/** Download a Blob as a file */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
