import { useRef, useCallback, useState, useEffect } from 'react';

interface VoiceConfig {
  pitch: number;
  rate: number;
  voiceIndex: number;
}

// Each persona gets a distinct voice configuration
const VOICE_CONFIGS: Record<string, VoiceConfig> = {
  moderator: { pitch: 0.9, rate: 1.1, voiceIndex: 0 },
  petitioner: { pitch: 1.0, rate: 1.05, voiceIndex: 1 },
  'council-member': { pitch: 0.85, rate: 1.0, voiceIndex: 2 },
  'resident-1': { pitch: 1.15, rate: 1.1, voiceIndex: 3 },
  'resident-2': { pitch: 0.8, rate: 1.0, voiceIndex: 4 },
  'resident-3': { pitch: 1.05, rate: 1.05, voiceIndex: 5 },
};

const DEFAULT_CONFIG: VoiceConfig = { pitch: 1.0, rate: 1.05, voiceIndex: 0 };

// Max characters to speak per turn (keeps TTS snappy)
const MAX_SPEAK_CHARS = 400;

export function useSpeechSynthesis() {
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = speechSynthesis.getVoices();
    };
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const speak = useCallback((text: string, personaId: string) => {
    if (isMuted || !text.trim()) return;

    // Clean text — remove stage directions and markdown
    let cleaned = text
      .replace(/\*[^*]+\*/g, '')
      .replace(/#+\s*/g, '')
      .trim();

    if (!cleaned) return;

    // Truncate to first few sentences to keep it snappy
    if (cleaned.length > MAX_SPEAK_CHARS) {
      const truncated = cleaned.slice(0, MAX_SPEAK_CHARS);
      const lastPeriod = truncated.lastIndexOf('.');
      cleaned = lastPeriod > 100 ? truncated.slice(0, lastPeriod + 1) : truncated + '...';
    }

    // Cancel previous speech — we only speak the LATEST turn
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const config = VOICE_CONFIGS[personaId] || DEFAULT_CONFIG;

    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    // Assign a voice from available pool
    const voices = voicesRef.current;
    if (voices.length > 0) {
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const voicePool = englishVoices.length > 0 ? englishVoices : voices;
      utterance.voice = voicePool[config.voiceIndex % voicePool.length];
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [isMuted]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { speak, stop, toggleMute, isMuted, isSpeaking };
}
