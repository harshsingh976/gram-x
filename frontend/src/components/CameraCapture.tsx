import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n';

interface CameraCaptureProps {
  onCapture: (file: File, checksum: string, previewUrl: string) => void;
  onClose?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const { t } = useLanguage();
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this device/browser.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setError(err.message || 'Unable to access device camera. Check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const computeSHA256 = async (blob: Blob): Promise<string> => {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSnap = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);

      // Convert to File & Compute Checksum
      canvas.toBlob(async (blob) => {
        if (blob) {
          const checksum = await computeSHA256(blob);
          const file = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setIsProcessing(false);
          onCapture(file, checksum, dataUrl);
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div style={{ background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)', overflow: 'hidden', padding: '16px', color: '#ffffff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera className="w-5 h-5 text-emerald-400" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{t("camera.title")}</h4>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error ? (
        <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#fca5a5' }}>{error}</p>
          <button onClick={startCamera} style={{ padding: '8px 16px', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
            {t("action.retry")}
          </button>
        </div>
      ) : capturedImage ? (
        <div>
          <img src={capturedImage} alt="Captured" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #10b981' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button onClick={handleRetake} style={{ flex: 1, padding: '10px', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              {t("camera.retake_btn")}
            </button>
            <button onClick={() => onClose && onClose()} style={{ flex: 1, padding: '10px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CheckCircle className="w-4 h-4" /> {t("camera.confirm_btn")}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ position: 'relative', width: '100%', height: '280px', background: '#020617', borderRadius: '12px', overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              onClick={handleSnap}
              disabled={isProcessing}
              style={{
                padding: '12px 28px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {isProcessing ? t("camera.computing_hash") : t("camera.capture_btn")}
            </button>
          </div>
        </div>
      )}
    </div>

  );
};
