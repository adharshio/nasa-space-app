import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Droplets,
  Wind,
  Apple,
  Zap,
  Battery,
  Radiation,
  Users,
  Activity,
  Play,
  Pause,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  RotateCcw,
  Pickaxe,
  FlaskConical,
  Hammer,
  Radio,
  Satellite,
  Volume2,
  VolumeX,
  ChevronRight,
  Info,
  CheckCircle,
} from 'lucide-react'
import { useMission } from '../hooks/useMission'
import ResourceCard from '../components/ResourceCard'
import MissionChart from '../components/MissionChart'
import EmergencyModal from '../components/EmergencyModal'
import LunarScene from '../components/LunarScene'
import { getDailyRates } from '../simulation/resourceManager'
import { CREW_MEMBERS, AstronautAvatar, getAstronautMood } from '../components/Crew'
import { INITIAL_MODULES, ASTRONAUT_REQUEST_DECK } from '../data/strategy'
import { fetchSpaceWeather, SAMPLE_WEATHER } from '../utils/donki'
import {
  playClick,
  playRadioChirp,
  playGoodChoice,
  playWarning,
  playUpgrade,
  toggleMute,
  getMuted,
} from '../utils/sound'

function statusFor(pct) {
  if (pct > 60) return 'Stable'
  if (pct > 30) return 'Warning'
  return 'Critical'
}

