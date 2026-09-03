/**
 * GRAM-X Voice-First Accessibility Service
 * Provides browser-native SpeechRecognition and SpeechSynthesis abstraction for rural voice interaction.
 */

export interface VoiceRecognitionOptions {
  language?: string; // e.g. 'en-IN', 'hi-IN'
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class VoiceService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public startListening(options: VoiceRecognitionOptions): boolean {
    if (!this.recognition) {
      if (options.onError) options.onError('Speech recognition not supported in this browser.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.lang = options.language || 'hi-IN';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        options.onResult(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (options.onError) options.onError(event.error || 'Voice recognition error.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (options.onEnd) options.onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch {
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public speak(text: string, language = 'hi-IN'): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

export const voiceService = new VoiceService();
export default voiceService;
