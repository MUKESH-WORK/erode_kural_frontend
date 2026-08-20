import React, { useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  Minus,
  Sparkles,
  RotateCcw,
  Square,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import useChatStore from '../../stores/useChatStore';
import useAppStore from '../../stores/appStore';
import TnEmblem from '../icons/TnEmblem';
import { useTranslation } from 'react-i18next';

export default function GlobalAiAssistant() {
  const { t, i18n } = useTranslation();
  const {
    isOpen,
    toggleOpen,
    setOpen,
    messages,
    isLoading,
    isListening,
    isSpeaking,
    autoSpeak,
    speechLang,
    draftText,
    setDraftText,
    sendMessage,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    setAutoSpeak,
    setSpeechLang,
    clearChat,
  } = useChatStore();

  const { setActiveTab } = useAppStore();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleActionClick = (actionObj) => {
    if (!actionObj) return;
    const { action, value } = actionObj;

    if (action === 'NAVIGATE_BULK') {
      setActiveTab('bulk');
      setOpen(false);
    } else if (action === 'NAVIGATE_DATA') {
      setActiveTab('data');
      setOpen(false);
    } else if (action === 'FILTER_PENDING') {
      setActiveTab('bulk');
      setOpen(false);
    } else if (action === 'FILTER_DEPT') {
      setActiveTab('bulk');
      setOpen(false);
    } else if (action === 'ASK_STATUS') {
      sendMessage('நிலுவையில் உள்ள மனுக்கள் எத்தனை?');
    } else if (action === 'ASK_REVENUE') {
      sendMessage('வருவாய்த்துறை மனுக்கள் விபரம்');
    } else if (action === 'ASK_DATASETS') {
      sendMessage('கிடைக்கக்கூடிய தரவுத்தொகுப்புகள்');
    }
  };

  if (!isOpen) {
    return (
      <div className="ai-assistant flex items-center gap-2">
        {/* Floating Voice Assistant Trigger Icon */}
        <button
          onClick={toggleOpen}
          aria-label="Toggle Erode Kural AI Assistant"
          title="ஈரோடு குரல் AI (Erode Kural AI Assistant)"
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl hover:shadow-indigo-500/30 border border-amber-500/50 hover:border-amber-400 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {/* Animated pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-500 opacity-40 group-hover:opacity-80 blur transition duration-500 group-hover:duration-200 animate-pulse"></span>

          <div className="relative flex items-center justify-center w-7 h-7 text-amber-300">
            <TnEmblem className="w-5 h-5 fill-current" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="ai-assistant-panel flex flex-col rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
            <TnEmblem className="w-5 h-5" />
            {(isListening || isSpeaking) && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-300 font-serif leading-tight">
              {t('global_ai.title')}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {t('global_ai.subtitle')}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Speech Language Switcher */}
          <button
            onClick={() => setSpeechLang(speechLang === 'ta-IN' ? 'en-IN' : 'ta-IN')}
            title={`Speech Language: ${speechLang === 'ta-IN' ? 'தமிழ்' : 'English'}`}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium text-amber-300 hover:bg-slate-700 transition-colors"
          >
            <Globe className="w-3 h-3 text-slate-400" />
            <span>{speechLang === 'ta-IN' ? 'தமிழ்' : 'EN'}</span>
          </button>

          {/* Auto Speak Toggle */}
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoSpeak(!autoSpeak);
            }}
            title={autoSpeak ? 'Auto Voice output ON' : 'Auto Voice output OFF'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              autoSpeak
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            title="Clear Chat"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Minimize / Close */}
          <button
            onClick={() => setOpen(false)}
            title="Minimize"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Active Voice Status Banner ──────────────────────── */}
      {(isListening || isSpeaking) && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/80 border-b border-indigo-800/50 text-xs font-medium">
          <div className="flex items-center gap-2 text-indigo-200">
            {isListening ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span>குரலைக் கேட்கிறது... (Listening in {speechLang === 'ta-IN' ? 'Tamil' : 'English'})...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span>குரல் பதில் பேசுகிறது... (Speaking)...</span>
              </>
            )}
          </div>
          <button
            onClick={isListening ? stopListening : stopSpeaking}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 text-red-200 transition-colors"
          >
            <Square className="w-2.5 h-2.5" /> நிறுத்து (Stop)
          </button>
        </div>
      )}

      {/* ─── Messages Scroll Area ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => {
          const isAsst = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAsst ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-md ${
                  isAsst
                    ? 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-sm'
                    : 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white rounded-tr-sm'
                }`}
              >
                {/* Assistant Header Badge */}
                {isAsst && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-700/60 text-[11px] font-medium text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>ஆட்சியரகம் AI</span>
                    </div>
                    {/* Read Aloud Button */}
                    <button
                      onClick={() => speakText(msg.text)}
                      title="Read Aloud / குரல் வாசிப்பு"
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {msg.text}
                </div>

                {/* Interactive Action Buttons */}
                {isAsst && msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-[11px] font-medium text-amber-200 hover:text-amber-100 transition-colors shadow-sm cursor-pointer"
                      >
                        <span>{act.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-amber-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-amber-300 w-fit">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>{t('global_ai.thinking')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Quick Prompt Chips ──────────────────────────────── */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <span className="text-slate-500 font-medium whitespace-nowrap pl-1">{t('global_ai.quick')}</span>
        <button
          onClick={() => sendMessage(t('general.prompt_pending'))}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
        >
          {t('global_ai.quick_pending')}
        </button>
        <button
          onClick={() => sendMessage(t('general.prompt_revenue'))}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
        >
          {t('global_ai.quick_revenue')}
        </button>
        <button
          onClick={() => sendMessage(t('data.title'))}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
        >
          {t('global_ai.quick_datasets')}
        </button>
      </div>

      {/* ─── Input Footer ────────────────────────────────────── */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        {/* Voice Input Mic Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          title={isListening ? 'Stop Listening' : 'Speak to AI (Tamil / English)'}
          className={`relative p-2.5 rounded-xl border transition-all duration-300 ${
            isListening
              ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
              : 'bg-slate-800 hover:bg-indigo-950 border-slate-700 hover:border-indigo-600 text-amber-400'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input Area */}
        <input
          ref={inputRef}
          type="text"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? t('global_ai.placeholder_listening')
              : i18n.language === 'ta'
              ? t('global_ai.placeholder_ta')
              : t('global_ai.placeholder_en')
          }
          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-slate-100 placeholder-slate-500"
        />

        {/* Send Button */}
        <button
          onClick={() => sendMessage()}
          disabled={!draftText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium shadow-md transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