export default function Dashboard() {
  const { state, hasMission, nextDay, chooseEmergency } = useMission()
  const navigate = useNavigate()
  const [simSpeed, setSimSpeed] = useState(1) // 0 = Pause, 1 = Normal (24s/sol), 2 = Fast (12s/sol), 4 = Warp (6s/sol)
  const [solHour, setSolHour] = useState(6.0) // Continuous Sol Time (06:00 Dawn)
  const [roverTask, setRoverTask] = useState('patrol')
  const [muted, setMuted] = useState(getMuted())

  // Strategic Building & Request state
  const [modules, setModules] = useState(INITIAL_MODULES)
  const [selectedModule, setSelectedModule] = useState('power')
  const [regolith, setRegolith] = useState(45) // Starting construction material
  const [sciencePoints, setSciencePoints] = useState(14)
  const [activeRequest, setActiveRequest] = useState(null)
  const [requestQueue, setRequestQueue] = useState(ASTRONAUT_REQUEST_DECK)
  const [requestResponse, setRequestResponse] = useState(null)
  const [weather, setWeather] = useState(SAMPLE_WEATHER)
  const [showNasaInfo, setShowNasaInfo] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (!hasMission) navigate('/missions')
  }, [hasMission, navigate])

  useEffect(() => {
    if (state?.phase === 'completed') navigate('/results')
  }, [state?.phase, navigate])

  useEffect(() => {
    fetchSpaceWeather().then((w) => setWeather(w))
  }, [])

  // Trigger initial astronaut radio check-in after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeRequest && requestQueue.length > 0) {
        const nextReq = requestQueue[0]
        setRequestQueue((prev) => prev.slice(1))
        setActiveRequest(nextReq)
        playRadioChirp()
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleAdvanceSol = () => {
    nextDay()
    setRoverTask('clean')
    setRegolith((r) => r + (modules.drill.level >= 2 ? 15 : 8))
    setSciencePoints((s) => s + (modules.lab.level >= 2 ? 4 : 2))
    setTimeout(() => setRoverTask('patrol'), 8000)

    // Trigger next astronaut radio report occasionally
    if (!activeRequest && !requestResponse && requestQueue.length > 0 && Math.random() < 0.75) {
      setTimeout(() => {
        const nextReq = requestQueue[0]
        setRequestQueue((prev) => prev.slice(1))
        setActiveRequest(nextReq)
        playRadioChirp()
      }, 1500)
    }
  }

  // Continuous Sol Timeline Clock Loop (Scaled real-time simulation)
  useEffect(() => {
    if (simSpeed === 0 || state?.phase !== 'active') return

    // 125ms ticks (8 ticks per sec). At 1x speed, 1 real sec = 1 Sol hour (24s / Sol)
    const intervalMs = 125
    const dt = (intervalMs / 1000) * simSpeed

    const timer = setInterval(() => {
      setSolHour((prev) => {
        const next = prev + dt
        if (next >= 24) {
          handleAdvanceSol()
          return next - 24
        }
        return next
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [simSpeed, state?.phase, modules, activeRequest, requestResponse, requestQueue])

  if (!state) return null
  const { resources, environment, mission, day, history, equipment, pendingEmergency, astronautName } = state
  const rates = getDailyRates(state)
  const pct = (c, m) => (m ? (c / m) * 100 : 0)
  const storm = environment.solarEfficiency < 60 || pendingEmergency?.type === 'dust_storm' || environment.sunlight < 0.55
  const mars = mission.id === 'mars'

  // Time & Period Calculations
  const normalizedHour = ((solHour % 24) + 24) % 24
  const hourInt = Math.floor(normalizedHour)
  const minuteInt = Math.floor((normalizedHour - hourInt) * 60)
  const timeString = `${String(hourInt).padStart(2, '0')}:${String(minuteInt).padStart(2, '0')}`
  const solProgress = (normalizedHour / 24) * 100
  const isNight = normalizedHour < 5.0 || normalizedHour > 19.5
  const isDawn = normalizedHour >= 5.0 && normalizedHour < 8.5
  const isSunset = normalizedHour >= 16.5 && normalizedHour <= 19.5

  const solarPeriod = isNight
    ? { name: 'Deep Space Night', icon: Moon, color: 'text-indigo-300', bg: 'bg-indigo-950/70 border-indigo-700/50' }
    : isSunset
      ? { name: 'Sunset Dusk', icon: Sunset, color: 'text-orange-400', bg: 'bg-orange-950/70 border-orange-700/50' }
      : isDawn
        ? { name: 'Solar Dawn', icon: Sunrise, color: 'text-amber-400', bg: 'bg-amber-950/70 border-amber-700/50' }
        : { name: 'High Solar Noon', icon: Sun, color: 'text-yellow-300', bg: 'bg-yellow-950/70 border-yellow-700/50' }

  const handleToggleMute = () => {
    const next = toggleMute()
    setMuted(next)
  }

  // Handle Acting on Astronaut Radio Request
  const handleSelectChoice = (choice) => {
    const cost = choice.cost
    if (cost.regolith && regolith < cost.regolith) {
      alert(`Need ${cost.regolith} Regolith to execute this!`)
      return
    }
    if (cost.regolith) setRegolith((r) => r - cost.regolith)

    if (choice.reward.science) setSciencePoints((s) => s + choice.reward.science)
    if (choice.reward.regolith) setRegolith((r) => r + choice.reward.regolith)

    if (choice.reward.health && choice.reward.health < 0) {
      playWarning()
    } else {
      playGoodChoice()
    }

    const astro = CREW_MEMBERS.find((c) => c.id === activeRequest.astronautId) ?? CREW_MEMBERS[0]
    setRequestResponse({ choice, astronaut: astro })
    setActiveRequest(null)
  }

  // Handle Module Upgrades (Clash of Clans style)
  const handleUpgradeModule = (modId) => {
    const mod = modules[modId]
    if (mod.level >= mod.maxLevel) return

    const nextCost = mod.upgradeCosts[mod.level]
    if (regolith < nextCost.regolith) {
      alert(`Need ${nextCost.regolith} Regolith to upgrade! Currently have ${regolith}.`)
      return
    }
    if (sciencePoints < nextCost.science) {
      alert(`Need ${nextCost.science} Science Points to unlock this blueprint! Currently have ${sciencePoints}.`)
      return
    }

    setRegolith((r) => r - nextCost.regolith)
    setSciencePoints((s) => s - nextCost.science)

    setModules((prev) => ({
      ...prev,
      [modId]: {
        ...prev[modId],
        level: prev[modId].level + 1,
      },
    }))

    playUpgrade()
    setNotification(`Upgraded ${mod.name} to Level ${mod.level + 1}!`)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAssignWorker = (modId, astroId) => {
    playClick()
    setModules((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((k) => {
        if (updated[k].assignedAstronaut === astroId) {
          updated[k] = { ...updated[k], assignedAstronaut: null }
        }
      })
      updated[modId] = { ...updated[modId], assignedAstronaut: astroId }
      return updated
    })
  }

  const selectedModObj = selectedModule ? modules[selectedModule] : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 select-none">
      {/* 1. TOP STRATEGIC HEADER & RESOURCE BAR */}
      <div className="glass rounded-2xl p-4 border-sky-500/25 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sky-300 uppercase tracking-wider text-xs font-bold">
                Live Mission Control · Strategic Simulation Active
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>{mission.destination} Outpost</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-950 border border-sky-500 text-sky-200">
                Sol {Math.min(day, mission.durationDays)} of {mission.durationDays}
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
              Commander <span className="text-sky-300 font-bold">{astronautName || 'Cadet'}</span> · Directing Outpost Construction &amp; Crew Operations
            </p>
          </div>

          {/* Quick Strategic Resources */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-950/80 p-2.5 rounded-xl border border-slate-700 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-amber-300" title="Battery / Power reserve">
              <Zap size={15} />
              <span>{Math.round(pct(resources.battery.current, resources.battery.max))}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-300" title="Oxygen concentration">
              <Wind size={15} />
              <span>{Math.round(pct(resources.oxygen.current, resources.oxygen.max))}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400" title="Water reserve">
              <Droplets size={15} />
              <span>{Math.round(resources.water.current)}L</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200" title="Mined Regolith Building Material">
              <Pickaxe size={15} className="text-amber-500" />
              <span>{regolith}T</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-300" title="Science Discovery Points">
              <FlaskConical size={15} />
              <span>{sciencePoints} pts</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-1 rounded text-slate-400 hover:text-white"
              title={muted ? "Unmute Sound" : "Mute Sound"}
            >
              {muted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} className="text-emerald-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Clock & Period Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${solarPeriod.bg} backdrop-blur-md`}>
              <solarPeriod.icon size={16} className={solarPeriod.color} />
              <div className="flex flex-col text-left">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>SOL {day}</span>
                  <span>·</span>
                  <span className={solarPeriod.color}>{solarPeriod.name}</span>
                </div>
                <div className="text-sm font-mono font-bold text-white tracking-wider">
                  {timeString} <span className="text-[10px] text-sky-400 font-sans">UTC</span>
                </div>
              </div>
            </div>

            {/* Continuous Timeline Speed Controls */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 gap-1">
              <button
                onClick={() => setSimSpeed(simSpeed === 0 ? 1 : 0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  simSpeed === 0 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={simSpeed === 0 ? 'Resume Time' : 'Pause Time'}
              >
                {simSpeed === 0 ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                <span>{simSpeed === 0 ? 'PAUSED' : 'PAUSE'}</span>
              </button>

              <button
                onClick={() => setSimSpeed(1)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  simSpeed === 1 ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="1x Real-Time Speed (24s / Sol)"
              >
                1x
              </button>

              <button
                onClick={() => setSimSpeed(2)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  simSpeed === 2 ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="2x Fast Speed (12s / Sol)"
              >
                2x
              </button>

              <button
                onClick={() => setSimSpeed(4)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  simSpeed === 4 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="4x Warp Speed (6s / Sol)"
              >
                4x
              </button>
            </div>

            <Link
              to="/manage"
              className="px-3.5 py-2 rounded-xl border border-sky-400/30 text-sky-100 hover:bg-sky-500/10 transition font-semibold text-xs"
            >
              Systems
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NASA DONKI SPACE WEATHER BANNER */}
      <div className="rounded-xl bg-gradient-to-r from-sky-950/90 via-indigo-950/80 to-slate-900 border border-sky-500/40 p-3 text-xs text-sky-100 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <Satellite size={18} className="text-sky-400 shrink-0" />
          <span>
            <b className="text-sky-300 font-bold">NASA DONKI Space Weather Feed:</b> Radiation risk is{' '}
            <b className={weather.risk === 'Elevated' ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
              {weather.risk}
            </b>{' '}
            (Logged {weather.sepCount} solar events &amp; {weather.cmeCount} CMEs this month).
          </span>
        </div>
        <button
          onClick={() => setShowNasaInfo(!showNasaInfo)}
          className="text-[11px] underline text-sky-300 hover:text-sky-100 shrink-0 ml-2"
        >
          Why this matters ↗
        </button>
      </div>

      {showNasaInfo && (
        <div className="rounded-xl bg-slate-900 border border-sky-400/60 p-4 text-xs text-slate-300 space-y-2 animate-fadeIn">
          <div className="flex justify-between items-center text-sky-300 font-bold text-sm">
            <span>NASA Space Weather Database (DONKI) Integration</span>
            <button onClick={() => setShowNasaInfo(false)} className="text-slate-400 hover:text-white font-mono">
              ✕
            </button>
          </div>
          <p>
            Unlike Earth, the Moon and Mars have <b>minimal or zero global magnetic shielding</b>. When coronal mass
            ejections (CMEs) erupt from the Sun, high-energy protons travel across space at millions of km/h.
          </p>
          <p>
            NASA Goddard’s <b>DONKI</b> monitors real-time solar flares. In this simulator, solar storm radiation hazards
            directly scale according to real NASA satellite telemetry!
          </p>
        </div>
      )}

      {notification && (
        <div className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-lg text-center animate-bounce">
          {notification}
        </div>
      )}

      {/* 3. ASTRONAUT RADIO POP-UP REQUEST MODAL (Clash of Clans / SimCity style!) */}
      {activeRequest && (
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500 p-4 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <Radio size={18} className="text-amber-400" />
              <span className="font-extrabold text-amber-300 text-sm uppercase tracking-wider">
                INCOMING RADIO TRANSMISSION · {activeRequest.title}
              </span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600">
              {activeRequest.priority.toUpperCase()}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <AstronautAvatar
              astronaut={CREW_MEMBERS.find((c) => c.id === activeRequest.astronautId) ?? CREW_MEMBERS[0]}
              size={54}
            />
            <div className="flex-1">
              <div className="font-bold text-white text-sm">
                {CREW_MEMBERS.find((c) => c.id === activeRequest.astronautId)?.name} (
                {CREW_MEMBERS.find((c) => c.id === activeRequest.astronautId)?.role})
              </div>
              <p className="text-slate-200 text-xs sm:text-sm mt-1 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                "{activeRequest.situation}"
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 pt-1">
            {activeRequest.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleSelectChoice(choice)}
                className="text-left rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 p-3 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm group-hover:text-sky-300 flex items-center justify-between">
                    <span>{choice.label}</span>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-sky-400" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{choice.hint}</div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-800/80 text-[10px]">
                  {choice.cost.regolith && (
                    <span className="text-amber-400 font-semibold">Cost: {choice.cost.regolith} 🪨</span>
                  )}
                  {choice.cost.power && (
                    <span className="text-amber-400 font-semibold">Cost: {choice.cost.power} ⚡</span>
                  )}
                  {choice.cost.water && (
                    <span className="text-amber-400 font-semibold">Cost: {choice.cost.water} 💧</span>
                  )}
                  {Object.keys(choice.cost).length === 0 && (
                    <span className="text-emerald-400 font-semibold">Zero Cost</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* POST-DECISION RESOLUTION POPUP */}
      {requestResponse && (
        <div className="rounded-2xl bg-slate-900 border-2 border-emerald-500/80 p-4 space-y-2.5 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle size={16} /> Decision Executed: {requestResponse.choice.label}
            </span>
            <button
              onClick={() => {
                playClick()
                setRequestResponse(null)
              }}
              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-lg"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            "{requestResponse.choice.astronautReaction}"
          </p>
          <div className="bg-sky-950/80 border border-sky-800 p-2 rounded-xl text-sky-200 text-xs flex gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>
              <b>NASA Science Takeaway:</b> {requestResponse.choice.nasaLesson}
            </span>
          </div>
        </div>
      )}

      {/* 4. BASE SURFACE SIMULATION */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-sky-300" /> Surface Operations &amp; Outpost Layout
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">Tap any module to inspect and upgrade</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-3">
            {/* CONTINUOUS 24-HOUR SOL TIMELINE ORBIT BAR */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 space-y-2 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-sky-400" />
                  <span className="font-bold text-white">Continuous Sol Cycle:</span>
                  <span className="text-sky-300 font-mono font-bold">SOL {day} of {mission.durationDays}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-mono">{timeString} UTC</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Night
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Day
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Sunset
                  </span>
                </div>
              </div>

              {/* Visual Sol Day/Night Track with Moving Celestial Indicator */}
              <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
                {/* Night zone 1: 00:00 to 05:00 (0% to 20.8%) */}
                <div className="absolute left-0 top-0 bottom-0 w-[20.8%] bg-indigo-950/90 border-r border-indigo-700/40" />
                {/* Daylight zone: 05:00 to 19:30 (20.8% to 81.25%) */}
                <div className="absolute left-[20.8%] top-0 bottom-0 w-[60.45%] bg-gradient-to-r from-amber-600/30 via-yellow-500/40 to-orange-600/30 border-r border-orange-700/40" />
                {/* Night zone 2: 19:30 to 24:00 (81.25% to 100%) */}
                <div className="absolute left-[81.25%] top-0 bottom-0 w-[18.75%] bg-indigo-950/90" />

                {/* Moving Celestial Sun/Time Marker */}
                <div
                  style={{ left: `${solProgress}%` }}
                  className="absolute top-0 bottom-0 -translate-x-1/2 flex items-center transition-all duration-150 z-10"
                >
                  <div className="h-full w-2 bg-white rounded-full shadow-[0_0_12px_#38bdf8] flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-300 border-2 border-white shadow-[0_0_8px_#fde047]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>00:00 Midnight</span>
                <span>06:00 Dawn</span>
                <span>12:00 Solar Noon</span>
                <span>18:00 Sunset</span>
                <span>24:00 Sol End</span>
              </div>
            </div>

            <LunarScene
              running={simSpeed > 0}
              storm={storm}
              roverTask={roverTask}
              day={Math.min(day, mission.durationDays)}
              solHour={solHour}
              simSpeed={simSpeed}
              mars={mars}
              environment={environment}
              scene={state.scene}
              pendingEmergency={pendingEmergency}
              equipment={equipment}
              phase={state.phase}
              modules={modules}
              selectedModule={selectedModule}
              onSelectModule={(m) => setSelectedModule(m)}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 p-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSimSpeed(simSpeed === 0 ? 1 : 0)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                    simSpeed === 0
                      ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {simSpeed === 0 ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                  {simSpeed === 0 ? 'Resume Time' : 'Pause'}
                </button>

                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 gap-1">
                  {[
                    { s: 1, label: '1x Normal' },
                    { s: 2, label: '2x Fast' },
                    { s: 4, label: '4x Warp' },
                  ].map(({ s, label }) => (
                    <button
                      key={s}
                      onClick={() => setSimSpeed(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        simSpeed === s ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setRoverTask(roverTask === 'return' ? 'patrol' : 'return')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-400/30 text-amber-200 hover:bg-amber-500/10 transition text-xs font-semibold"
              >
                <RotateCcw size={14} />
                {roverTask === 'return' ? 'Send rover out' : 'Recall rover'}
              </button>
            </div>
          </div>

          <aside className="lg:col-span-2 space-y-4">
            {/* CREW STATUS ROSTER WITH AVATARS & MOODS */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Users size={16} className="text-sky-300" /> Artemis Crew Roster (3)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-bold">
                  All Systems Green
                </span>
              </div>
              <div className="space-y-2">
                {CREW_MEMBERS.map((a) => {
                  const mood = getAstronautMood(a.id, state)
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-400/30 transition"
                    >
                      <AstronautAvatar astronaut={a} size={42} mood={mood} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate">{a.name}</span>
                          <span className="text-[10px] text-slate-400">{a.role.split('&')[0]}</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-300 truncate">{mood.moodText}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CLASH OF CLANS / SIMCITY BUILDING INSPECTOR & UPGRADE DOCK */}
            {selectedModObj && (
              <div className="glass rounded-2xl p-4 space-y-3 border-2 border-sky-500/30">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">{selectedModObj.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500 text-sky-300 text-[10px] font-bold">
                        Lv {selectedModObj.level}/{selectedModObj.maxLevel}
                      </span>
                    </div>
                    <div className="text-xs text-sky-300 font-semibold mt-0.5">
                      {selectedModObj.levelNames[selectedModObj.level - 1]}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{selectedModObj.levelDescriptions[selectedModObj.level - 1]}</p>

                {selectedModObj.level < selectedModObj.maxLevel ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-white">
                      Upgrade: {selectedModObj.levelNames[selectedModObj.level]}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Cost: {selectedModObj.upgradeCosts[selectedModObj.level].regolith} 🪨 Regolith •{' '}
                      {selectedModObj.upgradeCosts[selectedModObj.level].science} 🔬 Science
                    </div>
                    <button
                      onClick={() => handleUpgradeModule(selectedModObj.id)}
                      className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 transition shadow flex items-center justify-center gap-1.5"
                    >
                      <Hammer size={14} /> Upgrade Building
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-2.5 text-xs font-bold text-emerald-300 text-center">
                    ✓ Maximum Tech Level
                  </div>
                )}

                {/* Worker assignment */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-medium">Stationed Astronaut:</span>
                  <div className="flex gap-1">
                    {CREW_MEMBERS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleAssignWorker(selectedModObj.id, c.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                          selectedModObj.assignedAstronaut === c.id
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {c.callsign}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* 5. RESOURCE OVERVIEW CARDS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <Activity size={18} className="text-sky-300" /> Life Support &amp; Telemetry Gauges
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResourceCard
            icon={Wind}
            title="Oxygen Supply"
            current={resources.oxygen.current}
            max={resources.oxygen.max}
            unit="units"
            rate={`${rates?.oxygenDelta != null ? rates.oxygenDelta.toFixed(1) : '0.0'} / day`}
            status={statusFor(pct(resources.oxygen.current, resources.oxygen.max))}
          />
          <ResourceCard
            icon={Droplets}
            title="Water Reserves"
            current={resources.water.current}
            max={resources.water.max}
            unit="L"
            rate={`${rates?.waterDelta != null ? rates.waterDelta.toFixed(1) : '0.0'} / day`}
            status={statusFor(pct(resources.water.current, resources.water.max))}
          />
          <ResourceCard
            icon={Apple}
            title="Food Production"
            current={resources.food.current}
            max={resources.food.max}
            unit="meals"
            rate={`${rates?.foodDelta != null ? rates.foodDelta.toFixed(1) : '0.0'} / day`}
            status={statusFor(pct(resources.food.current, resources.food.max))}
          />
          <ResourceCard
            icon={Zap}
            title="Power Generation"
            current={resources.electricity.current}
            max={resources.electricity.max}
            unit="kW"
            rate={`${rates?.solarGeneration != null ? rates.solarGeneration.toFixed(1) : '0.0'} kW`}
            status={statusFor(pct(resources.electricity.current, resources.electricity.max))}
          />
          <ResourceCard
            icon={Battery}
            title="Battery Storage"
            current={resources.battery.current}
            max={resources.battery.max}
            unit="kWh"
            rate={`${rates?.electricityNet != null ? (rates.electricityNet >= 0 ? '+' : '') + rates.electricityNet.toFixed(1) : '0.0'} net`}
            status={statusFor(pct(resources.battery.current, resources.battery.max))}
          />
          <div className="glass rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-slate-400">Surface Radiation</span>
                <Radiation size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">{Math.round(environment.radiation)} mSv</div>
              <div className="text-xs text-slate-400 mt-1">DONKI Risk: {weather.risk}</div>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full ${environment.radiation > 35 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (environment.radiation / 50) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. MISSION CHART */}
      <section className="glass rounded-2xl p-5 border-sky-500/20">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Activity size={18} className="text-sky-300" /> Outpost Survival Trends
        </h2>
        <MissionChart history={history} />
      </section>

      <EmergencyModal emergency={pendingEmergency} onChoice={chooseEmergency} />
    </div>
  )
}
