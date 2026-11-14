import React from 'react'

export const CREW_MEMBERS = [
  {
    id: "maya",
    name: "Dr. Maya Lin",
    callsign: "Maya",
    role: "Commander & Geologist",
    suitColor: "#f1f5f9",
    accentColor: "#ef4444", // Red commander stripe
  },
  {
    id: "alex",
    name: "Alex Rivera",
    callsign: "Alex",
    role: "Flight Engineer",
    suitColor: "#f8fafc",
    accentColor: "#f59e0b", // Amber engineer stripe
  },
  {
    id: "samira",
    name: "Samira Khan",
    callsign: "Samira",
    role: "Life Support & Botanist",
    suitColor: "#f1f5f9",
    accentColor: "#10b981", // Emerald biology stripe
  },
];

export function getAstronautMood(astroId, state) {
  const o2 = state?.resources?.oxygen?.current ?? 90;
  const w = state?.resources?.water?.current ?? 90;
  const bat = state?.resources?.battery?.current ?? 90;
  const isEmergency = state?.phase === 'emergency';

  if (isEmergency) {
    if (astroId === "maya") {
      return {
        moodText: "Maya is executing emergency protocols",
        emoji: "🛡️",
        statusLevel: "warning",
      };
    }
    if (astroId === "alex") {
      return {
        moodText: "Alex secured outer sensors & circuits",
        emoji: "🔧",
        statusLevel: "warning",
      };
    }
    return {
      moodText: "Samira is monitoring life support valves",
      emoji: "🫁",
      statusLevel: "warning",
    };
  }

  if (o2 < 30) {
    return {
      moodText: `${astroId === "maya" ? "Maya" : astroId === "alex" ? "Alex" : "Samira"} is dizzy from thin air!`,
      emoji: "🫁",
      statusLevel: "critical",
    };
  }

  if (w < 30) {
    return {
      moodText: `${astroId === "samira" ? "Samira" : astroId === "alex" ? "Alex" : "Maya"} is strictly rationing water`,
      emoji: "💧",
      statusLevel: "warning",
    };
  }

  if (astroId === "maya") {
    return {
      moodText: "Maya is confident, analyzing core samples",
      emoji: "😄",
      statusLevel: "great",
    };
  }

  if (astroId === "alex") {
    return {
      moodText: bat < 30 ? "Alex is worried about battery bus" : "Alex has all systems humming",
      emoji: bat < 30 ? "⚡" : "😎",
      statusLevel: bat < 30 ? "warning" : "great",
    };
  }

  return {
    moodText: "Samira is proud of the greenhouse crops",
    emoji: "🌱",
    statusLevel: "great",
  };
}

export function AstronautAvatar({ astronaut, size = 42, mood }) {
  const isMaya = astronaut.id === "maya";
  const isAlex = astronaut.id === "alex";

  return (
    <div className="relative inline-block select-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
        <circle cx="50" cy="50" r="44" fill="#1e293b" stroke="#94a3b8" strokeWidth="4" />
        <ellipse
          cx="50"
          cy="48"
          rx="32"
          ry="26"
          fill={mood?.statusLevel === "critical" ? "#7f1d1d" : mood?.statusLevel === "warning" ? "#78350f" : "#0f172a"}
          stroke={astronaut.accentColor}
          strokeWidth="3.5"
        />
        <path d="M26 40 Q50 28 74 40 Q50 32 26 40 Z" fill="#fde047" opacity="0.8" />
        <g opacity="0.95">
          <circle cx="41" cy="49" r="4" fill="#e2e8f0" />
          <circle cx="42" cy="48" r="1.5" fill="#0f172a" />
          <circle cx="59" cy="49" r="4" fill="#e2e8f0" />
          <circle cx="60" cy="48" r="1.5" fill="#0f172a" />
          <path d="M42 57 Q50 63 58 57" stroke="#fde047" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
        {isMaya && <path d="M44 8 L50 16 L56 8 Z" fill="#ef4444" />}
        {isAlex && <rect x="46" y="8" width="8" height="7" rx="1.5" fill="#f59e0b" />}
        {!isMaya && !isAlex && <circle cx="50" cy="11" r="4" fill="#10b981" />}
      </svg>
      {mood && (
        <span
          className="absolute -bottom-1 -right-1 text-xs bg-slate-900 border border-slate-700 rounded-full px-1 shadow"
          title={mood.moodText}
        >
          {mood.emoji}
        </span>
      )}
    </div>
  );
}
