import { useRef, useCallback, useState, useEffect } from 'react';

interface VoiceConfig {
  pitch: number;
  rate: number;
  voiceIndex: number; // preferred voice index
}

// Map persona roles/IDs to distinct voice configurations
const VOICE_CONFIGS: Record<string, VoiceConfig> = {
  moderator: { pitch: 0.9, rate: 0.95, voiceIndex: 0 },
  petitioner: { pitch: 1.0, rate: 1.0, voiceIndex: 1 },
  'council-member': { pitch: 0.85, rate: 0.9, voiceIndex: 2 },
  'resident-1': { pitch: 1.15, rate: 1.05, voiceIndex: 3 },
  'resident-2': { pitch: 0.8, rate: 0.88, voiceIndex: 4 },
  'resident-3': { pitch: 1.05, rate: 0.95, voiceIndex: 5 },
};

const DEFAULT_CONFIG: VoiceConfig = { pitch: 1.0, rate: 0.95, voiceIndex: 0 };

export function useSpeechSynthesis() {
  const [isMuted, setIsMuted] = useState(true); // Start muted by default
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Clean up the text — remove stage directions and markdown
    const cleaned = text
      .replace(/\*[^*]+\*/g, '') // remove *italics/actions*
      .replace(/#+\s*/g, '')     // remove markdown headers
      .trim();

    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const config = VOICE_CONFIGS[personaId] || DEFAULT_CONFIG;

    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    // Try to assign a distinct voice
    const voices = voicesRef.current;
    if (voices.length > 0) {
      // Prefer English voices
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const voicePool = englishVoices.length > 0 ? englishVoices : voices;
      utterance.voice = voicePool[config.voiceIndex % voicePool.length];
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isMuted]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        // Going muted — stop current speech
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { speak, stop, toggleMute, isMuted, isSpeaking };
}
