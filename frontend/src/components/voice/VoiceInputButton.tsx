/**
 * GRAM-X Voice Input Button Component
 * Transcribes spoken grievance descriptions via browser speech recognition.
 */

import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { voiceService } from '../../services/voiceService';

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
}

export const VoiceInputButton = ({
  onTranscript,
  language = 'hi-IN',
  className = '',
}: VoiceInputButtonProps) => {
  const [isListening, setIsListening] = useState(false);

  if (!voiceService.isSupported()) return null;

  const handleToggle = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const started = voiceService.startListening({
        language,
        onResult: (transcript) => {
          onTranscript(transcript);
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false),
      });
      if (started) setIsListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isListening ? 'Stop voice recording' : 'Speak to input text (Hindi/English)'}
      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
        isListening
          ? 'bg-rose-600 text-white animate-pulse shadow-lg'
          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 border border-slate-750'
      } ${className}`}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};

export default VoiceInputButton;
