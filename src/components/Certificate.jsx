import React, { useState } from 'react'
import { Award, Printer, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react'

export default function Certificate({ state, playerName, onPlayerNameChange, onRestart }) {
  const [copied, setCopied] = useState(false);
  const isWon = state?.phase === 'completed' || state?.result?.status === 'success';
  const name = playerName || state?.astronautName || 'Junior Flight Director';
  const score = state?.result?.score ?? 95;
  const survivedDays = state?.result?.survivedDays ?? state?.day ?? 5;
  const destination = state?.mission?.destination ?? (state?.missionId === 'mars' ? 'Mars' : 'Moon');

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `I just commanded the ${destination} Outpost in NASA Space Apps Challenge! (${survivedDays} Sols survived, Score: ${score}) 🚀 #NASASpaceApps`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Name Input Bar */}
      <div className="no-print bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Award className="text-amber-400" size={24} />
          <span className="text-sm font-semibold text-slate-200">Personalize Your Certificate:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={playerName}
            onChange={(e) => onPlayerNameChange?.(e.target.value)}
            placeholder="Enter your name"
            className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-sky-400 w-full sm:w-56"
          />
        </div>
      </div>

      {/* The Printable Certificate Box */}
      <div
        id="certificate-frame"
        className="relative bg-gradient-to-b from-slate-950 via-[#0a1026] to-slate-950 border-4 border-amber-500/70 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="relative text-center space-y-2">
          <div className="flex justify-center items-center gap-2 text-xs uppercase tracking-widest text-sky-300 font-bold">
            <span>NASA Space Apps Challenge 2026</span>
            <span>•</span>
            <span>{destination} Surface Operations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 uppercase tracking-wider">
            Junior Astronaut Certification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Lunar &amp; Martian Surface Exploration Directorate
          </p>
        </div>

        {/* The Official Mission Patch (SVG) */}
        <div className="my-6 flex justify-center">
          <div className="relative w-44 h-44 drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="patchBg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <path id="textArcTop" d="M 25 100 A 75 75 0 0 1 175 100" fill="none" />
                <path id="textArcBottom" d="M 175 100 A 75 75 0 0 1 25 100" fill="none" />
              </defs>

              <circle cx="100" cy="100" r="94" fill="url(#patchBg)" stroke="url(#goldRing)" strokeWidth="6" />
              <circle cx="100" cy="100" r="82" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Stars */}
              {[
                [45, 60], [60, 45], [140, 45], [155, 60],
                [50, 140], [150, 140], [70, 155], [130, 155]
              ].map(([x, y], i) => (
                <polygon
                  key={i}
                  points={`${x},${y - 3} ${x + 1},${y - 1} ${x + 3},${y} ${x + 1},${y + 1} ${x},${y + 3} ${x - 1},${y + 1} ${x - 3},${y} ${x - 1},${y - 1}`}
                  fill="#f8fafc"
                />
              ))}

              <circle cx="140" cy="65" r="14" fill="#2563eb" />
              <path d="M134 62 Q140 58 144 63 Q146 68 138 72 Z" fill="#22c55e" />

              <path d="M 20 135 Q 100 115 180 135 L 180 180 L 20 180 Z" fill={destination === 'Mars' ? '#7c2d12' : '#475569'} />
              <ellipse cx="70" cy="145" rx="16" ry="5" fill="#1e293b" />
              <ellipse cx="135" cy="150" rx="20" ry="6" fill="#1e293b" />

              <path d="M 85 125 A 15 14 0 0 1 115 125 Z" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2" />
              <rect x="97" y="120" width="6" height="5" fill="#0284c7" />

              <path
                d="M 100 35 L 118 105 L 100 95 L 82 105 Z"
                fill="#dc2626"
                stroke="#f87171"
                strokeWidth="1.5"
                opacity="0.9"
              />

              <circle cx="100" cy="98" r="8" fill="#fde047" stroke="#b45309" strokeWidth="1" />

              <text fontSize="8.5" fontWeight="bold" fill="#fde047" letterSpacing="2">
                <textPath href="#textArcTop" startOffset="50%" textAnchor="middle">
                  {destination.toUpperCase()} BASE • 2026
                </textPath>
              </text>
              <text fontSize="7.5" fontWeight="bold" fill="#93c5fd" letterSpacing="1.5">
                <textPath href="#textArcBottom" startOffset="50%" textAnchor="middle">
                  JUNIOR FLIGHT DIRECTOR
                </textPath>
              </text>
            </svg>
          </div>
        </div>

        {/* Certificate Body Text */}
        <div className="relative text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-slate-400">This certifies that</p>
          <div className="text-2xl sm:text-3xl font-extrabold text-white border-b-2 border-dashed border-slate-700 pb-2 inline-block px-8 min-w-[280px]">
            {name}
          </div>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            {isWon
              ? `has successfully commanded the ${destination} outpost through ${survivedDays} Sols of deep-space operations, balancing life support, power budgeting, and radiation safety.`
              : `bravely commanded the ${destination} outpost through ${survivedDays} Sols, facing genuine engineering trade-offs and real NASA space weather challenges.`}
          </p>

          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-2 mt-2">
            <span className="text-amber-400 text-xl font-bold tracking-widest">
              ★★★
            </span>
            <span className="text-amber-200 font-bold text-sm sm:text-base">
              {score >= 90 ? "Flight Director Legend" : score >= 70 ? "Mission Success" : "Crew Survived"}
            </span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 text-center text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-slate-400">Duration</div>
            <div className="text-base font-bold text-white mt-0.5">{survivedDays} Sols</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-slate-400">Mission Score</div>
            <div className="text-base font-bold text-sky-400 mt-0.5">{score} pts</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-slate-400">Crew Status</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">Healthy &amp; Safe</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-slate-400">NASA DONKI Sync</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">Verified</div>
          </div>
        </div>

        {/* Signatures & Seal */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="text-center sm:text-left">
            <div className="font-serif italic text-sm text-slate-200">Dr. Maya Lin</div>
            <div className="text-[10px] text-slate-400">Commander, {destination} Base Camp</div>
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-900/30 to-amber-700/20 border border-amber-500/40 rounded-full px-3 py-1 text-amber-300 font-semibold text-[11px]">
            <Sparkles size={14} className="text-amber-400" />
            <span>VERIFIED SURFACE OPERATIONS • {dateStr}</span>
          </div>

          <div className="text-center sm:text-right">
            <div className="font-serif italic text-sm text-slate-200">Alex Rivera &amp; Samira Khan</div>
            <div className="text-[10px] text-slate-400">Systems &amp; Life Support Directorate</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold px-4 py-2 text-sm transition shadow"
        >
          <Printer size={16} /> Print / Save PDF
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold px-4 py-2 text-sm transition shadow"
        >
          {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Award size={16} />}
          {copied ? "Copied Mission Brag!" : "Copy Brag Text"}
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2 text-sm transition shadow"
          >
            <RotateCcw size={16} /> Play Again
          </button>
        )}
      </div>
    </div>
  );
}
