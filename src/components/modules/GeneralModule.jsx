import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { sendChat, uploadDocument } from '../../lib/api';
import TnEmblem from '../icons/TnEmblem';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Mic,
  MicOff,
  FileText,
  RefreshCw,
  Download,
  Paperclip,
  Upload,
  X,
  Plus,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const DOC_SUGGESTION_KEYS = [
  'general.doc_suggestion1',
  'general.doc_suggestion2',
  'general.doc_suggestion3',
  'general.doc_suggestion4',
];



export default function GeneralModule() {
  const { t, i18n } = useTranslation();
  const { officerId } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    try {
      await uploadDocument(uploadedFile);
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  // Handle Speech Recognition
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // Text to Speech
  const toggleSpeech = (id, text) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Message Text
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear Conversation
  const handleClear = () => {
    if (window.confirm(t('general.confirm_clear'))) {
      setMessages([]);
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      setFile(null);
    }
  };

  // Export Transcript
  const handleExport = () => {
    if (messages.length === 0) return;
    const textContent = messages
      .map((m) => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `General_Assistant_Transcript_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (textToSend) => {
    const rawText = textToSend || input;
    if ((!rawText.trim() && !file) || loading) return;

    const messageText = file 
      ? `[${t('common.attachment')}: ${file.name}] ${rawText.trim() || t('general.doc_received')}`
      : rawText.trim();

    const currentLocale = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setFile(null);
    setLoading(true);

    try {
      const res = await sendChat(messageText, officerId);
      const aiContent = res.blocks?.[0]?.content || 'Completed.';
      const aiMsg = {
        id: res.message_id || `ai_${Date.now()}`,
        sender: 'ai',
        text: aiContent,
        timestamp: new Date().toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `${t('common.error')}: ${err.message || t('general.server_error')}`,
        timestamp: new Date().toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', gap: 12, overflow: 'hidden' }}>
      {/* Main Center Container */}
      <div
        className="card"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 20,
          position: 'relative',
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Subtle Background Emblem Watermark */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.05,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TnEmblem size={280} opacity={1} />
        </div>

        {/* Actions Bar if messages present */}
        {messages.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingBottom: 6,
              borderBottom: '1px solid var(--color-surface-border)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <button
              onClick={handleExport}
              className="btn btn-ghost"
              title={t('general.export')}
              style={{
                fontSize: '0.74rem',
                padding: '4px 10px',
                borderRadius: 6,
                gap: 5,
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-surface-border)',
                background: 'var(--color-surface-bg)',
              }}
            >
              <Download size={13} />
              <span>{t('general.export')}</span>
            </button>
            <button
              onClick={handleClear}
              className="btn btn-ghost"
              title={t('general.clear')}
              style={{
                fontSize: '0.74rem',
                padding: '4px 10px',
                borderRadius: 6,
                gap: 5,
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <Trash2 size={13} />
              <span>{t('general.clear')}</span>
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              maxWidth: 780,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: '12px 10px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Hero Emblem Banner */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  position: 'relative',
                  width: 68,
                  height: 68,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, var(--color-tn-primary) 0%, #0f2540 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(26, 58, 92, 0.3)',
                }}
              >
                <TnEmblem size={44} opacity={0.95} className="text-[#c8a951]" />
              </div>
              <h2
                className="tamil-text"
                style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}
              >
                {t('general.welcome', { officerId })}
              </h2>
              <p
                className="tamil-text"
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  maxWidth: 500,
                  lineHeight: 1.5,
                }}
              >
                {t('general.subtitle')}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, position: 'relative', zIndex: 1 }}>
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isUser
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, var(--color-tn-primary) 0%, #0f2540 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {isUser ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Content Bubble */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div
                      className="tamil-text"
                      style={{
                        padding: '14px 18px',
                        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background: isUser
                          ? 'linear-gradient(135deg, var(--color-tn-primary) 0%, var(--color-tn-primary-light) 100%)'
                          : m.isError
                            ? '#fef2f2'
                            : 'var(--color-surface-bg)',
                        color: isUser
                          ? '#ffffff'
                          : m.isError
                            ? '#991b1b'
                            : 'var(--color-text-primary)',
                        border: isUser
                          ? 'none'
                          : m.isError
                            ? '1px solid #fecaca'
                            : '1px solid var(--color-surface-border)',
                        fontSize: '0.9rem',
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                        boxShadow: isUser
                          ? '0 4px 12px rgba(26, 58, 92, 0.2)'
                          : '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      {m.text}
                    </div>

                    {/* Message Metadata & Action Toolbar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 4,
                        fontSize: '0.72rem',
                        color: 'var(--color-text-muted)',
                        padding: '0 4px',
                      }}
                    >
                      <span>{m.timestamp}</span>

                      {!isUser && !m.isError && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: copiedId === m.id ? '#10b981' : 'var(--color-text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '0.72rem',
                            }}
                            title={t('general.copy')}
                          >
                            {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === m.id ? t('general.copied') : t('general.copy')}</span>
                          </button>

                          <span>•</span>
                          <button
                            onClick={() => toggleSpeech(m.id, m.text)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: speakingId === m.id ? '#3b82f6' : 'var(--color-text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '0.72rem',
                            }}
                            title={t('general.read')}
                          >
                            {speakingId === m.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            <span>{speakingId === m.id ? t('general.stop') : t('general.read')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--color-tn-primary) 0%, #0f2540 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '4px 16px 16px 16px',
                background: 'var(--color-surface-bg)',
                border: '1px solid var(--color-surface-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <RefreshCw className="animate-spin text-blue-500" size={16} />
              <span className="tamil-text" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {t('general.processing')}
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Dock */}
      <div
        className="chat-input-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Attached File Section: 1. Suggestions (Vertical), 2. Document Chip */}
        {file && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 1. 2x2 Grid of 4 Document Suggestions (Shown only when input is empty) */}
            {input.trim() === '' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {DOC_SUGGESTION_KEYS.map((key, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(t(key))}
                    className="tamil-text"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(200, 169, 81, 0.08)',
                      border: '1px solid rgba(200, 169, 81, 0.25)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      width: '100%',
                      boxSizing: 'border-box',
                      minWidth: 0,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(200, 169, 81, 0.18)';
                      e.currentTarget.style.borderColor = 'var(--color-tn-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(200, 169, 81, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(200, 169, 81, 0.25)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                      <Sparkles size={13} style={{ color: 'var(--color-tn-accent)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {t(key)}
                      </span>
                    </div>
                    <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}

            {/* 2. Attached File Preview Chip (Single-Line Inline Layout) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 10,
                background: 'var(--color-surface-bg)',
                border: '1px solid var(--color-surface-border)',
                fontSize: '0.82rem',
                color: 'var(--color-text-primary)',
                maxWidth: '100%',
                boxSizing: 'border-box',
                alignSelf: 'flex-start',
              }}
            >
              <FileText size={16} style={{ color: 'var(--color-tn-primary)', flexShrink: 0 }} />
              <span
                style={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '300px',
                }}
              >
                {file.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                · {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                  borderRadius: 4,
                  flexShrink: 0,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                title="Remove File"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('general.placeholder')}
          className="chat-input tamil-text"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.92rem',
            color: 'var(--color-text-primary)',
            resize: 'none',
            fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
            lineHeight: 1.6,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid var(--color-surface-border)',
          }}
        >
          {/* Left Actions: Document Upload + Voice Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Document Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost"
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                fontSize: '0.82rem',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-surface-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Upload Document (.pdf, .docx, .txt)"
            >
              <Paperclip size={16} />
              <span>{t('general.attachment')}</span>
            </button>

            {/* Voice Input Mic Button */}
            <button
              onClick={toggleListening}
              className="btn btn-ghost"
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                fontSize: '0.82rem',
                color: isListening ? '#ef4444' : 'var(--color-text-secondary)',
                background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={isListening ? 'Stop Listening' : t('general.voice_input')}
            >
              {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
              <span>{t('general.voice_input')}</span>
            </button>
          </div>

          {/* India Green Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && !file) || loading}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: !input.trim() || loading
                ? 'var(--color-surface-hover)'
                : 'linear-gradient(135deg, #138808 0%, #0b6623 100%)',
              color: !input.trim() || loading ? 'var(--color-text-muted)' : 'white',
              border: 'none',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              boxShadow: !input.trim() || loading ? 'none' : '0 4px 12px rgba(13, 136, 8, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin text-white" />
            ) : (
              <>
                <span style={{ fontSize: '0.84rem' }}>{t('general.send')}</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
