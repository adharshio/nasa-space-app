import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { solClockLabel } from '../simulation/config'

const CREW = [
  { id: 'maya', name: 'MAYA', role: 'Engineer', color: '#ff667c' },
  { id: 'samira', name: 'SAMIRA', role: 'Geologist', color: '#36e0b0' },
  { id: 'alex', name: 'ALEX', role: 'Scientist', color: '#ffbd4a' },
]

const TASK_POSITIONS = {
  shelter: { maya: { x: 828, y: 263 }, samira: { x: 872, y: 267 }, alex: { x: 912, y: 272 } },
  inside: { maya: { x: 395, y: 266 }, samira: { x: 435, y: 270 }, alex: { x: 475, y: 274 } },
  repair: { maya: { x: 632, y: 270 }, samira: { x: 700, y: 273 }, alex: { x: 768, y: 276 } },
  solar: { maya: { x: 122, y: 268 }, samira: { x: 168, y: 262 }, alex: { x: 210, y: 271 } },
  lab: { maya: { x: 640, y: 272 }, samira: { x: 705, y: 275 }, alex: { x: 765, y: 278 } },
  rover: { maya: { x: 235, y: 352 }, samira: { x: 285, y: 356 }, alex: { x: 345, y: 348 } },
  walk: { maya: { x: 432, y: 280 }, samira: { x: 558, y: 278 }, alex: { x: 696, y: 290 } },
  idle: { maya: { x: 430, y: 280 }, samira: { x: 560, y: 278 }, alex: { x: 698, y: 290 } },
}

const CREW_TASK_MAP = {
  'Habitat inspection': 'inside',
  'Equipment repair': 'repair',
  'Solar array maintenance': 'solar',
  'Greenhouse monitoring': 'inside',
  'Scientific research': 'lab',
  'Rover operation': 'rover',
  'Medical monitoring': 'inside',
  'Rest': 'inside',
}

