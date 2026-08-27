import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, CheckCircle, Volume2 } from 'lucide-react';
import { useLanguage } from '../i18n';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob, url: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded }) => {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioRecorded(audioBlob, url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      console.warn('Microphone access error:', e);
      alert(t('audio.mic_denied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ background: '#0f172a', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '16px', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic className={`w-5 h-5 ${isRecording ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('audio.title')}</span>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isRecording ? '#f43f5e' : '#94a3b8' }}>
          {formatTime(recordingTime)}
        </span>
      </div>

      {isRecording ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '36px', marginBottom: '12px' }}>
            {[40, 70, 95, 60, 85, 50, 90, 75, 45].map((h, i) => (
              <span key={i} style={{ width: '4px', height: `${h}%`, background: '#38bdf8', borderRadius: '2px', animation: 'pulse 1s infinite' }} />
            ))}
          </div>
          <button
            onClick={stopRecording}
            style={{
              padding: '10px 24px',
              background: '#e11d48',
              color: '#ffffff',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Square className="w-4 h-4 fill-white" /> {t('audio.recording_btn')}
          </button>
        </div>
      ) : audioUrl ? (
        <div>
          <audio ref={audioPlayerRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(30, 41, 59, 0.7)', padding: '10px', borderRadius: '10px' }}>
            <button onClick={togglePlayback} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>{t('audio.verified')}</div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Ready for Multilingual Indic Neural ASR</div>
            </div>
            <button onClick={startRecording} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
              {t('audio.record_again')}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <button
            onClick={startRecording}
            style={{
              padding: '10px 24px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Mic className="w-4 h-4" /> {t('audio.idle_btn')}
          </button>
        </div>
      )}
    </div>
  );
};

