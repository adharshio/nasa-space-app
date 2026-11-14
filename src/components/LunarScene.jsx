import { useState } from 'react'
import { motion } from 'framer-motion'
import { playClick } from '../utils/sound'

const CREW = [
  { id: 'maya', name: 'Dr. Maya Lin', callsign: 'MAYA', role: 'Commander', color: '#ef4444' },
  { id: 'samira', name: 'Samira Khan', callsign: 'SAMIRA', role: 'Life Support', color: '#10b981' },
  { id: 'alex', name: 'Alex Rivera', callsign: 'ALEX', role: 'Flight Engineer', color: '#f59e0b' },
]

const TASK_POSITIONS = {
  shelter: { maya: { x: 828, y: 263 }, samira: { x: 872, y: 267 }, alex: { x: 912, y: 272 } },
  inside: { maya: { x: 395, y: 266 }, samira: { x: 435, y: 270 }, alex: { x: 475, y: 274 } },
  repair: { maya: { x: 632, y: 270 }, samira: { x: 700, y: 273 }, alex: { x: 768, y: 276 } },
  walk: { maya: { x: 432, y: 280 }, samira: { x: 558, y: 278 }, alex: { x: 696, y: 290 } },
  idle: { maya: { x: 430, y: 280 }, samira: { x: 560, y: 278 }, alex: { x: 698, y: 290 } },
}

function resolveCrewState(scene, pendingEmergency, equipment) {
  const emergency = pendingEmergency?.type
  const decisionMode = scene?.mode || 'nominal'
  const override = scene?.crewOverride
  if (override) return override
  if (pendingEmergency?.phase === 'emergency' || (pendingEmergency && pendingEmergency.type && decisionMode === 'nominal')) {
    if (emergency === 'dust_storm') return { maya: 'inside', samira: 'inside', alex: 'repair' }
    if (emergency === 'radiation_storm') return { maya: 'walk', samira: 'walk', alex: 'walk' }
    if (emergency === 'oxygen_leak' || emergency === 'water_leak') return { maya: 'repair', samira: 'repair', alex: 'repair' }
    if (emergency === 'equipment_failure') return { maya: 'inside', samira: 'inside', alex: 'repair' }
    if (emergency === 'extreme_temperature') return { maya: 'inside', samira: 'inside', alex: 'inside' }
  }
  if (equipment?.radiationShelter) return { maya: 'shelter', samira: 'shelter', alex: 'shelter' }
  return { maya: 'walk', samira: 'walk', alex: 'walk' }
}

function resolveVisualMode(scene, pendingEmergency, environment) {
  if (scene?.mode && scene.mode !== 'nominal') return scene.mode
  if (pendingEmergency?.type) return pendingEmergency.type.replace('_', '_')
  if (environment.radiation > 35) return 'radiation_storm'
  if (environment.solarEfficiency < 60) return 'dust_storm'
  return 'nominal'
}

