import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { sendChat, uploadDocument } from '../../lib/api';
import TnEmblem from '../icons/TnEmblem';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Mic,
  MicOff,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Download,
  Paperclip,
  Upload,
  X,
  Plus,
} from 'lucide-react';

const CATEGORIZED_PROMPTS = [
  {
    category: 'நிலுவை விவரங்கள்',
    subtitle: 'Pending Workload & File Status',
    icon: Zap,
    color: '#3b82f6',
    prompt: 'இன்றைய முக்கிய கோப்புகள் மற்றும் நிலுவை விவரங்கள் என்ன?',
  },
  {
    category: 'வருவாய்த்துறை',
    subtitle: 'Revenue Dept Guidelines',
    icon: FileText,
    color: '#10b981',
    prompt: 'வருவாய்த்துறை நில அளவீடு தொடர்பான அரசு வழிகாட்டல்கள் என்ன?',
  },
  {
    category: 'சமூக நலத்துறை',
    subtitle: 'Social Welfare Petitions',
    icon: ShieldCheck,
    color: '#f59e0b',
    prompt: 'சமூக நலத்துறை முதியோர் உதவித்தொகை மனுக்கள் நிலை என்ன?',
  },
  {
    category: 'பட்டா மாறுதல்',
    subtitle: 'Patta Transfer Procedure',
    icon: Sparkles,
    color: '#8b5cf6',
    prompt: 'பொதுமக்களின் பட்டா மாறுதல் மனுவின் சரிபார்ப்பு நடைமுறை என்ன?',
  },
];

export default function GeneralModule() {
  const { t } = useTranslation();
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
    utterance.lang = 'ta-IN';
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
    if (window.confirm('உரையாடலை அழிக்க விரும்புகிறீர்களா?')) {
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
      ? `[ஆவணம்: ${file.name}] ${rawText.trim() || 'ஆவணம் பெறப்பட்டது.'}`
      : rawText.trim();

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setFile(null);
    setLoading(true);

    try {
      const res = await sendChat(messageText, officerId);
      const aiContent = res.blocks?.[0]?.content || 'செயலாக்கப்பட்டது.';
      const aiMsg = {
        id: res.message_id || `ai_${Date.now()}`,
        sender: 'ai',
        text: aiContent,
        timestamp: new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `பிழை: ${err.message || 'சேவையகத்தை தொடர்பு கொள்ள முடியவில்லை.'}`,
        timestamp: new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' }),
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
        {/* Actions Bar if messages present */}
        {messages.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingBottom: 6,
              borderBottom: '1px solid var(--color-surface-border)',
            }}
          >
            <button
              onClick={handleExport}
              className="btn btn-ghost"
              title="Export Transcript"
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
              <span>ஏற்றுமதி</span>
            </button>
            <button
              onClick={handleClear}
              className="btn btn-ghost"
              title="Clear Chat"
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
              <span>அழி</span>
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
                வணக்கம், அலுவலர் <span style={{ color: 'var(--color-tn-accent-light, #c8a951)' }}>{officerId}</span>!
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
                ஈரோடு மாவட்ட நிர்வாக வினவல்கள், அரசாணைகள், கோப்பு நிலை மற்றும் வழிகாட்டுதல்களை கேட்கலாம்.
              </p>
            </div>

            {/* Categorized Quick Prompt Cards Grid */}
            <div
              className="quick-actions-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                marginTop: 4,
              }}
            >
              {CATEGORIZED_PROMPTS.map((item, i) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(item.prompt)}
                    className="quick-action-card"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: 'var(--color-surface-bg)',
                      border: '1px solid var(--color-surface-border)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                      minWidth: 0,
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = item.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 16px ${item.color}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-surface-border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: `${item.color}15`,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div
                        className="tamil-text"
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minWidth: 0,
                        }}
                      >
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.category}</span>
                        <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: 2,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.subtitle}
                      </div>
                      <div
                        className="tamil-text"
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--color-text-muted)',
                          marginTop: 4,
                          lineHeight: 1.35,
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        "{item.prompt}"
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
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
                            title="Copy text"
                          >
                            {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === m.id ? 'பிரதி எடுக்கப்பட்டது' : 'பிரதி எடு'}</span>
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
                            title="Read Aloud"
                          >
                            {speakingId === m.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            <span>{speakingId === m.id ? 'நிறுத்து' : 'வாசி'}</span>
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
                அமைப்பிலிருந்து தரவு சேகரித்து செயலாக்குகிறது...
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Dock */}
      {/* Interactive Chat Input Box matching DocumentModule */}
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

        {/* Attached File Preview Chip */}
        {file && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: 10,
              background: 'var(--color-surface-bg)',
              border: '1px solid var(--color-surface-border)',
              fontSize: '0.82rem',
              color: 'var(--color-text-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <FileText size={16} style={{ color: 'var(--color-tn-primary)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={() => setFile(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              title="Remove File"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="இங்கே உங்கள் கேள்வியை தட்டச்சு செய்யவும்... (Enter அழுத்தவும்)"
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
              <span>இணைப்பு</span>
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
              title={isListening ? 'Stop Listening' : 'Voice Input (Tamil)'}
            >
              {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
              <span>குரல் உள்ளீடு</span>
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
              boxShadow: !input.trim() || loading ? 'none' : '0 4px 12px rgba(19, 136, 8, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin text-white" />
            ) : (
              <>
                <span style={{ fontSize: '0.84rem' }}>அனுப்பு</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
