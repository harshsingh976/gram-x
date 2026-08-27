import React, { useState, useRef } from "react";
import { useLanguage } from "../i18n";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export interface EvidencePhoto {
  url?: string;
  base64?: string;
  label: string;            // "Before" or "After"
  timestamp?: string;
  uploaderName?: string;
  uploaderRole?: string;
  checksum?: string;        // SHA-256
  verified?: boolean;
}

interface EvidenceViewerProps {
  before?: EvidencePhoto;
  after?: EvidencePhoto;
  title?: string;
  compact?: boolean;
}

function PhotoCard({
  photo,
  side,
  onClick,
}: {
  photo: EvidencePhoto;
  side: "before" | "after";
  onClick: () => void;
}) {
  const { t } = useLanguage();
  const imageSrc = photo.url || (photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : null);
  const isAfter = side === "after";

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      border: `2px solid ${isAfter ? "#10b98140" : "#f59e0b40"}`,
      borderRadius: "12px",
      overflow: "hidden",
      background: "#0f172a",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        background: isAfter ? "#064e3b" : "#78350f",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
          {isAfter ? "✔️ " : "📷 "}{photo.label}
        </span>
        {photo.verified && (
          <span style={{
            fontSize: "0.6rem", background: "#10b981", color: "#fff",
            padding: "1px 6px", borderRadius: "4px", fontWeight: 700,
          }}>VERIFIED</span>
        )}
      </div>

      {/* Image */}
      <div
        onClick={onClick}
        style={{
          cursor: "pointer",
          position: "relative",
          background: "#1e293b",
          minHeight: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt={photo.label}
              style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute", top: "8px", right: "8px",
              background: "rgba(0,0,0,0.5)", borderRadius: "6px",
              padding: "4px 6px", display: "flex", gap: "4px",
            }}>
              <ZoomIn size={12} color="#fff" />
            </div>
          </>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#475569" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{isAfter ? "⏳" : "📷"}</div>
            <p style={{ fontSize: "0.75rem" }}>
              {isAfter ? t("evidence.after_pending") : t("evidence.no_photo")}
            </p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {photo.timestamp && (
          <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "3px" }}>
            🕐 {new Date(photo.timestamp).toLocaleString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
            })} IST
          </p>
        )}
        {photo.uploaderName && (
          <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "3px" }}>
            👤 {photo.uploaderName}
            {photo.uploaderRole && (
              <span style={{ marginLeft: "4px", color: "#64748b" }}>({photo.uploaderRole})</span>
            )}
          </p>
        )}
        {photo.checksum && (
          <p style={{
            fontSize: "0.55rem", color: "#475569", fontFamily: "monospace",
            wordBreak: "break-all", marginTop: "4px",
          }}>
            SHA-256: {photo.checksum.slice(0, 16)}...
          </p>
        )}
      </div>
    </div>
  );
}

function LightboxModal({ photo, onClose }: { photo: EvidencePhoto; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const imageSrc = photo.url || (photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : null);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Full screen view: ${photo.label}`}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close lightbox"
          style={{
            position: "absolute", top: "-40px", right: 0,
            background: "rgba(255,255,255,0.1)", border: "none",
            color: "#fff", cursor: "pointer", padding: "6px", borderRadius: "6px",
          }}
        >
          <X size={20} />
        </button>

        {/* Zoom controls */}
        <div style={{
          position: "absolute", bottom: "12px", right: "12px",
          display: "flex", gap: "6px", zIndex: 10,
        }}>
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            aria-label="Zoom out"
            style={{ background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", padding: "6px", borderRadius: "6px" }}
          ><ZoomOut size={16} /></button>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            aria-label="Zoom in"
            style={{ background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", padding: "6px", borderRadius: "6px" }}
          ><ZoomIn size={16} /></button>
        </div>

        {imageSrc && (
          <img
            src={imageSrc}
            alt={photo.label}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              transition: "transform 0.2s ease",
              maxWidth: "85vw",
              maxHeight: "85vh",
              borderRadius: "8px",
              display: "block",
            }}
          />
        )}

        {/* Caption */}
        <div style={{
          marginTop: "12px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{photo.label}</span>
          {photo.timestamp && (
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {new Date(photo.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </span>
          )}
          {photo.uploaderName && (
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>👤 {photo.uploaderName}</span>
          )}
          {photo.checksum && (
            <span style={{ fontSize: "0.65rem", color: "#475569", fontFamily: "monospace" }}>
              SHA-256: {photo.checksum.slice(0, 20)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EvidenceViewer({ before, after, title, compact }: EvidenceViewerProps) {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState<EvidencePhoto | null>(null);
  const [sliderMode, setSliderMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // 0–100
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!before && !after) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>📷</div>
        {t("evidence.no_photo")}
      </div>
    );
  }

  const handleSliderDrag = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        {title && (
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            📸 {title}
          </h3>
        )}
        {before && after && (
          <button
            onClick={() => setSliderMode(v => !v)}
            style={{
              fontSize: "0.7rem",
              background: sliderMode ? "#3b82f6" : "#f1f5f9",
              color: sliderMode ? "#fff" : "#475569",
              border: "1px solid #e2e8f0",
              padding: "4px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 700,
              display: "flex",
              gap: "4px",
              alignItems: "center",
            }}
          >
            <Maximize2 size={12} />
            {sliderMode ? t("evidence.side_by_side") : t("evidence.compare")}
          </button>
        )}
      </div>

      {/* Slider comparison mode */}
      {sliderMode && before && after ? (
        <div
          ref={sliderRef}
          onMouseMove={e => { if (e.buttons === 1) handleSliderDrag(e); }}
          onClick={handleSliderDrag}
          style={{
            position: "relative",
            cursor: "col-resize",
            borderRadius: "12px",
            overflow: "hidden",
            height: "260px",
            background: "#1e293b",
            userSelect: "none",
          }}
        >
          {/* After photo (full width, behind) */}
          <div style={{ position: "absolute", inset: 0 }}>
            {(after.url || after.base64) && (
              <img
                src={after.url || `data:image/jpeg;base64,${after.base64}`}
                alt="After"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
          {/* Before photo (clipped left) */}
          <div style={{
            position: "absolute", inset: 0,
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}>
            {(before.url || before.base64) && (
              <img
                src={before.url || `data:image/jpeg;base64,${before.base64}`}
                alt="Before"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
          {/* Slider handle */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${sliderPos}%`,
            transform: "translateX(-50%)",
            width: "3px",
            background: "#fff",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", color: "#475569", fontWeight: 700,
            }}>◀▶</div>
          </div>
          {/* Labels */}
          <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(245,158,11,0.85)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>BEFORE</div>
          <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(16,185,129,0.85)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>AFTER</div>
        </div>
      ) : (
        /* Side-by-side mode */
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {before && (
            <PhotoCard photo={before} side="before" onClick={() => setLightbox(before)} />
          )}
          {after && (
            <PhotoCard photo={after} side="after" onClick={() => setLightbox(after)} />
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && <LightboxModal photo={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default EvidenceViewer;
