import React from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage, LANGUAGES, type Language } from "../i18n";

interface LanguageSelectorProps {
  variant?: "pills" | "dropdown" | "compact";
  lightText?: boolean;
  className?: string;
}

export default function LanguageSelector({
  variant = "pills",
  lightText = false,
  className = "",
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  if (variant === "compact" || variant === "dropdown") {
    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(prev => !prev)}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Select language — current: ${currentLang.englishName}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            borderRadius: "8px",
            border: lightText ? "1px solid rgba(255,255,255,0.25)" : "1px solid #cbd5e1",
            background: lightText ? "rgba(255,255,255,0.12)" : "#f8fafc",
            color: lightText ? "#ffffff" : "#1e293b",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s",
            minHeight: "44px",
            minWidth: "44px",
          }}
        >
          <Globe size={13} style={{ color: lightText ? "#93c5fd" : "#2563eb" }} aria-hidden="true" />
          <span>{currentLang.nativeName}</span>
          <span style={{ fontSize: "0.65rem", opacity: 0.6 }} aria-hidden="true">▼</span>
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Select language"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              zIndex: 100,
              minWidth: "160px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
              overflow: "hidden",
              padding: "4px",
            }}
          >
            {LANGUAGES.map(lang => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "10px 12px",
                    minHeight: "44px",
                    borderRadius: "6px",
                    border: "none",
                    background: isSelected ? "#eff6ff" : "transparent",
                    color: isSelected ? "#1d4ed8" : "#334155",
                    fontSize: "0.82rem",
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{lang.nativeName}</span>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 500 }}>({lang.englishName})</span>
                  </span>
                  {isSelected && <Check size={14} style={{ color: "#1d4ed8" }} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // "pills" variant (inline display of all languages)
  return (
    <div
      role="radiogroup"
      aria-label="Language selector"
      className={`inline-flex items-center gap-1.5 p-1 rounded-lg ${className}`}
      style={{
        background: lightText ? "rgba(255,255,255,0.08)" : "#f1f5f9",
        border: lightText ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e2e8f0",
        flexWrap: "wrap",
      }}
    >
      <Globe size={13} style={{ color: lightText ? "#93c5fd" : "#64748b", marginLeft: "4px" }} aria-hidden="true" />
      {LANGUAGES.map(lang => {
        const isSelected = lang.code === language;
        return (
          <button
            key={lang.code}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => setLanguage(lang.code)}
            style={{
              padding: "6px 9px",
              borderRadius: "6px",
              border: isSelected
                ? (lightText ? "1px solid rgba(255,255,255,0.4)" : "1px solid #bfdbfe")
                : "1px solid transparent",
              background: isSelected
                ? (lightText ? "rgba(255,255,255,0.25)" : "#ffffff")
                : "transparent",
              color: isSelected
                ? (lightText ? "#ffffff" : "#1d4ed8")
                : (lightText ? "rgba(255,255,255,0.75)" : "#64748b"),
              fontSize: "0.76rem",
              fontWeight: isSelected ? 800 : 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isSelected && !lightText ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              minHeight: "36px",
              minWidth: "36px",
            }}
          >
            {lang.nativeName}
          </button>
        );
      })}
    </div>
  );
}
