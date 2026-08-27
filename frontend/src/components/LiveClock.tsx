import React, { useState, useEffect, useRef } from "react";
import { useLanguage, type Language } from "../i18n";


interface LiveClockProps {
  variant?: "full" | "compact";
  className?: string;
  lightText?: boolean;
}

const LOCALE_MAP: Record<Language, string> = {
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  en: "en-IN",
};

function formatIST(date: Date, lang: Language) {
  const locale = LOCALE_MAP[lang] || "en-IN";
  const dateOpts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  
  let dateStr = "";
  let timeStr = "";
  try {
    dateStr = new Intl.DateTimeFormat(locale, dateOpts).format(date);
    timeStr = new Intl.DateTimeFormat(locale, timeOpts).format(date).toUpperCase();
  } catch {
    dateStr = new Intl.DateTimeFormat("en-IN", dateOpts).format(date);
    timeStr = new Intl.DateTimeFormat("en-IN", timeOpts).format(date).toUpperCase();
  }

  return { dateStr, timeStr };
}

export default function LiveClock({ variant = "full", className = "", lightText = false }: LiveClockProps) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const { dateStr, timeStr } = formatIST(now, language);
  const primaryColor = lightText ? "rgba(255,255,255,0.95)" : "#0f172a";
  const secondaryColor = lightText ? "rgba(255,255,255,0.65)" : "#64748b";

  if (variant === "compact") {
    return (
      <time
        dateTime={now.toISOString()}
        className={className}
        aria-label={`Current time: ${timeStr} IST`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "Inter, Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Telugu, monospace, system-ui",
          fontVariantNumeric: "tabular-nums",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: primaryColor,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", flexShrink: 0, display: "inline-block" }} aria-hidden="true" />
        {timeStr} IST
      </time>
    );
  }

  return (
    <time
      dateTime={now.toISOString()}
      className={className}
      aria-label={`Date and time: ${dateStr}, ${timeStr} IST`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1,
        fontFamily: "Inter, Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Telugu, system-ui, sans-serif",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ fontSize: "0.92rem", fontWeight: 800, color: primaryColor, lineHeight: 1.2 }}>
        {timeStr}
        <span style={{ marginLeft: 6, fontSize: "0.6rem", fontWeight: 700, color: "#10b981", background: lightText ? "rgba(16,185,129,0.15)" : "#ecfdf5", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, padding: "1px 5px", verticalAlign: "middle" }}>
          IST
        </span>
      </span>
      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: secondaryColor, letterSpacing: "0.03em" }}>
        {dateStr}
      </span>
    </time>
  );
}