export default function LunarScene({
  _running = true,
  storm = false,
  roverTask = 'patrol',
  day = 1,
  solHour = 12.0,
  simSpeed = 1,
  mars = false,
  environment = {},
  scene = {},
  pendingEmergency = null,
  equipment = {},
  phase = 'active',
  modules = null,
  selectedModule = null,
  onSelectModule = null,
}) {
  const [speech, setSpeech] = useState(null)
  const stars = Array.from({ length: 110 }, (_, i) => ({
    x: (i * 137 + 29) % 1000,
    y: (i * 83 + 17) % 430,
    r: (i % 3) * 0.55 + 0.55,
    d: (i % 7) * 0.35,
  }))
  const visualMode = resolveVisualMode(scene, pendingEmergency, environment)
  const radiationLevel = environment.radiation ?? 18
  const radiationHigh = radiationLevel > 25
  const radiationCritical = radiationLevel > 37
  const dusty = visualMode === 'dust_storm' || storm
  const sheltering = visualMode === 'shelter' || (equipment?.radiationShelter && radiationHigh)
  const heating = equipment?.heating
  const crewState = resolveCrewState(scene, pendingEmergency, equipment || {})

  // 1. Continuous Time-of-Day Calculations
  const normalizedHour = ((solHour % 24) + 24) % 24
  const hourInt = Math.floor(normalizedHour)
  const minuteInt = Math.floor((normalizedHour - hourInt) * 60)
  const timeStr = `${String(hourInt).padStart(2, '0')}:${String(minuteInt).padStart(2, '0')}`

  const isDay = normalizedHour >= 5.0 && normalizedHour <= 19.5
  const isNight = !isDay
  const isDawn = normalizedHour >= 5.0 && normalizedHour < 8.5
  const isSunset = normalizedHour >= 16.5 && normalizedHour <= 19.5
  const isMidday = normalizedHour >= 8.5 && normalizedHour < 16.5

  // 2. Celestial Sun Orbit Path across space sky
  let sunX = 120
  let sunY = 88
  let sunOpacity = 1.0
  let sunGlowColor = mars ? '#ffb27a' : '#ffe17a'
  let sunDiskColor = mars ? '#ffeedd' : '#ffffff'

  if (isDay) {
    const dayT = (normalizedHour - 5.0) / 14.5
    sunX = 75 + dayT * 850
    sunY = 275 - Math.sin(dayT * Math.PI) * 205
    sunOpacity = Math.min(1, Math.sin(dayT * Math.PI) * 1.25 + 0.1)
    if (mars && isSunset) {
      sunGlowColor = '#38bdf8' // Famous NASA blue sunset on Mars!
      sunDiskColor = '#bae6fd'
    } else if (isDawn || isSunset) {
      sunGlowColor = mars ? '#f97316' : '#fde047'
    }
  } else {
    sunOpacity = 0
    sunX = -100
    sunY = 400
  }

  // 3. Dynamic Space Sky & Terrain Gradients
  let skyFrom, skyTo, groundFrom, groundTo
  if (mars) {
    if (visualMode === 'radiation_storm') {
      skyFrom = '#2a0d12'
      skyTo = '#6a2a32'
    } else if (isNight) {
      skyFrom = '#08040f'
      skyTo = '#170b22'
    } else if (isDawn) {
      skyFrom = '#280c16'
      skyTo = '#54222b'
    } else if (isSunset) {
      skyFrom = '#0f1d33' // Martian blue sunset scattering
      skyTo = '#264263'
    } else {
      skyFrom = '#331713'
      skyTo = '#783827'
    }
    groundFrom = isNight ? '#2e1510' : '#8a4a3a'
    groundTo = isNight ? '#150806' : '#3a1f1f'
  } else {
    // Moon
    if (visualMode === 'radiation_storm') {
      skyFrom = '#1b0d18'
      skyTo = '#471f2e'
    } else if (isNight) {
      skyFrom = '#010207'
      skyTo = '#050917'
    } else if (isDawn) {
      skyFrom = '#070a1e'
      skyTo = '#181b38'
    } else if (isSunset) {
      skyFrom = '#09081a'
      skyTo = '#1e1c3a'
    } else {
      skyFrom = '#030717'
      skyTo = '#0e1d3b'
    }
    groundFrom = isNight ? '#263140' : '#69788c'
    groundTo = isNight ? '#101722' : '#344257'
  }

  const panelOpacity = dusty ? 0.35 : isNight ? 0.45 : 0.95

  const powerLevel = modules?.power?.level ?? 1
  const habitatLevel = modules?.habitat?.level ?? 1
  const labLevel = modules?.lab?.level ?? 1
  const shelterLevel = modules?.shelter?.level ?? 1

  const handleSpeak = (text, x, y) => {
    playClick()
    setSpeech({ text, x, y })
    setTimeout(() => setSpeech(null), 3800)
  }

  const statusText =
    phase === 'emergency' && pendingEmergency
      ? `EMERGENCY: ${pendingEmergency.title}`
      : sheltering
        ? 'CREW SHELTERED · STORM VAULT'
        : dusty
          ? 'DUSTY CONDITIONS · SOLAR OUTPUT LOW'
          : radiationHigh
            ? 'ELEVATED RADIATION · LIMIT EVA'
            : isNight
              ? 'NIGHT CYCLE · BATTERY BUS ACTIVE'
              : 'ALL SYSTEMS NOMINAL'

  return (
    <div className={`scene-frame rounded-2xl border ${visualMode === 'radiation_storm' || visualMode === 'shelter' || dusty ? 'border-amber-500/50' : 'border-sky-500/20'} bg-slate-950 overflow-hidden relative shadow-2xl select-none`}>
      {/* Speech Bubble Overlay */}
      {speech && (
        <div
          style={{ left: `${(speech.x / 1000) * 100}%`, top: `${(speech.y / 430) * 100}%` }}
          className="absolute z-30 -translate-x-1/2 -translate-y-full mb-2 max-w-[210px] pointer-events-none animate-bounce"
        >
          <div className="bg-sky-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-2xl shadow-2xl border-2 border-white relative text-center leading-tight">
            {speech.text}
            <div className="w-2.5 h-2.5 bg-sky-500 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
          </div>
        </div>
      )}

      {/* Surface Cam Header with Real-Time Sol Clock & Solar Period */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-sky-500/15 bg-slate-950/80 text-[11px] tracking-widest text-sky-200/90">
        <span className="flex items-center gap-2">
          <i
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: simSpeed > 0 ? '#42e5a5' : '#ffbd4a' }}
          />{' '}
          SURFACE CAM 01 · {mars ? 'MARTIAN BASE' : 'LUNAR SHACKLETON CRATER'}
        </span>
        <span className="text-amber-300 font-bold flex items-center gap-2">
          <span>SOL {day}</span>
          <span className="text-slate-500">·</span>
          <span className="text-sky-300 font-mono text-xs">{timeStr}</span>
          <span className="text-slate-500">·</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
              isNight
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                : isSunset
                  ? 'bg-orange-950/80 text-orange-300 border border-orange-700/50'
                  : isDawn
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                    : 'bg-yellow-950/80 text-yellow-300 border border-yellow-700/50'
            }`}
          >
            {isNight ? 'Deep Night' : isSunset ? 'Sunset' : isDawn ? 'Dawn' : 'Solar Noon'}
          </span>
        </span>
        <span className="text-slate-400 font-medium">{statusText}</span>
      </div>

      <svg className="w-full h-auto block" viewBox="0 0 1000 430" role="img" aria-label="Animated outpost base">
        <defs>
          <linearGradient id="skyVisual" x2="0" y2="1"><stop stopColor={skyFrom} /><stop offset="1" stopColor={skyTo} /></linearGradient>
          <linearGradient id="groundVisual" x2="0" y2="1"><stop stopColor={groundFrom} /><stop offset="1" stopColor={groundTo} /></linearGradient>
          <linearGradient id="panelVisual" x2="0" y2="1"><stop stopColor="#19c6f5" stopOpacity={panelOpacity} /><stop offset="1" stopColor="#07558f" stopOpacity={panelOpacity} /></linearGradient>
          <linearGradient id="domeVisual" x2="0" y2="1"><stop stopColor="#5ad7ff" stopOpacity=".52" /><stop offset="1" stopColor="#0b2445" stopOpacity=".95" /></linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="radiationHalo"><stop offset="0%" stopColor="#ff6b6b" stopOpacity=".9" /><stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" /></radialGradient>
          <linearGradient id="headlampGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="roverHeadlightGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="earthshine">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="marsSunsetHalo">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1000" height="430" fill="url(#skyVisual)" />

        {/* Stars (twinkle brightly at night, dimmed by daytime glare) */}
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#e6f4ff"
            opacity={dusty ? 0.15 : isNight ? 0.95 : 0.45}
          >
            <animate
              attributeName="opacity"
              values={dusty ? '.1;.25;.1' : isNight ? '.4;1;.4' : '.15;.55;.15'}
              dur={`${2 + s.d}s`}
              begin={`${s.d}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Radiation Alert Beams */}
        {visualMode === 'radiation_storm' && (
          <>
            <circle cx="120" cy="88" r="84" fill="none" stroke="#ff6b6b" strokeWidth="2.5" opacity=".45">
              <animate attributeName="r" values="40;120;40" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".75;0;.75" dur="2.6s" repeatCount="indefinite" />
            </circle>
            {[
              'M120 88 L360 205',
              'M120 88 L520 260',
              'M120 88 L720 285',
              'M120 88 L900 250',
            ].map((d, i) => (
              <motion.path
                key={i}
                d={d}
                stroke="#ff7070"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
                animate={{ opacity: [0.2, 0.9, 0.2], pathLength: [0.35, 1, 0.35] }}
                transition={{ duration: 1.4 + i * 0.15, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
              />
            ))}
          </>
        )}

        {/* DYNAMIC CELESTIAL SUN ORBITING ACROSS THE SKY */}
        {isDay && sunOpacity > 0 && (
          <g opacity={dusty ? sunOpacity * 0.45 : sunOpacity} transform={`translate(${sunX}, ${sunY})`}>
            {mars && isSunset ? (
              <circle r="55" fill="url(#marsSunsetHalo)" />
            ) : (
              <circle r="44" fill={sunGlowColor} opacity="0.35" filter="url(#glow)" />
            )}
            <circle r="26" fill={sunDiskColor} filter="url(#glow)" />
            {/* Solar Corona Rays at High Noon */}
            {!dusty && isMidday && (
              <g opacity="0.45">
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="-30"
                    x2="0"
                    y2="-42"
                    stroke={sunGlowColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    transform={`rotate(${i * 45})`}
                  />
                ))}
              </g>
            )}
          </g>
        )}

        {/* Earth / Phobos in Sky */}
        <g transform="translate(850 90)">
          {mars ? (
            <g>
              <circle r="24" fill="#5c382f" stroke="#c46b4f" strokeWidth="2" />
              <ellipse cx="-4" cy="-3" rx="7" ry="4" fill="#3a1e17" />
              <text y="38" textAnchor="middle" fill="#d7927d" fontSize="9" fontWeight="bold">PHOBOS</text>
            </g>
          ) : (
            <g>
              {/* Luminous Earth in lunar sky with atmospheric rim and night-glow */}
              <circle r="36" fill="#1d4ed8" filter={isNight ? 'url(#glow)' : undefined} />
              <circle r="38" fill="none" stroke="#60a5fa" strokeWidth="2.5" opacity={isNight ? 0.9 : 0.45} />
              <path d="M-13 -3Q-4 -25 9 -11Q20 -2 11 9Q-1 22-13 9Z" fill="#34d399" />
              <path d="M-6 8Q-1 3 8 7Q5 16 -4 14Z" fill="#cbd5e1" opacity="0.75" />
              <text y="52" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">EARTH</text>
            </g>
          )}
        </g>

        {/* Soft Earthshine casting blue ambient light across lunar landscape during night */}
        {!mars && isNight && (
          <ellipse cx="650" cy="340" rx="360" ry="75" fill="url(#earthshine)" />
        )}

        {/* Lunar / Martian Terrain */}
        <path d="M0 305Q120 285 240 302T500 296T760 301T1000 287L1000 430H0Z" fill="url(#groundVisual)" />
        <ellipse cx="785" cy="385" rx="78" ry="15" fill="#18253a" opacity={isNight ? 0.65 : 0.4} />
        <ellipse cx="330" cy="395" rx="95" ry="12" fill="#18253a" opacity={isNight ? 0.6 : 0.35} />

        {/* Pressurized Walkway Catwalk */}
        <path d="M205 310H950" stroke={isNight ? '#64748b' : '#d0d9e3'} strokeWidth="12" opacity=".45" />
        <path d="M205 310H950" stroke="#263a53" strokeWidth="3" strokeDasharray="14 12" opacity=".8" />

        {/* Night-time Runway Guide Beacons along Catwalk */}
        {isNight && [240, 310, 380, 450, 520, 590, 660, 730, 800, 870, 940].map((cx, i) => (
          <circle key={i} cx={cx} cy="310" r="3" fill={i % 2 === 0 ? '#38bdf8' : '#f59e0b'} filter="url(#glow)" />
        ))}

        {/* 1. POWER MODULE (Solar Array or Kilopower Reactor) */}
        <g
          transform="translate(120 235)"
          className="cursor-pointer group"
          onClick={() => {
            playClick()
            onSelectModule?.('power')
          }}
        >
          {selectedModule === 'power' && (
            <rect x="-10" y="-30" width="160" height="95" rx="12" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 5" />
          )}

          {powerLevel === 3 ? (
            // Kilopower Nuclear Reactor (runs 24/7 day and night!)
            <g>
              <rect x="40" y="-5" width="60" height="45" rx="8" fill="#dc2626" stroke="#fde047" strokeWidth="2.5" />
              <rect x="52" y="-18" width="36" height="14" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="70" y1="-18" x2="70" y2="-28" stroke="#fde047" strokeWidth="2.5" />
              <circle cx="70" cy="-30" r="6" fill="#f59e0b" filter="url(#glow)" />
              <line x1="30" y1="8" x2="40" y2="8" stroke="#94a3b8" strokeWidth="4" />
              <line x1="100" y1="8" x2="110" y2="8" stroke="#94a3b8" strokeWidth="4" />
              <text x="70" y="-38" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="800">KILOPOWER REACTOR</text>
            </g>
          ) : (
            // Solar Panels (active during day, sleep standby at night)
            <g>
              <text x="70" y="-17" textAnchor="middle" fill={dusty ? '#fbbf24' : isNight ? '#94a3b8' : '#dceaff'} fontSize="13" fontWeight="700">
                {powerLevel === 2 ? 'DUAL-TRACKING ARRAY' : 'SOLAR ARRAY'}{dusty ? ' · DUSTY' : isNight ? ' · NIGHT STANDBY' : ''}
              </text>
              <path d="M35 18V78M105 18V78" stroke="#aebdd0" strokeWidth="9" opacity={dusty ? 0.6 : 1} />
              <rect x="0" y="0" width="140" height="24" rx="5" fill="url(#panelVisual)" stroke={powerLevel === 2 ? '#38bdf8' : dusty ? '#a16207' : '#21d7ff'} strokeWidth="4" />
              {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${i * 20} 2V22`} stroke="#7ce9ff" opacity={dusty ? 0.15 : isNight ? 0.2 : 0.65} />)}
            </g>
          )}

          {/* Level Badge */}
          <rect x="45" y="42" width="50" height="16" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <text x="70" y="54" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fde047">
            ⚡ Lv {powerLevel}
          </text>
        </g>

        {/* 2. HABITAT MODULE (Base Home with Interior Night Window Glow) */}
        <g
          transform="translate(355 235)"
          className="cursor-pointer group"
          onClick={() => {
            playClick()
            onSelectModule?.('habitat')
          }}
        >
          {selectedModule === 'habitat' && (
            <rect x="-10" y="-30" width="180" height="120" rx="14" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 5" />
          )}
          <text x="80" y="-18" textAnchor="middle" fill="#e5efff" fontSize="14" fontWeight="700">
            {habitatLevel >= 2 ? 'REGOLITH DOME' : 'HABITAT'}{heating ? ' · HEATED' : ''}
          </text>
          <path d="M0 85A80 80 0 0 1 160 85Z" fill={habitatLevel >= 2 ? '#475569' : 'url(#domeVisual)'} stroke={heating ? '#ffbd4a' : '#56d8ff'} strokeWidth="5" />
          
          {/* Habitat Window / Airlock (Glows warmly at night!) */}
          <rect
            x="67"
            y="50"
            width="26"
            height="35"
            rx="4"
            fill={isNight ? '#fde047' : heating ? '#ffe9a1' : '#102e4e'}
            stroke={isNight ? '#ffffff' : '#b3eaff'}
            strokeWidth="2"
            filter={isNight ? 'url(#glow)' : undefined}
          />
          {isNight && (
            <ellipse cx="80" cy="92" rx="34" ry="8" fill="#fde047" opacity="0.35" filter="url(#glow)" />
          )}

          <circle cx="125" cy="54" r="5" fill={radiationCritical ? '#ff6b6b' : '#7df4bd'} filter="url(#glow)" />

          {/* Level Badge */}
          <rect x="55" y="66" width="50" height="16" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <text x="80" y="78" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fde047">
            🏠 Lv {habitatLevel}
          </text>
        </g>

        {/* 3. SCIENCE LAB */}
        <g
          transform="translate(620 250)"
          className="cursor-pointer group"
          onClick={() => {
            playClick()
            onSelectModule?.('lab')
          }}
        >
          {selectedModule === 'lab' && (
            <rect x="-10" y="-30" width="165" height="110" rx="14" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 5" />
          )}
          <text x="72" y="-18" textAnchor="middle" fill="#e5efff" fontSize="13" fontWeight="700">
            {labLevel >= 2 ? 'BIOLOGY CORE' : 'RESEARCH LAB'}
          </text>
          <rect width="145" height="65" rx="10" fill={labLevel >= 2 ? '#3b82f6' : '#8bb8d7'} stroke={labLevel >= 2 ? '#60a5fa' : '#48d9ff'} strokeWidth="4" />
          <rect x="12" y="12" width="121" height="40" rx="5" fill={isNight ? '#0b1d33' : '#102d4b'} />
          
          {/* Lab Monitor Glow at Night */}
          <circle cx="119" cy="32" r="5" fill={isNight ? '#38bdf8' : '#52e5ae'} filter={isNight ? 'url(#glow)' : undefined} />
          {isNight && (
            <line x1="20" y1="32" x2="105" y2="32" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
          )}

          {/* Level Badge */}
          <rect x="47" y="50" width="50" height="16" rx="5" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
          <text x="72" y="62" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#60a5fa">
            🔬 Lv {labLevel}
          </text>
        </g>

        {/* 4. STORM VAULT / SHELTER */}
        <g
          transform="translate(815 250)"
          className="cursor-pointer group"
          onClick={() => {
            playClick()
            onSelectModule?.('shelter')
          }}
        >
          {selectedModule === 'shelter' && (
            <rect x="-10" y="-30" width="150" height="100" rx="14" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 5" />
          )}
          <text x="65" y="-20" textAnchor="middle" fill="#e5efff" fontSize="13" fontWeight="700">
            STORM VAULT{sheltering ? ' · SEALED' : ' · STANDBY'}
          </text>
          <rect width="130" height="65" rx="10" fill={sheltering ? '#1c4966' : '#287eaa'} stroke={shelterLevel >= 2 ? '#f59e0b' : '#54d7ff'} strokeWidth="4" />
          <rect x="8" y="8" width="114" height="49" rx="7" fill={sheltering ? '#123147' : '#3db6e4'} opacity=".9" />
          {sheltering && <path d="M65 22v21M54 31h22" stroke="#ffbd4a" strokeWidth="4" />}

          {/* Level Badge */}
          <rect x="40" y="50" width="50" height="16" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <text x="65" y="62" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#38bdf8">
            🛡️ Lv {shelterLevel}
          </text>
        </g>

        {/* CREW ASTRONAUTS WITH FLOATING TASK BADGES AND NIGHT HEADLAMPS */}
        {CREW.map((member) => {
          const task = crewState[member.id] || 'walk'
          const pos = TASK_POSITIONS[task]?.[member.id] || TASK_POSITIONS.walk[member.id]
          const insideHabitat = task === 'inside'
          const shelteringNow = task === 'shelter'
          const repairing = task === 'repair'

          const taskBadge = shelteringNow
            ? '🛡️ In Storm Vault'
            : repairing
              ? '🔧 Repairing Module'
              : member.id === 'alex'
                ? '⚡ Power Maintenance'
                : member.id === 'samira'
                  ? '🌱 Hydroponics Check'
                  : '🔬 Core Sample Analysis'

          const dialogue = shelteringNow
            ? `${member.name}: Safe inside the shielded vault!`
            : member.id === 'maya'
              ? `Maya: Sol ${day} operations nominal at ${timeStr}. Outpost systems operational!`
              : member.id === 'alex'
                ? isNight
                  ? 'Alex: Night cycle active. Running on stored battery bus!'
                  : 'Alex: High solar input! Batteries charging at full rate.'
                : 'Samira: Atmospheric and oxygen scrubbers in optimal parameters!'

          return (
            <Astronaut
              key={member.id}
              x={pos.x}
              y={pos.y}
              color={member.color}
              name={member.callsign}
              task={task}
              taskBadge={taskBadge}
              sheltering={shelteringNow}
              repairing={repairing}
              insideHabitat={insideHabitat}
              isNight={isNight}
              onClick={() => handleSpeak(dialogue, pos.x, pos.y - 30)}
            />
          )
        })}

        {/* ROVER (WITH FORWARD HIGH-BEAM HEADLIGHTS AT NIGHT) */}
        <motion.g
          animate={{ x: roverTask === 'return' ? [0, -150, -150] : roverTask === 'clean' ? [0, 260, 260, 0] : [0, 110, 210, 110, 0] }}
          transition={{ duration: roverTask === 'clean' ? 8 : 14, repeat: Infinity, ease: 'easeInOut' }}
          className="cursor-pointer"
          onClick={() => handleSpeak("Rover: Beep boop! Mined regolith cart ready for delivery! 🛞", 300, 340)}
        >
          <g transform="translate(260 350)">
            {/* Rover Night Headlight Projection Beam */}
            {isNight && (
              <polygon
                points="66,-19 210,-45 230,22 66,-10"
                fill="url(#roverHeadlightGlow)"
                opacity="0.75"
              />
            )}
            <ellipse cx="25" cy="35" rx="48" ry="7" fill="#101c2d" opacity=".5" />
            <rect x="-7" y="4" width="64" height="25" rx="8" fill={dusty ? '#b8a88e' : '#dce7f2'} stroke="#8298b0" strokeWidth="2" />
            <rect x="4" y="-8" width="40" height="18" rx="5" fill={dusty ? '#6f6658' : '#9bc8e4'} stroke="#e7f5ff" strokeWidth="2" />
            <rect x="15" y="-4" width="17" height="10" rx="2" fill="#102f50" />
            {[4, 25, 47].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="30" r="10" fill="#17263a" stroke="#b8c8d8" strokeWidth="3" />
                <circle cx={x} cy="30" r="3" fill="#6f879e" />
              </g>
            ))}
            <path d="M48 -5L65 -18" stroke="#a8bed2" strokeWidth="3" />
            <circle cx="66" cy="-19" r="4" fill={isNight ? '#fef08a' : dusty ? '#fbbf24' : '#ffe17a'} filter={isNight ? 'url(#glow)' : undefined} />
          </g>
        </motion.g>

        {/* Live Simulation Indicator */}
        <rect x="15" y="15" width="170" height="28" rx="14" fill="#071225" opacity=".85" stroke="#28415e" />
        <circle cx="31" cy="29" r="4" fill={simSpeed > 0 ? '#42e5a5' : '#ffbd4a'} />
        <text x="44" y="33" fill="#d9eaff" fontSize="10" letterSpacing="1.3">
          {simSpeed === 0 ? 'SIMULATION PAUSED' : `SIMULATION LIVE · ${simSpeed}X`}
        </text>
        <text x="980" y="410" textAnchor="end" fill="#b8cce0" fontSize="10">
          RAD {Math.round(radiationLevel)} · SOL {day} · {timeStr} · {dusty ? 'DUST' : isNight ? 'NIGHT' : 'DAY'}
        </text>
      </svg>
    </div>
  )
}

function Astronaut({ x, y, color, name, task = 'walk', taskBadge, sheltering = false, repairing = false, insideHabitat = false, isNight = false, onClick }) {
  const walking = task === 'walk' && !sheltering
  const motionX = sheltering
    ? [x, x + 1, x]
    : repairing
      ? [x, x + 18, x + 35, x + 18, x]
      : walking
        ? [x, x + 24, x + 48, x + 24, x]
        : insideHabitat
          ? [x, x, x]
          : [x, x + 2, x]
  const duration = sheltering ? 2.5 : repairing ? 6 : walking ? 12 : 3.8

  return (
    <motion.g
      initial={{ x, y }}
      animate={{ x: motionX, y: [y, y - 1, y] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Night Helmet Spotlight Cone */}
      {isNight && !insideHabitat && (
        <g>
          <polygon
            points="6,-2 65,-14 70,30 6,4"
            fill="url(#headlampGlow)"
            opacity="0.8"
          />
          <circle cx="6" cy="-2" r="3" fill="#fef08a" filter="url(#glow)" />
        </g>
      )}

      {/* Floating Task Badge above astronaut */}
      <g transform="translate(0, -22)" className="transition-transform group-hover:scale-110">
        <rect
          x="-50"
          y="-10"
          width="100"
          height="16"
          rx="8"
          fill="#090d1a"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.95"
        />
        <text
          x="0"
          y="1.5"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="bold"
          fill="#f8fafc"
          className="select-none pointer-events-none"
        >
          {taskBadge}
        </text>
      </g>

      <g className="astronaut" opacity={insideHabitat ? 0.35 : 1}>
        <ellipse cx="0" cy="39" rx="15" ry="4" fill="#020713" opacity=".45" />
        <path d="M-9 19L-11 34L-5 35L0 22L5 35L11 34L9 19Z" fill={repairing ? '#ffe4a3' : '#dce8f5'} stroke="#829bb7" strokeWidth="1.5" />
        <path d="M-12 8Q-17 10-15 22L-9 24L-5 12M12 8Q17 10 15 22L9 24L5 12" fill={insideHabitat ? '#93a7bd' : '#e8f2ff'} stroke="#829bb7" strokeWidth="1.5" />
        <rect x="-10" y="6" width="20" height="17" rx="6" fill={insideHabitat ? '#9fb4cb' : '#f2f7ff'} stroke="#819bb8" />
        <rect x="-14" y="8" width="5" height="12" rx="2" fill="#8ba2ba" /><rect x="9" y="8" width="5" height="12" rx="2" fill="#8ba2ba" />
        <circle cx="0" cy="-2" r="12" fill={insideHabitat ? '#a9bdd0' : '#e8f3ff'} stroke="#9db4ce" strokeWidth="2" /><ellipse cx="0" cy="-2" rx="8.5" ry="7.2" fill="#07182d" stroke={color} strokeWidth="2" />
        <path d="M-5 -3Q0 -8 6 -3" fill="none" stroke={insideHabitat ? '#907040' : '#6bdcff'} strokeWidth="1.5" /><circle cx="-3" cy="-1" r="1" fill="#7ef4ff" /><circle cx="3" cy="-1" r="1" fill="#7ef4ff" />
        <rect x="-8" y="40" width="16" height="3" rx="1.5" fill={color} />
      </g>
      <text x="0" y="56" textAnchor="middle" fill="#f4f8ff" fontSize="9" fontWeight="700">{name}</text>
    </motion.g>
  )
}
