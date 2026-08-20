import { create } from 'zustand';
import { sendChat } from '../lib/api';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    text: '🏛️ **வணக்கம்! ஈரோடு மாவட்ட ஆட்சியரகம் AI குரல் உதவியாளருக்கு வரவேற்கிறோம்.**\n\nஎந்தவொரு மாவட்ட மனு, தரவுத்தொகுப்பு அல்லது பணிப்பாய்வு தொடர்பான கேள்விகளையும் குரல் வழியாகவோ அல்லது தட்டச்சு செய்தோ கேட்கலாம்.',
    timestamp: new Date().toISOString(),
    actions: [
      { label: 'நிலுவையில் உள்ள மனுக்கள்', action: 'ASK_STATUS' },
      { label: 'வருவாய்த்துறை மனுக்கள்', action: 'ASK_REVENUE' },
      { label: 'தரவுத்தொகுப்புகள் காண்க', action: 'ASK_DATASETS' },
    ],
  },
];

const useChatStore = create((set, get) => ({
  isOpen: false,
  messages: INITIAL_MESSAGES,
  isLoading: false,
  isListening: false,
  isSpeaking: false,
  autoSpeak: true,
  speechLang: 'ta-IN', // 'ta-IN' or 'en-IN'
  recognition: null,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (val) => set({ isOpen: val }),
  setSpeechLang: (lang) => set({ speechLang: lang }),
  setAutoSpeak: (val) => set({ autoSpeak: val }),

  clearChat: () => set({ messages: INITIAL_MESSAGES }),

  sendMessage: async (textOverride = null) => {
    const text = textOverride || get().draftText || '';
    if (!text.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      draftText: '',
    }));

    try {
      const res = await sendChat(text.trim(), 'OFFICER');
      
      const markdownContent = res.blocks?.map((b) => b.content).join('\n\n') || 'செய்தி செயலாக்கப்பட்டது.';
      
      const assistantMessage = {
        id: res.message_id || `asst-${Date.now()}`,
        sender: 'assistant',
        text: markdownContent,
        actions: res.actions || [],
        timestamp: res.timestamp || new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));

      // Speak response if autoSpeak is enabled
      if (get().autoSpeak) {
        get().speakText(markdownContent);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: '⚠️ மன்னிக்கவும், செய்தி செயலாக்கத்தில் தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
            timestamp: new Date().toISOString(),
          },
        ],
        isLoading: false,
      }));
    }
  },

  // ─── Speech-to-Text (STT) ─────────────────────────
  startListening: () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('உங்கள் உலாவியில் குரல் அறிதல் (Speech Recognition) ஆதரிக்கப்படவில்லை. Chrome/Edge உலாவியைப் பயன்படுத்தவும்.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = get().speechLang;

      recognition.onstart = () => {
        set({ isListening: true });
      };

      recognition.onresult = (event) => {
        let transcriptStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcriptStr += event.results[i][0].transcript;
        }
        set({ draftText: transcriptStr });
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        set({ isListening: false });
      };

      recognition.onend = () => {
        set({ isListening: false });
        // Automatically send message if transcript exists
        const currentText = get().draftText;
        if (currentText && currentText.trim()) {
          get().sendMessage(currentText);
        }
      };

      recognition.start();
      set({ recognition });
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      set({ isListening: false });
    }
  },

  stopListening: () => {
    const rec = get().recognition;
    if (rec) {
      try {
        rec.stop();
      } catch (e) {
        // ignore
      }
    }
    set({ isListening: false });
  },

  // ─── Text-to-Speech (TTS) ─────────────────────────
  speakText: (rawText) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop ongoing speech

    // Clean markdown symbols for natural TTS speech
    const cleanText = rawText
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const lang = get().speechLang;
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly calmer speaking rate for Tamil/English

    // Find suitable voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => set({ isSpeaking: true });
    utterance.onend = () => set({ isSpeaking: false });
    utterance.onerror = () => set({ isSpeaking: false });

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    set({ isSpeaking: false });
  },

  draftText: '',
  setDraftText: (val) => set({ draftText: val }),
}));

export default useChatStore;
