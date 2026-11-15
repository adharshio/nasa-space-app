import { motion } from 'framer-motion'

const SKIN = '#f2c9a4'
const SKIN_SHADE = '#dbaa80'
const HAIR = '#2b2118'

function severityColors(severity) {
  if (severity === 'danger') return { accent: '#f87171' }
  if (severity === 'warning') return { accent: '#fbbf24' }
  return { accent: '#38bdf8' }
}

function Face({ expression = 'concerned' }) {
  const alarmed = expression === 'alarmed'
  const concerned = expression === 'concerned'
  return (
    <g>
      {/* head + hair */}
      <ellipse cx="200" cy="188" rx="29" ry="34" fill={SKIN} />
      <path d="M171 178Q175 148 200 146Q226 148 229 178Q220 163 200 162Q181 162 171 178Z" fill={HAIR} />
      <ellipse cx="174" cy="192" rx="5" ry="8" fill={SKIN_SHADE} />
      <ellipse cx="226" cy="192" rx="5" ry="8" fill={SKIN_SHADE} />

      {/* eyebrows */}
      {alarmed ? (
        <>
          <path d="M178 176Q184 170 191 174" fill="none" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
          <path d="M209 174Q216 170 222 176" fill="none" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : concerned ? (
        <>
          <path d="M178 176Q185 180 192 176" fill="none" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
          <path d="M208 176Q215 180 222 176" fill="none" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M179 175Q186 172 192 175" fill="none" stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M208 175Q214 172 221 175" fill="none" stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}

      {/* eyes */}
      {alarmed ? (
        <>
          <ellipse cx="186" cy="188" rx="6.4" ry="8" fill="#fffaf0" stroke={HAIR} strokeWidth="1.4" />
          <ellipse cx="214" cy="188" rx="6.4" ry="8" fill="#fffaf0" stroke={HAIR} strokeWidth="1.4" />
          <circle cx="186" cy="189" r="2.7" fill="#1b120b" />
          <circle cx="214" cy="189" r="2.7" fill="#1b120b" />
          <circle cx="187" cy="187" r="0.9" fill="#fff" />
          <circle cx="215" cy="187" r="0.9" fill="#fff" />
        </>
      ) : (
        <>
          <ellipse cx="186" cy="189" rx="4.4" ry="5.4" fill="#fffaf0" stroke={HAIR} strokeWidth="1.2" />
          <ellipse cx="214" cy="189" rx="4.4" ry="5.4" fill="#fffaf0" stroke={HAIR} strokeWidth="1.2" />
          <circle cx="186" cy="189" r="2.4" fill="#1b120b" />
          <circle cx="214" cy="189" r="2.4" fill="#1b120b" />
          <circle cx="187" cy="187.5" r="0.8" fill="#fff" />
          <circle cx="215" cy="187.5" r="0.8" fill="#fff" />
        </>
      )}

      {/* nose + mouth */}
      <path d="M200 193Q197 199 201 201" fill="none" stroke={SKIN_SHADE} strokeWidth="1.8" strokeLinecap="round" />
      {alarmed ? (
        <ellipse cx="200" cy="210" rx="7" ry="8.5" fill="#5b2222" stroke="#3a1414" strokeWidth="1.4" />
      ) : concerned ? (
        <path d="M190 211Q200 206 210 211" fill="none" stroke="#9a5a4c" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <path d="M190 208Q200 215 210 208" fill="none" stroke="#9a5a4c" strokeWidth="2.6" strokeLinecap="round" />
      )}

      {/* stress blush */}
      {(alarmed || concerned) && (
        <>
          <ellipse cx="180" cy="203" rx="7" ry="4" fill="#e88a7a" opacity=".35" />
          <ellipse cx="220" cy="203" rx="7" ry="4" fill="#e88a7a" opacity=".35" />
        </>
      )}

      {/* sweat drop for urgency */}
      {alarmed && (
        <g>
          <path d="M235 169Q241 177 235 182Q229 177 235 169Z" fill="#8ee7ff" stroke="#5bc9ef" strokeWidth="1.2" opacity=".95">
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 7; 0 0" dur="2.4s" repeatCount="indefinite" />
          </path>
        </g>
      )}
    </g>
  )
}

export default function AstronautPortrait({ astronaut, severity = 'warning', expression }) {
  const { accent } = severityColors(severity)
  const trim = astronaut?.color ?? '#7dd3fc'
  const initials = astronaut?.name?.split(' ').map((p) => p[0]).join('') ?? 'A'
  const face = expression ?? (severity === 'danger' ? 'alarmed' : 'concerned')

  return (
    <svg viewBox="0 0 400 760" className="h-full w-full" role="img" aria-label={`${astronaut?.name ?? 'Astronaut'} reporting an issue`}>
      <defs>
        <linearGradient id="apSuit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7fbff" />
          <stop offset=".55" stopColor="#dbe8f6" />
          <stop offset="1" stopColor="#b6c9dd" />
        </linearGradient>
        <linearGradient id="apSuitShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c6d8ea" />
          <stop offset="1" stopColor="#8fa8c0" />
        </linearGradient>
        <linearGradient id="apVisor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d2740" />
          <stop offset=".6" stopColor="#06182b" />
          <stop offset="1" stopColor="#020b16" />
        </linearGradient>
        <radialGradient id="apGlow">
          <stop offset="0%" stopColor={accent} stopOpacity=".55" />
          <stop offset="55%" stopColor={accent} stopOpacity=".16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id="apSoftGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {/* aura + orbit ring */}
      <circle cx="200" cy="390" r="200" fill="url(#apGlow)">
        <animate attributeName="r" values="188;206;188" dur="4.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".85;.55;.85" dur="4.5s" repeatCount="indefinite" />
      </circle>
      <ellipse cx="200" cy="402" rx="168" ry="42" fill="none" stroke={accent} strokeOpacity=".25" strokeWidth="1.5" transform="rotate(-14 200 402)" />
      <ellipse cx="200" cy="402" rx="205" ry="54" fill="none" stroke={accent} strokeOpacity=".12" strokeWidth="1" transform="rotate(10 200 402)" />

      {/* stars */}
      {[{ x: 52, y: 140, r: 1.6 }, { x: 342, y: 96, r: 2 }, { x: 358, y: 300, r: 1.4 }, { x: 40, y: 420, r: 1.2 }, { x: 320, y: 520, r: 1.8 }, { x: 70, y: 620, r: 1.3 }].map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#dff3ff" opacity=".75">
          <animate attributeName="opacity" values=".2;.9;.2" dur={`${2 + i * 0.7}s`} repeatCount="indefinite" />
        </circle>
      ))}

      <motion.g
        animate={{ y: [0, -9, 0], rotate: [-1.2, 1.2, -1.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '200px 380px' }}
      >
        {/* tether */}
        <path d="M128 470Q60 500 44 610Q34 690 92 730" fill="none" stroke="#9fb6cb" strokeWidth="3" strokeDasharray="7 7" opacity=".55" />
        <circle cx="92" cy="730" r="6" fill="#8fa8c0" stroke="#d9e8f5" strokeWidth="2" />

        {/* backpack */}
        <rect x="122" y="280" width="34" height="150" rx="16" fill="#9db3c9" stroke="#7e95ac" strokeWidth="3" />
        <rect x="244" y="280" width="34" height="150" rx="16" fill="#9db3c9" stroke="#7e95ac" strokeWidth="3" />
        <rect x="130" y="296" width="18" height="54" rx="8" fill="#c7d9e9" opacity=".7" />
        <rect x="252" y="296" width="18" height="54" rx="8" fill="#c7d9e9" opacity=".7" />

        {/* legs */}
        <path d="M166 456Q152 560 156 646Q158 672 178 672Q194 672 194 650L196 456Z" fill="url(#apSuit)" stroke="#93aac0" strokeWidth="3" />
        <path d="M234 456Q248 560 244 646Q242 672 222 672Q206 672 206 650L204 456Z" fill="url(#apSuit)" stroke="#93aac0" strokeWidth="3" />
        <path d="M158 540Q174 532 192 540" fill="none" stroke="#9db3c9" strokeWidth="8" strokeLinecap="round" />
        <path d="M242 540Q226 532 208 540" fill="none" stroke="#9db3c9" strokeWidth="8" strokeLinecap="round" />
        <rect x="146" y="644" width="56" height="30" rx="12" fill="#8fa8c0" stroke="#6f8aa4" strokeWidth="3" />
        <rect x="198" y="644" width="56" height="30" rx="12" fill="#8fa8c0" stroke="#6f8aa4" strokeWidth="3" />
        <path d="M152 666H198M202 666H248" stroke="#d7e6f4" strokeWidth="3" strokeLinecap="round" />

        {/* torso */}
        <path d="M200 252Q258 252 268 300L274 414Q276 452 246 462L154 462Q124 452 126 414L132 300Q142 252 200 252Z" fill="url(#apSuit)" stroke="#93aac0" strokeWidth="4" />
        <path d="M200 258Q160 258 148 300L142 410Q142 436 162 446L200 452Z" fill="#ffffff" opacity=".18" />

        {/* chest panel */}
        <rect x="172" y="318" width="56" height="48" rx="10" fill="#0b1d31" stroke={trim} strokeWidth="2.5" />
        <circle cx="184" cy="333" r="3.4" fill={trim}>
          <animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="196" cy="333" r="3.4" fill="#7dd3fc" opacity=".8" />
        <rect x="182" y="344" width="20" height="3" rx="1.5" fill="#7dd3fc" opacity=".8" />
        <rect x="182" y="351" width="30" height="3" rx="1.5" fill="#7dd3fc" opacity=".5" />
        <path d="M190 366H210" stroke="#7dd3fc" strokeWidth="2" opacity=".55" />

        {/* mission patch */}
        <circle cx="240" cy="330" r="15" fill="#0b1d31" stroke={trim} strokeWidth="2" />
        <text x="240" y="335" textAnchor="middle" fill={trim} fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif">{initials}</text>

        {/* belt */}
        <rect x="150" y="438" width="100" height="20" rx="9" fill="#8fa8c0" stroke="#6f8aa4" strokeWidth="2.5" />
        <rect x="188" y="442" width="24" height="12" rx="4" fill={trim} opacity=".85" />

        {/* arms */}
        <path d="M136 300Q112 336 116 396Q118 424 136 436" fill="none" stroke="url(#apSuitShade)" strokeWidth="30" strokeLinecap="round" />
        <path d="M264 300Q292 268 304 232" fill="none" stroke="url(#apSuitShade)" strokeWidth="30" strokeLinecap="round" />
        <circle cx="138" cy="442" r="17" fill="#eef6ff" stroke="#93aac0" strokeWidth="3" />
        <circle cx="139" cy="443" r="9" fill="#c3d4e6" opacity=".7" />
        <circle cx="308" cy="222" r="17" fill="#eef6ff" stroke="#93aac0" strokeWidth="3" />
        <circle cx="309" cy="223" r="9" fill="#c3d4e6" opacity=".7" />

        {/* handheld report tablet */}
        <g transform="rotate(-18 330 206)">
          <rect x="314" y="160" width="46" height="58" rx="7" fill="#0b1d31" stroke={accent} strokeWidth="2.5" />
          <rect x="321" y="170" width="32" height="4" rx="2" fill="#7dd3fc" opacity=".8" />
          <rect x="321" y="179" width="24" height="4" rx="2" fill="#7dd3fc" opacity=".55" />
          <circle cx="330" cy="199" r="7" fill={accent} opacity=".8">
            <animate attributeName="opacity" values=".9;.3;.9" dur="1.4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* neck ring */}
        <ellipse cx="200" cy="252" rx="46" ry="14" fill="#a7bccf" stroke="#7e95ac" strokeWidth="3" />

        {/* helmet shell */}
        <circle cx="200" cy="172" r="78" fill="url(#apSuit)" stroke="#9db4c9" strokeWidth="7" />
        <circle cx="200" cy="172" r="70" fill="url(#apVisor)" stroke={trim} strokeWidth="4" />
        <circle cx="200" cy="172" r="70" fill="none" stroke={accent} strokeWidth="2" opacity=".55" filter="url(#apSoftGlow)">
          <animate attributeName="opacity" values=".2;.7;.2" dur={face === 'alarmed' ? '1.3s' : '2.6s'} repeatCount="indefinite" />
        </circle>

        <Face expression={face} />

        {/* visor reflection */}
        <path d="M152 146Q168 112 206 110" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity=".28" />
        <path d="M246 218Q240 230 228 238" fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" opacity=".35" />

        {/* helmet trim + lamp + antenna */}
        <circle cx="200" cy="94" r="9" fill="#e9f4ff" stroke="#9db4c9" strokeWidth="3" />
        <circle cx="200" cy="94" r="4" fill={accent} filter="url(#apSoftGlow)" />
        <line x1="254" y1="126" x2="276" y2="100" stroke="#a7bccf" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="278" cy="97" r="4.5" fill={accent}>
          <animate attributeName="opacity" values="1;.2;1" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* suit seams */}
        <path d="M148 384Q200 398 252 384" fill="none" stroke="#a7bccf" strokeWidth="2" opacity=".5" />
        <path d="M174 462V436M226 462V436" stroke="#a7bccf" strokeWidth="2" opacity=".5" />
      </motion.g>

      {/* speech-bubble tail toward the message panel */}
      <path d="M296 330Q330 330 340 352Q344 372 318 382" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="6 7" opacity=".6" />
      <circle cx="318" cy="382" r="5" fill={accent} opacity=".8" />
    </svg>
  )
}