function resolveCrewState(scene, pendingEmergency, equipment, assignments, radiationLevel = 0) {
  const emergency = pendingEmergency?.type
  const override = scene?.crewOverride
  if (override) return override
  // Before an emergency is resolved, stage the crew for the visible hazard.
  if (pendingEmergency?.type) {
    if (emergency === 'dust_storm') return { maya: 'inside', samira: 'inside', alex: 'repair' }
    if (emergency === 'radiation_storm') return { maya: 'walk', samira: 'walk', alex: 'walk' }
    if (emergency === 'oxygen_leak' || emergency === 'water_leak') return { maya: 'repair', samira: 'repair', alex: 'repair' }
    if (emergency === 'equipment_failure') return { maya: 'inside', samira: 'inside', alex: 'repair' }
    if (emergency === 'extreme_temperature') return { maya: 'inside', samira: 'inside', alex: 'inside' }
  }
  // A powered shelter is only occupied when radiation is actually dangerous.
  if (equipment.radiationShelter && radiationLevel > 35) return { maya: 'shelter', samira: 'shelter', alex: 'shelter' }
  // Normal operations: astronauts stand at the stations matching their assigned tasks
  if (assignments && Object.keys(assignments).length) {
    const pick = (id) => CREW_TASK_MAP[assignments[id]] ?? 'walk'
    return { maya: pick('maya'), alex: pick('alex'), samira: pick('samira') }
  }
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
  running,
  storm,
  roverTask,
  day,
  mars = false,
  night = false,
  environment = {},
  scene = {},
  pendingEmergency = null,
  equipment = {},
  phase = 'active',
  assignments = {},
  roverMission = null,
  solProgress = 0,
  issue = null,
  onOpenIssue = null,
  crewMoods = {},
}) {
  const stars = useMemo(() => Array.from({ length: 90 }, (_, i) => ({ x: (i * 137 + 29) % 1000, y: (i * 83 + 17) % 430, r: (i % 3) * 0.55 + 0.55, d: (i % 7) * 0.35 })), [])
  const dustParticles = useMemo(() => Array.from({ length: 55 }, (_, i) => {
    const y0 = (i * 47) % 380
    return {
      key: i,
      x: (i * 83) % 1000,
      y0,
      r: (i % 3) + 1,
      initial: { x: -30, y: y0 },
      animate: { x: 1040, y: [y0, (y0 + 60) % 380] },
      transition: { duration: 2.5 + (i % 4), repeat: Infinity, delay: (i % 7) * 0.2, ease: 'linear' },
    }
  }), [])
  const roverTargets = useMemo(() => (
    roverTask === 'return' ? [0, -150, -150] : roverTask === 'clean' ? [0, 260, 260, 0] : [0, 110, 210, 110, 0]
  ), [roverTask])
  const solarShimmer = useMemo(() => ({ rotate: [-5, 5, -5] }), [])
  const visualMode = resolveVisualMode(scene, pendingEmergency, environment)
  const radiationLevel = environment.radiation ?? 18
  const radiationHigh = radiationLevel > 25
  const radiationCritical = radiationLevel > 37
  const dusty = visualMode === 'dust_storm' || storm
  const sheltering = visualMode === 'shelter' || (equipment?.radiationShelter && radiationHigh)
  const heating = equipment?.heating
  const crewState = resolveCrewState(scene, pendingEmergency, equipment || {}, assignments, radiationLevel)
  const issueStationTask = { solar: 'solar', habitat: 'inside', lab: 'repair', vault: 'shelter', rover: 'rover' }
  const crewWithReporter = issue?.astronautId
    ? { ...crewState, [issue.astronautId]: issueStationTask[issue.station] ?? 'repair' }
    : crewState
  const issueDanger = issue?.severity === 'danger' || issue?.kind === 'emergency'
  const issueColor = issueDanger ? '#f87171' : '#fbbf24'
  const ISSUE_PIN_POS = { solar: { x: 262, y: 232 }, habitat: { x: 540, y: 232 }, lab: { x: 800, y: 244 }, vault: { x: 955, y: 244 }, rover: { x: 335, y: 335 } }
  const issuePin = issue ? (ISSUE_PIN_POS[issue.station] ?? ISSUE_PIN_POS.lab) : null
  const localTime = solClockLabel(solProgress)
  const solPct = Math.round(Math.max(0, Math.min(1, solProgress)) * 100)

  const skyFrom = mars ? (visualMode === 'radiation_storm' ? '#2a0d12' : '#120a1f') : (visualMode === 'radiation_storm' ? '#1b0d18' : '#080e24')
  const skyTo = mars ? (visualMode === 'radiation_storm' ? '#6a2a32' : '#2a1238') : (visualMode === 'radiation_storm' ? '#471f2e' : '#172744')

  const panelOpacity = dusty ? 0.35 : 0.9
  const groundFrom = mars ? '#8a4a3a' : '#69788c'
  const groundTo = mars ? '#3a1f1f' : '#344257'

  const statusText =
    phase === 'emergency' && pendingEmergency
      ? `EMERGENCY: ${pendingEmergency.title}`
      : sheltering
        ? 'CREW SHELTERED · STORM VAULT'
        : dusty
          ? 'DUSTY CONDITIONS · SOLAR OUTPUT LOW'
          : radiationHigh
            ? 'ELEVATED RADIATION · LIMIT EVA'
            : night
              ? 'LUNAR NIGHT · SOLAR OUTPUT ~0'
              : 'ALL SYSTEMS NOMINAL'

  return (
    <div className={`scene-frame rounded-2xl border min-w-0 ${visualMode === 'radiation_storm' || visualMode === 'shelter' || dusty ? 'border-amber-500/50' : 'border-sky-500/20'} bg-slate-950 overflow-hidden relative shadow-2xl`}>
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-sky-500/15 bg-slate-950/80 text-[11px] tracking-widest text-sky-200/90">
        <span className="flex items-center gap-2"><i className="inline-block h-2 w-2 rounded-full" style={{ background: running ? '#42e5a5' : '#ffbd4a', boxShadow: running ? '0 0 8px #42e5a5' : 'none' }} /> SURFACE CAM 01</span>
        <span className="text-amber-300 truncate min-w-0">{statusText}</span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-400">SOL {String(day).padStart(2, '0')}</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-200 font-mono">{localTime}</span>
          <span className="hidden sm:inline text-slate-500">LOCAL</span>
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 backdrop-blur-sm">
            <div className="relative grid h-9 w-9 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-9 w-9 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * (1 - Math.max(0, Math.min(1, solProgress)))} style={{ transition: 'stroke-dashoffset .5s linear' }} />
              </svg>
              <span className="text-[9px] font-bold text-cyan-200">{solPct}%</span>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400">Sol clock</p>
              <p className="font-mono text-sm font-semibold leading-tight text-white">{localTime}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400">{mars ? 'Ares Planitia' : 'Lunar South Pole'}</p>
            <p className="text-[11px] font-semibold text-sky-200">{mars ? '18.4° N · MARTIAN TERRAIN' : '89.9° S · LUNAR TERRAIN'}</p>
          </div>
        </div>

      <svg className="w-full h-auto block" viewBox="0 0 1000 430" role="img" aria-label="Animated lunar or martian base with astronauts, rover, solar array and habitat">
        <defs>
          <linearGradient id="skyVisual" x2="0" y2="1"><stop stopColor={skyFrom} /><stop offset="1" stopColor={skyTo} /></linearGradient>
          <linearGradient id="groundVisual" x2="0" y2="1"><stop stopColor={groundFrom} /><stop offset="1" stopColor={groundTo} /></linearGradient>
          <linearGradient id="panelVisual" x2="0" y2="1"><stop stopColor="#19c6f5" stopOpacity={panelOpacity} /><stop offset="1" stopColor="#07558f" stopOpacity={panelOpacity} /></linearGradient>
          <linearGradient id="domeVisual" x2="0" y2="1"><stop stopColor="#5ad7ff" stopOpacity=".52" /><stop offset="1" stopColor="#0b2445" stopOpacity=".95" /></linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softGlow"><feGaussianBlur stdDeviation="9" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="radiationHalo"><stop offset="0%" stopColor="#ff6b6b" stopOpacity=".9" /><stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" /></radialGradient>
        </defs>

        {/* Sky / environment */}
        <rect width="1000" height="430" fill="url(#skyVisual)" />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e6f4ff" opacity={dusty ? 0.25 : 0.7}>
            <animate attributeName="opacity" values={dusty ? '.1;.35;.1' : '.25;.95;.25'} dur={`${2 + s.d}s`} begin={`${s.d}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {visualMode === 'radiation_storm' && (
          <>
            {/* Sun-driven radiation alert: expanding wave fronts from the Sun toward the base */}
            <circle cx="120" cy="88" r="84" fill="none" stroke="#ff6b6b" strokeWidth="2.5" opacity=".45">
              <animate attributeName="r" values="40;120;40" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".75;0;.75" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="120" cy="88" r="48" fill="none" stroke="#ff8a8a" strokeWidth="1.5" opacity=".35">
              <animate attributeName="r" values="56;150;56" dur="3.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".55;0;.55" dur="3.4s" repeatCount="indefinite" />
            </circle>

            {/* Alert beams radiating from the Sun toward the surface */}
            {[
              'M120 88 L360 205',
              'M120 88 L520 260',
              'M120 88 L720 285',
              'M120 88 L900 250',
              'M120 88 L285 300',
            ].map((d, i) => (
              <motion.path
                key={i}
                d={d}
                stroke="#ff7070"
                strokeWidth={i === 2 ? 3.5 : 2.2}
                strokeLinecap="round"
                fill="none"
                initial={{ opacity: 0.15, pathLength: 0.2 }}
                animate={{ opacity: [0.2, 0.9, 0.2], pathLength: [0.35, 1, 0.35] }}
                transition={{ duration: 1.4 + i * 0.15, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 0 8px rgba(255, 90, 90, .8))' }}
              />
            ))}

            {/* Incoming radiation particles traveling along the beams */}
            {[
              { x: 240, y: 135 }, { x: 330, y: 175 }, { x: 430, y: 215 }, { x: 540, y: 235 }, { x: 660, y: 255 }, { x: 780, y: 270 },
            ].map((p, i) => (
              <motion.circle key={i} cx={p.x} cy={p.y} r="3.2" fill="#ffd1d1" stroke="#ff4d4d" strokeWidth="1.5" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.7] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
            ))}

            {/* Pulsing warning ring around the Sun */}
            <circle cx="120" cy="86" r="68" fill="url(#radiationHalo)" opacity=".55">
              <animate attributeName="r" values="58;92;58" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".55;.25;.55" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="120" cy="86" r="33" fill="#ff4d4d" opacity=".65" />

            {/* Sun alert label — extra visible cue */}
            <g transform="translate(120 150)" textAnchor="middle">
              <rect x="-70" y="-13" width="140" height="26" rx="13" fill="#2a0606" stroke="#ff5a5a" strokeOpacity=".9" />
              <text fill="#ffb4b4" fontSize="11" fontWeight="800" letterSpacing="1.6">RADIATION ALERT</text>
            </g>

            {Array.from({ length: 16 }).map((_, i) => (
              <motion.circle key={`r-${i}`} cx={i * 60 + 40} cy={70 + (i % 5) * 35} r="2.2" fill="#ff8a8a" initial={{ opacity: 0 }} animate={{ opacity: [0.1, 0.8, 0.1], y: [0, 24, 0] }} transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.18 }} />
            ))}
          </>
        )}

        <circle cx="120" cy="88" r="34" fill={mars ? '#ffb27a' : visualMode === 'radiation_storm' ? '#ff9b7a' : '#ffe17a'} filter="url(#glow)" opacity={dusty ? 0.6 : 1} />
        <circle cx="120" cy="88" r="43" fill={mars ? '#ff9a4d' : '#ffd65e'} opacity={dusty ? 0.04 : 0.09} />

        <g transform="translate(850 90)">
          {mars ? (
            <>
              <circle r="35" fill="#472a24" stroke="#c46b4f" strokeWidth="2" />
              <path d="M-13 -3Q-4 -25 9 -11Q20 -2 11 9Q-1 22-13 9Z" fill="#a88b66" opacity=".8" />
              <text y="52" textAnchor="middle" fill="#ffb89a" fontSize="10">PHOBOS</text>
            </>
          ) : (
            <>
              <circle r="35" fill="#2864e8" />
              <path d="M-13 -3Q-4 -25 9 -11Q20 -2 11 9Q-1 22-13 9Z" fill="#4ed28b" />
              <text y="52" textAnchor="middle" fill="#91b8ff" fontSize="10">EARTH</text>
            </>
          )}
        </g>

        <g opacity={dusty ? 0.25 : 0.12}><path d="M120 130L330 300M120 130L550 310M120 130L760 320" stroke={mars ? '#ff9a4d' : visualMode === 'radiation_storm' ? '#ff8a8a' : '#ffe7a1'} strokeWidth="35" /></g>

        {/* distant terrain — depth behind the outpost */}
        <path d="M0 302L110 246L205 288L318 238L432 292L556 252L690 296L806 248L920 290L1000 256L1000 318L0 318Z" fill={mars ? '#45201a' : '#0f1b30'} opacity=".6" />
        <path d="M0 316L96 282L196 308L298 272L418 312L562 282L702 314L832 280L942 310L1000 286L1000 336L0 336Z" fill={mars ? '#2d1512' : '#0a1322'} opacity=".85" />

        <path d="M0 305Q120 285 240 302T500 296T760 301T1000 287L1000 430H0Z" fill="url(#groundVisual)" />
        <path d="M0 350Q180 328 340 350T670 345T1000 338" fill="none" stroke={mars ? '#c59a88' : '#9aa8b8'} opacity=".25" strokeWidth="3" />
        <ellipse cx="785" cy="385" rx="78" ry="15" fill="#18253a" opacity=".45" />
        <ellipse cx="330" cy="395" rx="95" ry="12" fill="#18253a" opacity=".4" />
        <ellipse cx="560" cy="418" rx="42" ry="7" fill="#0a1524" opacity=".5" />
        <ellipse cx="905" cy="355" rx="30" ry="5" fill="#0a1524" opacity=".45" />

        {/* Solar array - weakens in dust storms */}
        <g transform="translate(120 235)">
          <text x="70" y="-17" textAnchor="middle" fill={dusty ? '#fbbf24' : '#dceaff'} fontSize="13" fontWeight="700">SOLAR ARRAY{dusty ? ' · LOW INPUT' : ''}</text>
          <path d="M35 18V78M105 18V78" stroke="#aebdd0" strokeWidth="9" opacity={dusty ? 0.6 : 1} />
          <rect x="0" y="0" width="140" height="24" rx="5" fill="url(#panelVisual)" stroke={dusty ? '#a16207' : '#21d7ff'} strokeWidth="4" />
          {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${i * 20} 2V22`} stroke="#7ce9ff" opacity={dusty ? 0.15 : 0.45} />)}
          {!dusty && running ? (
            <motion.g animate={solarShimmer} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '70px 10px' }}>
              <path d="M0 -5H140V0H0Z" fill="#a9f5ff" opacity=".45" />
            </motion.g>
          ) : (
            <path d="M0 -5H140V0H0Z" fill="#5c6678" opacity=".6" />
          )}
        </g>

        {/* Habitat */}
        <g transform="translate(355 235)">
          <text x="80" y="-18" textAnchor="middle" fill="#e5efff" fontSize="14" fontWeight="700">HABITAT{heating ? ' · HEATED' : ''}</text>
          <path d="M0 85A80 80 0 0 1 160 85Z" fill="url(#domeVisual)" stroke={heating ? '#ffbd4a' : '#56d8ff'} strokeWidth="5" />
          <path d="M80 6V85M25 37Q80 18 135 37" fill="none" stroke={heating ? '#ffbd4a' : '#6ce5ff'} strokeWidth="2" opacity=".6" />
          <rect x="67" y="50" width="26" height="35" rx="4" fill="#102e4e" stroke={heating ? '#ffe9a1' : '#b3eaff'} strokeWidth="2" />
          <rect x="73" y="57" width="14" height="11" rx="2" fill={heating ? '#ffbd4a' : '#44d9ff'} opacity=".9" />
          <path d="M8 84H152" stroke="#d2e7fa" strokeWidth="5" />
          <circle cx="125" cy="54" r="5" fill={radiationCritical ? '#ff6b6b' : '#7df4bd'} filter="url(#glow)" />
          <circle cx="42" cy="72" r="2.2" fill="#ffe6a3"><animate attributeName="opacity" values=".35;1;.35" dur="2.2s" repeatCount="indefinite" /></circle>
          <circle cx="112" cy="72" r="2.2" fill="#8ef2ff"><animate attributeName="opacity" values="1;.35;1" dur="2.2s" repeatCount="indefinite" /></circle>
          {/* rotating radar dish */}
          <g transform="translate(132 16)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#9fb4cb" strokeWidth="3" />
            <g>
              <path d="M-8 0Q0 -10 8 0" fill="none" stroke="#bfe8ff" strokeWidth="2.5" strokeLinecap="round" />
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="12s" repeatCount="indefinite" />
            </g>
          </g>
        </g>

        {/* Science Lab - crew repair/operate */}
        <g transform="translate(620 250)">
          <text x="72" y="-20" textAnchor="middle" fill="#e5efff" fontSize="13" fontWeight="700">SCIENCE LAB{scene?.mode === 'repair' ? ' · MAINTENANCE' : ''}</text>
          <rect width="145" height="65" rx="10" fill={scene?.mode === 'repair' ? '#7ea7c1' : '#8bb8d7'} stroke={scene?.mode === 'repair' ? '#ffbd4a' : '#48d9ff'} strokeWidth="4" />
          <rect x="12" y="12" width="121" height="40" rx="5" fill="#102d4b" />
          <rect x="26" y="22" width="26" height="12" rx="2" fill={scene?.mode === 'repair' ? '#ffbd4a' : '#24c7ee'} />
          <circle cx="119" cy="32" r="5" fill={scene?.mode === 'repair' ? '#ffbd4a' : '#52e5ae'} />
        </g>

        {/* Storm Vault / shelter */}
        <g transform="translate(815 250)">
          <text x="65" y="-20" textAnchor="middle" fill="#e5efff" fontSize="13" fontWeight="700">STORM VAULT{sheltering ? ' · SEALED' : ' · STANDBY'}</text>
          <rect width="130" height="65" rx="10" fill={sheltering ? '#1c4966' : '#287eaa'} stroke={sheltering ? '#ffbd4a' : '#54d7ff'} strokeWidth="4" />
          <rect x="8" y="8" width="114" height="49" rx="7" fill={sheltering ? '#123147' : '#3db6e4'} opacity=".9" />
          {sheltering && <path d="M65 22v21M54 31h22" stroke="#ffbd4a" strokeWidth="4" />}
        </g>

        <path d="M205 310H950" stroke="#d0d9e3" strokeWidth="12" opacity=".45" />
        <path d="M205 310H950" stroke="#263a53" strokeWidth="3" strokeDasharray="14 12" opacity=".8" />

        {/* Crew - positions react to decisions/environment */}
        {CREW.map((member, idx) => {
          const task = crewWithReporter[member.id] || 'walk'
          const pos = TASK_POSITIONS[task]?.[member.id] || TASK_POSITIONS.walk[member.id]
          const insideHabitat = task === 'inside'
          const shelteringNow = task === 'shelter'
          const repairing = task === 'repair'
          return (
            <Astronaut
              key={member.id}
              id={member.id}
              x={pos.x}
              y={pos.y}
              color={member.color}
              name={member.name}
              task={task}
              delay={idx * 1.7}
              tagOffset={idx === 1 ? 15 : 0}
              sheltering={shelteringNow}
              repairing={repairing}
              insideHabitat={insideHabitat}
              alert={issue?.astronautId === member.id}
              alertColor={issueColor}
              mood={issue?.astronautId === member.id ? (issueDanger ? 'alarmed' : 'concerned') : (crewMoods[member.id] ?? 'calm')}
            />
          )
        })}

        {/* Clickable warning marker for an active crew report / emergency */}
        {issue && issuePin && (
          <g
            transform={`translate(${issuePin.x} ${issuePin.y})`}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`Open ${issue.title}`}
            onClick={onOpenIssue}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenIssue?.() } }}
          >
            <title>{`${issue.title} — click to review`}</title>
            <circle r="20" fill={issueColor} opacity=".2">
              <animate attributeName="r" values="15;30;15" dur="1.7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".45;.03;.45" dur="1.7s" repeatCount="indefinite" />
            </circle>
            <path d="M0 14V26" stroke={issueColor} strokeWidth="2" strokeDasharray="3 3" opacity=".8" />
            <circle r="13" fill="#0a1222" stroke={issueColor} strokeWidth="3" />
            <text y="5" textAnchor="middle" fill={issueColor} fontSize="16" fontWeight="900">!</text>
            <text y="39" textAnchor="middle" fill={issueColor} fontSize="7.4" fontWeight="800" letterSpacing=".8">CLICK</text>
          </g>
        )}

        {/* Rover */}
        <motion.g animate={{ x: roverTargets }} transition={{ duration: roverTask === 'clean' ? 8 : 14, repeat: Infinity, ease: 'easeInOut' }}>
          <g transform="translate(260 350)">
            <ellipse cx="25" cy="35" rx="48" ry="7" fill="#101c2d" opacity=".5" />
            <path d="M68 -18L118 -34L118 4Z" fill={dusty ? '#fde68a' : '#bff3ff'} opacity=".14" />
            <rect x="-7" y="4" width="64" height="25" rx="8" fill={dusty ? '#b8a88e' : '#dce7f2'} stroke="#8298b0" strokeWidth="2" opacity={dusty ? 0.8 : 1} />
            <rect x="4" y="-8" width="40" height="18" rx="5" fill={dusty ? '#6f6658' : '#9bc8e4'} stroke="#e7f5ff" strokeWidth="2" opacity={dusty ? 0.8 : 1} />
            <rect x="15" y="-4" width="17" height="10" rx="2" fill="#102f50" />
            {[4, 25, 47].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="30" r="10" fill="#17263a" stroke="#b8c8d8" strokeWidth="3" />
                <g>
                  <path d={`M${x - 7} 30H${x + 7}M${x} 23V37`} stroke="#6f879e" strokeWidth="2" />
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${x} 30`} to={`360 ${x} 30`} dur="2.4s" repeatCount="indefinite" />
                </g>
              </g>
            ))}
            <path d="M48 -5L65 -18" stroke="#a8bed2" strokeWidth="3" /><circle cx="66" cy="-19" r="4" fill={dusty ? '#fbbf24' : '#ffe17a'} filter="url(#glow)" />
          </g>
        </motion.g>

        {/* Dust storm particles */}
        {dusty && (
          <g>
            {dustParticles.map((p) => (
              <motion.circle key={p.key} cx={p.x} cy={p.y0} r={p.r} fill={mars ? '#e0a080' : '#d6b47d'} opacity=".7" initial={p.initial} animate={p.animate} transition={p.transition} />
            ))}
          </g>
        )}

        {/* Radiation warning particles */}
        {visualMode === 'radiation_storm' && (
          <g>
            {Array.from({ length: 22 }, (_, i) => (
              <motion.circle key={`r-${i}`} cx={90 + (i * 67) % 800} cy={140 + (i * 34) % 150} r="1.8" fill="#ffb4b4" initial={{ opacity: 0.1 }} animate={{ opacity: [0.1, 0.9, 0.1], y: [0, 50, 0] }} transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i % 6) * 0.3 }} />
            ))}
          </g>
        )}

        {/* Environment readouts */}
        <text x="980" y="410" textAnchor="end" fill="#b8cce0" fontSize="10">RAD {Math.round(radiationLevel)} · SOL {day} · {dusty ? 'DUST' : 'NOMINAL'}{radiationHigh ? ' · RAD WARNING' : ''}</text>
      </svg>

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_35px_rgba(2,6,23,0.72)]" />

      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {dusty && (
          <motion.div key="dust" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="px-4 py-2 rounded-lg bg-amber-500/90 text-slate-950 text-xs font-bold tracking-wide shadow-lg">
            ⚠ {mars ? 'DUST STORM' : 'DUST STORM WARNING'} · SOLAR OUTPUT REDUCED
          </motion.div>
        )}
        {visualMode === 'radiation_storm' && !sheltering && (
          <motion.div key="radiation" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="px-4 py-2 rounded-lg bg-red-500/90 text-white text-xs font-bold tracking-wide shadow-lg">
            ⚠ RADIATION STORM · CREW OUTSIDE · RISK ELEVATED
          </motion.div>
        )}
        {sheltering && (
          <motion.div key="shelter" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="px-4 py-2 rounded-lg bg-emerald-500/90 text-slate-950 text-xs font-bold tracking-wide shadow-lg">
            ✓ CREW IN STORM VAULT / HABITAT · SHIELDED
          </motion.div>
        )}
        {roverMission && (
          <motion.div key="rover" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="px-4 py-2 rounded-lg bg-sky-500/90 text-slate-950 text-xs font-bold tracking-wide shadow-lg">
            ↦ ROVER EN ROUTE · returns in {Math.max(0.1, roverMission.daysRemaining).toFixed(1)} Sols{roverMission.aborted ? ' (recalled)' : ''}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 border-t border-sky-500/15 bg-slate-950/70 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-sky-400" /> Crew positions respond to mission decisions</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" /> Dust / radiation visual feedback</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Habitat & equipment status</span>
      </div>
    </div>
  )
}

const TASK_LABELS = {
  walk: 'PATROL',
  inside: 'HABITAT',
  shelter: 'VAULT',
  repair: 'REPAIR',
  solar: 'SOLAR',
  lab: 'LAB',
  rover: 'ROVER',
  idle: 'READY',
}

function Astronaut({ x, y, color, name, delay = 0, tagOffset = 0, task = 'walk', sheltering = false, repairing = false, insideHabitat = false, alert = false, alertColor = '#fbbf24', mood = 'calm' }) {
  const walking = task === 'walk' && !sheltering
  // Memoised so the 2 Hz simulation re-render does not restart Framer animations.
  const motionX = useMemo(() => (
    sheltering
      ? [x, x + 1, x]
      : repairing
        ? [x, x + 18, x + 35, x + 18, x]
        : walking
          ? [x, x + 24, x + 48, x + 24, x]
          : insideHabitat
            ? [x, x, x]
            : [x, x + 2, x]
  ), [x, sheltering, repairing, walking, insideHabitat])
  const motionY = useMemo(() => [y, y - 1.5, y], [y])
  const duration = sheltering ? 2.5 : repairing ? 6 : walking ? 12 : 3.8
  const suit = insideHabitat ? '#b3c6da' : '#eef5ff'
  const suitShade = insideHabitat ? '#8fa6bd' : '#c9d9ea'
  const label = TASK_LABELS[task] ?? 'PATROL'
  return (
    <motion.g
      initial={{ x, y }}
      animate={{ x: motionX, y: motionY }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <g className="astronaut" opacity={insideHabitat ? 0.45 : 1}>
        {/* ground shadow + soft crew-colour aura */}
        <ellipse cx="0" cy="37" rx="16" ry="4.5" fill="#020713" opacity=".5" />
        <circle cx="0" cy="6" r="24" fill={color} opacity=".05" />

        {/* legs — swing while patrolling */}
        <g>
          <path d="M-7 19L-10 33L-4 35L0 21Z" fill={suitShade} stroke="#829bb7" strokeWidth="1.3" />
          {walking && <animateTransform attributeName="transform" type="rotate" values="-16 0 20;16 0 20;-16 0 20" dur="1.9s" repeatCount="indefinite" begin={`${delay}s`} />}
        </g>
        <g>
          <path d="M7 19L10 33L4 35L0 21Z" fill={suitShade} stroke="#829bb7" strokeWidth="1.3" />
          {walking && <animateTransform attributeName="transform" type="rotate" values="16 0 20;-16 0 20;16 0 20" dur="1.9s" repeatCount="indefinite" begin={`${delay}s`} />}
        </g>
        {/* boots */}
        <rect x="-11" y="32" width="8" height="4" rx="2" fill="#8ba2ba" stroke="#6d8099" strokeWidth="1" />
        <rect x="3" y="32" width="8" height="4" rx="2" fill="#8ba2ba" stroke="#6d8099" strokeWidth="1" />

        {/* life-support canisters */}
        <rect x="-15" y="7" width="6" height="13" rx="3" fill="#93a9c1" stroke="#70859e" strokeWidth="1" />
        <rect x="9" y="7" width="6" height="13" rx="3" fill="#93a9c1" stroke="#70859e" strokeWidth="1" />
        <circle cx="-12" cy="11" r="1.1" fill={color} />
        <circle cx="12" cy="11" r="1.1" fill={color} />

        {/* arms — gentle counter-swing */}
        <g>
          <path d="M-10 9Q-16 12-15 21L-9 22" fill="none" stroke={suit} strokeWidth="5" strokeLinecap="round" />
          {walking && <animateTransform attributeName="transform" type="rotate" values="10 -9 10;-8 -9 10;10 -9 10" dur="1.9s" repeatCount="indefinite" begin={`${delay}s`} />}
        </g>
        <g>
          <path d="M10 9Q16 12 15 21L9 22" fill="none" stroke={suit} strokeWidth="5" strokeLinecap="round" />
          {walking && <animateTransform attributeName="transform" type="rotate" values="-10 9 10;8 9 10;-10 9 10" dur="1.9s" repeatCount="indefinite" begin={`${delay}s`} />}
        </g>

        {/* torso + chest control panel */}
        <rect x="-9" y="4" width="18" height="19" rx="7" fill={suit} stroke="#819bb8" strokeWidth="1.5" />
        <rect x="-6" y="9" width="12" height="7" rx="2" fill="#0a1d33" stroke={color} strokeOpacity=".7" strokeWidth=".8" />
        <circle cx="-3" cy="12.5" r="1.2" fill={color}><animate attributeName="opacity" values="1;.35;1" dur="1.6s" repeatCount="indefinite" /></circle>
        <rect x="0.5" y="11.5" width="3.5" height="1" rx=".5" fill="#7ee7ff" />
        <rect x="0.5" y="13.8" width="2.5" height="1" rx=".5" fill="#7ee7ff" opacity=".7" />
        <rect x="-9" y="19" width="18" height="2.6" rx="1.2" fill="#8ba2ba" />

        {/* helmet */}
        <line x1="7" y1="-13" x2="11" y2="-19" stroke="#a9bed3" strokeWidth="1.4" />
        <circle cx="11.5" cy="-19.5" r="1.6" fill={color}><animate attributeName="opacity" values="1;.2;1" dur="2.4s" repeatCount="indefinite" /></circle>
        <circle cx="0" cy="-3" r="12.2" fill={suit} stroke="#9db4ce" strokeWidth="2" />
        <ellipse cx="0" cy="-3" rx="8.8" ry="7.4" fill="#06172c" stroke={color} strokeWidth="2" />
        {mood === 'alarmed' ? (
          <>
            <ellipse cx="-3.1" cy="-2.2" rx="2.3" ry="2.9" fill="#eaffff" stroke="#7ee7ff" strokeWidth=".6" />
            <ellipse cx="3.1" cy="-2.2" rx="2.3" ry="2.9" fill="#eaffff" stroke="#7ee7ff" strokeWidth=".6" />
            <circle cx="-3.1" cy="-1.9" r="1" fill="#06172c" />
            <circle cx="3.1" cy="-1.9" r="1" fill="#06172c" />
            <path d="M-6.5 -6.2Q-3 -8 -1 -6.2" fill="none" stroke="#7ee7ff" strokeWidth="1" strokeLinecap="round" />
            <path d="M6.5 -6.2Q3 -8 1 -6.2" fill="none" stroke="#7ee7ff" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="0" cy="3.4" rx="1.8" ry="2.3" fill="#ffb4b4" stroke="#ff8a8a" strokeWidth=".5" />
            <path d="M6.5 -7Q8.2 -4.8 6.5 -3.6Q4.8 -4.8 6.5 -7Z" fill="#8ee7ff" opacity=".9" />
          </>
        ) : mood === 'concerned' ? (
          <>
            <path d="M-6.4 -4.4L-1.6 -6" stroke="#7ee7ff" strokeWidth="1" strokeLinecap="round" />
            <path d="M6.4 -4.4L1.6 -6" stroke="#7ee7ff" strokeWidth="1" strokeLinecap="round" />
            <circle cx="-3" cy="-1.8" r="1.15" fill="#aef6ff" />
            <circle cx="3" cy="-1.8" r="1.15" fill="#aef6ff" />
            <path d="M-2.8 4Q0 2.8 2.8 4" fill="none" stroke="#aef6ff" strokeWidth="1" strokeLinecap="round" opacity=".9" />
          </>
        ) : (
          <>
            <circle cx="-3" cy="-1.9" r="1.1" fill="#aef6ff"><animate attributeName="opacity" values=".5;1;.5" dur="3s" repeatCount="indefinite" /></circle>
            <circle cx="3" cy="-1.9" r="1.1" fill="#aef6ff"><animate attributeName="opacity" values="1;.5;1" dur="3s" repeatCount="indefinite" /></circle>
            <path d="M-3.2 2.4Q0 4.8 3.2 2.4" fill="none" stroke="#7ee7ff" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />
          </>
        )}
        {/* helmet glare */}
        <path d="M-7.5 -7.5Q-4 -10.5 0 -10.8" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />

        {/* repair sparks */}
        {repairing && [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={9}
            cy={13}
            r="1.7"
            fill="#ffd68a"
            initial={{ opacity: 0 }}
            animate={{ x: [0, 7, 13], y: [0, -7, -14], opacity: [1, 1, 0] }}
            transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.28 }}
          />
        ))}
      </g>

      {/* crew nameplate */}
      <g transform={`translate(0 ${43 + tagOffset})`}>
        <rect x="-34" y="0" width="68" height="14" rx="7" fill="#04101f" opacity=".9" stroke={color} strokeOpacity=".55" strokeWidth="1" />
        <circle cx="-26" cy="7" r="2" fill={color} />
        <text x="4" y="10" textAnchor="middle" fill="#eaf6ff" fontSize="6.9" fontWeight="700" letterSpacing=".4">{name} · {label}</text>
      </g>

      {/* alert bubble above the reporting astronaut */}
      {alert && (
        <g transform="translate(0 -26)">
          <circle r="9" fill="#0b1220" stroke={alertColor} strokeWidth="2">
            <animate attributeName="r" values="8;10;8" dur="1.3s" repeatCount="indefinite" />
          </circle>
          <text y="4" textAnchor="middle" fill={alertColor} fontSize="12" fontWeight="900">!</text>
        </g>
      )}
    </motion.g>
  )
}
