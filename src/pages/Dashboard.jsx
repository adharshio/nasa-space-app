import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Droplets, Wind, Apple, Zap, Battery, Thermometer, Radiation, Sun, Users, Activity, RotateCcw, Wrench, FlaskConical, Rocket, Gauge, Trash2, Radio, AlertTriangle, ChevronRight } from 'lucide-react'
import { useMission } from '../hooks/useMission'
import ResourceCard from '../components/ResourceCard'
import MissionChart from '../components/MissionChart'
import LunarScene from '../components/LunarScene'
import MissionClock from '../components/MissionClock'
import CrewAvatar from '../components/CrewAvatar'
import CrewReportModal from '../components/CrewReportModal'
import { getDailyRates } from '../simulation/resourceManager'
import { equipmentDefs } from '../data/equipment'
import KidMissionControl from './KidMissionControl'
import { getPhaseForDay, DIFFICULTIES, CREW, EXPLORATION } from '../simulation/config'
import { CREW_TASKS } from '../simulation/missionEngine'

function statusFor(pct) {
  if (pct > 60) return 'Stable'
  if (pct > 30) return 'Warning'
  return 'Critical'
}

export default function Dashboard() {
  const { state, hasMission, chooseEmergency, resolveCrewReport, toggleEquipment, toggleOptionalLoads, repairEquipment, sendRoverSurvey, sendOnEva, setCrewTask, abortRoverMission, askEarth, speed, setSpeed, solProgress } = useMission()
  const navigate = useNavigate()
  const [evaAstronaut, setEvaAstronaut] = useState('maya')
  const [hiddenSummaryDay, setHiddenSummaryDay] = useState(null)
  const [openIssueId, setOpenIssueId] = useState(null)
  const [dismissedIssueId, setDismissedIssueId] = useState(null)

  useEffect(() => {
    if (!hasMission) navigate('/')
  }, [hasMission, navigate])

  useEffect(() => {
    if (state?.phase === 'completed') navigate('/results')
  }, [state?.phase, navigate])

  if (!state) return null
  if (state.difficulty === 'kid') return <KidMissionControl />
  const { resources, environment, atmosphere, equipment, equipmentCondition, mission, day, log, history, pendingEmergency, astronautName, difficulty, stats } = state
  const running = speed > 0 && state.phase === 'active'
  const rates = getDailyRates(state)
  const pct = (c, m) => (m ? (c / m) * 100 : 0)
  // Dust-storm visuals only apply to Mars; lunar night is not a dust storm.
  const storm = mission.id === 'mars' && (environment.solarEfficiency < 60 || pendingEmergency?.type === 'dust_storm' || environment.sunlight < 0.55)
  const mars = mission.id === 'mars'
  const lunarNight = !mars && environment.sunlight < 0.3
  const crew = state.astronauts
  const crewReport = state.crewReport
  const emergency = state.phase === 'emergency' ? pendingEmergency : null
  const issue = emergency
    ? { ...emergency, kind: 'emergency' }
    : crewReport
      ? { ...crewReport, kind: 'crew' }
      : null
  const issueReporter = issue ? (crew.find((c) => c.id === issue.astronautId) ?? crew[0]) : null
  const issueIsEmergency = issue?.kind === 'emergency'
  const issueDanger = issueIsEmergency || issue?.severity === 'danger'
  const crewMoods = Object.fromEntries(crew.map((c) => [
    c.id,
    c.status !== 'active' ? 'alarmed'
      : c.health < 55 || c.stress > 70 || c.fatigue > 72 ? 'concerned'
        : 'calm',
  ]))
  const avgFatigue = Math.round(crew.reduce((s, c) => s + c.fatigue, 0) / crew.length)
  const phase = getPhaseForDay(day)
  const difficultyInfo = DIFFICULTIES[difficulty] ?? DIFFICULTIES.survival
  const assignments = Object.fromEntries(crew.map((c) => [c.id, c.task]))
  const timeLeft = (current, rate) => (rate < -0.01 ? current / -rate : null)
  const timeNote = (current, rate) => {
    const d = timeLeft(current, rate)
    return d !== null && d < 10 ? ` · ≈ ${Math.floor(d)} Sols left` : ''
  }
  const roverNote = (key) => {
    const a = EXPLORATION[key]
    return `${a.baseScience} base science · ${a.batteryCost} battery · ${a.electricityCost} power · returns in 2 Sols`
  }
  const evaAction = EXPLORATION.geologicalSample
  const evaCrew = crew.find((c) => c.id === evaAstronaut)
  const evaBlocked = state.phase !== 'active' || resources.oxygen.current < 12 || (equipmentCondition?.spacesuit ?? 90) < 40 || resources.battery.current < evaAction.batteryCost || evaCrew?.status !== 'active'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#040a18]/85 p-5 shadow-[0_24px_70px_-30px_rgba(14,165,233,0.6)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_140%_at_0%_0%,rgba(56,189,248,0.20),transparent_50%),radial-gradient(110%_140%_at_100%_100%,rgba(129,140,248,0.18),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#7dd3fc_1px,transparent_1px),linear-gradient(to_bottom,#7dd3fc_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border ${mars ? 'border-orange-400/40 bg-orange-500/10 text-orange-300' : 'border-sky-400/40 bg-sky-500/10 text-sky-300'}`}>
            <span className="absolute inset-0 rounded-2xl bg-current opacity-10 blur-md" />
            <Rocket size={28} className="relative" />
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#040a18] bg-emerald-400">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live mission control · space night ops
            </p>
            <h1 className="mt-1 bg-gradient-to-r from-white via-sky-100 to-cyan-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">{mission.destination}</h1>
            <p className="mt-1 text-sm text-slate-400">Commander <span className="font-semibold text-sky-300">{astronautName || 'Astronaut'}</span> · telemetry active · the base runs in real time, so manage systems as the clock moves</p>
          </div>
          <div className="ml-auto grid grid-cols-3 gap-2 text-center">
            {[
              ['Sol', `${Math.min(day, state.missionLength)}/${state.missionLength}`],
              ['Crew', `${crew.filter((c) => c.status === 'active').length}/3`],
              ['Mode', difficultyInfo.label],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400">{k}</p>
                <p className="text-sm font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="grid md:grid-cols-5 gap-3">
        {[
          ['Destination', mission.name],
          ['Mission Sol', `${Math.min(day, state.missionLength)} / ${state.missionLength}`],
          ['Duration', `${state.missionLength} mission Sols`],
          ['Difficulty', difficultyInfo.label],
          ['Status', state.phase === 'emergency' ? 'EMERGENCY' : 'Active'],
        ].map(([k, v]) => (
          <div key={k} className="glass rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide">{k}</div>
            <div className={`mt-1 font-semibold ${k==='Status' && v==='EMERGENCY' ? 'text-amber-300' : 'text-white'}`}>{v}</div>
          </div>
        ))}
      </section>

      <section className="glass rounded-xl p-4 border-sky-500/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sky-300 uppercase tracking-wider text-xs">Phase {phase.phase} / 6</p>
            <h2 className="text-xl font-semibold text-white">{phase.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {phase.objectives.map((o) => (
              <span key={o} className="text-[11px] px-2 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-200">{o}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sky-300 uppercase tracking-[0.22em] text-[10px]">Live Surface Operations</p>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Activity size={18} className="text-sky-300"/>1. Base Surface Simulation</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
            <span className={`h-1.5 w-1.5 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {state.phase === 'emergency' ? 'Time paused · emergency' : running ? 'Time advancing automatically' : 'Time paused'}
          </span>
        </div>

        <MissionClock
          day={Math.min(day, state.missionLength)}
          missionLength={state.missionLength}
          solProgress={solProgress}
          speed={speed}
          setSpeed={setSpeed}
          phase={state.phase}
        />

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-3 min-w-0">
            <LunarScene
              running={running}
              storm={storm}
              roverTask={state.roverMission?.actionKey ?? 'patrol'}
              day={Math.min(day, state.missionLength)}
              mars={mars}
              night={lunarNight}
              environment={environment}
              scene={state.scene}
              pendingEmergency={pendingEmergency}
              equipment={equipment}
              phase={state.phase}
              assignments={assignments}
              roverMission={state.roverMission}
              solProgress={solProgress}
              issue={issue}
              onOpenIssue={() => setOpenIssueId(issue?.id ?? null)}
              crewMoods={crewMoods}
            />

            <div className="min-h-[118px]">
              <AnimatePresence initial={false} mode="wait">
                {issue && dismissedIssueId !== issue.id ? (
                  <motion.div
                    key={`popup-${issue.id}`}
                    initial={{ opacity: 0, y: -10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className={`relative overflow-hidden rounded-xl border p-3 pr-2.5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.9)] ${issueDanger ? 'border-red-400/45 bg-gradient-to-r from-red-950/70 to-[#0a1220]/85' : 'border-amber-400/40 bg-gradient-to-r from-amber-950/60 to-[#0a1220]/85'}`}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 ${issueDanger ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <CrewAvatar astronaut={issueReporter} size={50} alert={issueDanger} />
                        <span className="absolute -left-1 -top-2 grid h-5 w-5 place-items-center rounded-full bg-slate-950 text-sky-300 ring-1 ring-sky-400/50"><Radio size={11} /></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] ${issueDanger ? 'text-red-300' : 'text-amber-300'}`}>
                          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                          {issueIsEmergency ? 'Emergency report' : 'Crew report'} · to the Mission Director
                        </p>
                        <p className="mt-0.5 text-sm leading-tight text-white">
                          <span className="font-bold text-sky-200">{issueReporter?.name?.split(' ')[0] ?? 'Crew'}:</span>{' '}
                          <span className="font-semibold">“{issue.title}”</span>
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{issue.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setOpenIssueId(issue?.id ?? null)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-950 transition ${issueDanger ? 'bg-red-400 hover:bg-red-300' : 'bg-amber-400 hover:bg-amber-300'}`}
                          >
                            Review &amp; decide <ChevronRight size={13} />
                          </button>
                          <button onClick={() => setDismissedIssueId(issue.id)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:bg-white/5">
                            Later
                          </button>
                          <span className="text-[10px] text-slate-500">{issueIsEmergency ? 'Time paused' : 'Time running'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : issue ? (
                  <motion.button
                    key={`mini-${issue.id}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onClick={() => setOpenIssueId(issue.id)}
                    className={`flex min-h-[116px] w-full items-center gap-3 rounded-xl border p-3 text-left transition ${issueDanger ? 'border-red-400/40 bg-red-500/10 hover:bg-red-500/15' : 'border-amber-400/35 bg-amber-500/10 hover:bg-amber-500/15'}`}
                  >
                    <CrewAvatar astronaut={issueReporter} size={38} alert={issueDanger} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${issueDanger ? 'text-red-300' : 'text-amber-300'}`}>
                        {issueIsEmergency ? 'Emergency' : 'Crew report'} · warning marker active
                      </p>
                      <p className="truncate text-sm font-semibold text-white">{issue.title}</p>
                      <p className="text-[11px] text-slate-400">The crew is waiting for your decision.</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-950 ${issueDanger ? 'bg-red-400' : 'bg-amber-400'}`}>Review <ChevronRight size={12} /></span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="quiet"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-[116px] items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4"
                  >
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Crew channel · open</p>
                      <p className="mt-0.5 text-sm text-slate-300">No active reports. The crew is on station — the next report arrives every 10–15 seconds.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => abortRoverMission()} disabled={!state.roverMission} title={state.roverMission ? 'Recall the rover now; it returns over the next fraction of a Sol' : 'Rover is already at base'} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-400/30 text-amber-200 hover:bg-amber-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"><RotateCcw size={16}/>{state.roverMission ? 'Recall rover to base' : 'Rover at base'}</button>
              <span className="text-[11px] text-slate-400">Base operations run continuously — adjust systems and crew tasks while the clock moves.</span>
            </div>
          </div>
          <aside className="lg:col-span-2 space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2"><Users size={16} className="text-sky-300"/>Crew Status</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">AVG HEALTH {Math.round(crew.reduce((s, c) => s + c.health, 0) / crew.length)}</span>
              </div>
              <div className="space-y-2">
                {crew.map((c) => {
                  const initials = c.name.split(' ').map((p) => p[0]).join('')
                  const fatigueTone = c.fatigue < 40 ? 'bg-sky-400' : c.fatigue < 70 ? 'bg-amber-400' : 'bg-red-400'
                  return (
                    <div key={c.id} className="p-2 rounded-xl bg-slate-900/50 border border-white/5 hover:border-sky-400/20 transition">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-950" style={{ background: c.color }}>{initials}<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${c.status === 'active' ? 'bg-emerald-400' : c.status === 'incapacitated' ? 'bg-amber-400' : 'bg-red-500'}`} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white text-sm leading-tight">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.profession} · RAD {Math.round(c.radiationDose)} mSv</div>
                        </div>
                        <div className="text-right"><div className="text-lg font-bold text-white leading-none">{Math.round(c.health)}</div><div className="text-[10px] text-slate-400">health</div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-slate-400">
                        <div><div className="flex justify-between"><span>Fatigue</span><span className="text-slate-300">{Math.round(c.fatigue)}</span></div><div className="h-1.5 rounded bg-slate-800 overflow-hidden mt-0.5"><div className={`h-full ${fatigueTone}`} style={{ width: `${c.fatigue}%` }} /></div></div>
                        <div><div className="flex justify-between"><span>Hydration</span><span className="text-slate-300">{Math.round(c.hydration)}</span></div><div className="h-1.5 rounded bg-slate-800 overflow-hidden mt-0.5"><div className="h-full bg-cyan-400" style={{ width: `${c.hydration}%` }} /></div></div>
                        <div><div className="flex justify-between"><span>Nutrition</span><span className="text-slate-300">{Math.round(c.nutrition)}</span></div><div className="h-1.5 rounded bg-slate-800 overflow-hidden mt-0.5"><div className="h-full bg-emerald-400" style={{ width: `${c.nutrition}%` }} /></div></div>
                      </div>
                      <select
                        aria-label={`Assigned task for ${c.name}`}
                        value={c.task}
                        onChange={(e) => setCrewTask(c.id, e.target.value)}
                        disabled={state.phase === 'completed'}
                        className="mt-2 w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        {CREW_TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {state.lastCycleSummary && state.lastCycleSummary.day !== hiddenSummaryDay && (() => {
        const s = state.lastCycleSummary
        const fmt = (v, unit = '') => `${v >= 0 ? '+' : ''}${v.toFixed(1)}${unit}`
        const tileTone = (v) => (v > 0 ? 'text-emerald-300' : v < 0 ? 'text-red-300' : 'text-slate-200')
        const tiles = [
          ['Oxygen', fmt(s.oxygenDelta), tileTone(s.oxygenDelta)],
          ['Water', fmt(s.waterDelta, ' L'), tileTone(s.waterDelta)],
          ['Food', fmt(s.foodDelta), tileTone(s.foodDelta)],
          ['Power', fmt(s.electricityDelta), tileTone(s.electricityDelta)],
          ['Battery', fmt(s.batteryDelta, '%'), tileTone(s.batteryDelta)],
          ['CO2', fmt(s.co2Delta, ' ppm'), tileTone(-s.co2Delta)],
          ['Pressure', fmt(s.pressureDelta, ' kPa'), tileTone(s.pressureDelta)],
          ['Temp', fmt(s.temperatureDelta, '°C'), tileTone(-s.temperatureDelta)],
          ['Radiation', fmt(s.radiationDelta), tileTone(-s.radiationDelta)],
        ]
        return (
          <section className="glass rounded-xl p-4 border-sky-400/20">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-sky-300 uppercase tracking-wider text-xs">Mission Cycle Summary</p>
                <h2 className="text-lg font-semibold text-white">Sol {s.day} — what happened</h2>
              </div>
              <button onClick={() => setHiddenSummaryDay(s.day)} className="text-xs px-3 py-1.5 rounded border border-white/10 text-slate-300 hover:bg-white/5">Dismiss</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2 text-center">
              {tiles.map(([k, v, tone]) => (
                <div key={k} className="rounded-lg bg-slate-900/50 border border-white/5 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">{k}</div>
                  <div className={`text-xs font-semibold mt-1 ${tone}`}>{v}</div>
                </div>
              ))}
            </div>
            {s.warnings.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.warnings.map((w, i) => (
                  <span key={i} className={`text-[11px] px-2 py-1 rounded-full border ${w.level === 'danger' ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-amber-400/40 bg-amber-500/10 text-amber-200'}`}>{w.text}</span>
                ))}
              </div>
            )}
          </section>
        )
      })()}

      <section>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><Activity size={18} className="text-sky-300"/>2. Resource Overview</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResourceCard icon={Wind} title="Oxygen" current={resources.oxygen.current} max={resources.oxygen.max} unit="units" rate={`${rates.oxygenDelta.toFixed(1)} / Sol${timeNote(resources.oxygen.current, rates.oxygenDelta)}`} status={statusFor(pct(resources.oxygen.current, resources.oxygen.max))} />
          <ResourceCard icon={Droplets} title="Water Supply" current={resources.water.current} max={resources.water.max} unit="L" rate={`${rates.waterDelta.toFixed(1)} / Sol${timeNote(resources.water.current, rates.waterDelta)}`} status={statusFor(pct(resources.water.current, resources.water.max))} />
          <ResourceCard icon={Apple} title="Food Supply" current={resources.food.current} max={resources.food.max} unit="units" rate={`${rates.foodDelta >= 0 ? '+' : ''}${rates.foodDelta.toFixed(1)} / Sol${timeNote(resources.food.current, rates.foodDelta)}${equipment.greenhouse ? rates.greenhouseMature ? ' · crops mature' : ` · crops ${(state.greenhouseGrowth ?? 0).toFixed(1)}/${CREW.greenhouseGrowDays} Sols` : ''}`} status={statusFor(pct(resources.food.current, resources.food.max))} />
          <ResourceCard icon={Zap} title="Electricity" current={resources.electricity.current} max={resources.electricity.max} unit="units" rate={`Net ${rates.electricityNet >= 0 ? '+' : ''}${rates.electricityNet.toFixed(1)} / Sol${timeNote(resources.electricity.current, rates.electricityNet)}`} status={statusFor(pct(resources.electricity.current, resources.electricity.max))} />
          <ResourceCard icon={Battery} title="Battery Charge" current={resources.battery.current} max={resources.battery.max} unit="%" rate={rates.electricityNet >= 0 ? 'Charging (net positive)' : 'Discharging (net deficit)'} status={statusFor(resources.battery.current)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {[
            ['Spare Parts', resources.spareParts, resources.spareParts <= 1 ? 'text-amber-300' : 'text-white'],
            ['Waste', `${resources.waste.current.toFixed(1)} kg`, resources.waste.current > 22 ? 'text-amber-300' : 'text-white'],
            ['Science', `${Math.round(stats.scientificPoints)} pts`, 'text-violet-300'],
            ['Avg Fatigue', `${avgFatigue}%`, avgFatigue >= 70 ? 'text-amber-300' : 'text-white'],
          ].map(([k, v, tone]) => (
            <div key={k} className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{k}</div>
              <div className={`mt-1 text-xl font-bold ${tone}`}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-3">Resource Trends</h2>
          <MissionChart history={history} />
        </div>
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><Thermometer size={18} className="text-sky-300"/>3. Environment &amp; Life Support <span className="text-xs font-normal text-slate-400">Sol {Math.min(day, state.missionLength)} live</span></h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-300">Habitat Temperature</span><span className={`${atmosphere && (environment.temperature < 17 || environment.temperature > 27) ? 'text-amber-300' : 'text-white'} font-semibold`}>{Math.round(environment.temperature)}°C <span className="text-slate-500 font-normal">(outside {environment.outsideTemp}°C)</span></span></div>
              <div className="flex justify-between"><span className="text-slate-300 flex items-center gap-1"><Wind size={14}/> Cabin Oxygen</span><span className={`${atmosphere.oxygenConc < 19.5 ? 'text-amber-300' : 'text-white'} font-semibold`}>{atmosphere.oxygenConc.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-300 flex items-center gap-1"><FlaskConical size={14}/> CO2 (scrubber)</span><span className={`${atmosphere.co2Ppm > 2500 ? 'text-red-300' : atmosphere.co2Ppm > 1500 ? 'text-amber-300' : 'text-emerald-300'} font-semibold`}>{Math.round(atmosphere.co2Ppm)} ppm</span></div>
              <div className="flex justify-between"><span className="text-slate-300 flex items-center gap-1"><Gauge size={14}/> Cabin Pressure</span><span className={`${atmosphere.pressure < 95 || atmosphere.pressure > 105 ? 'text-amber-300' : 'text-white'} font-semibold`}>{atmosphere.pressure.toFixed(1)} kPa</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Humidity</span><span className="text-white font-semibold">{Math.round(atmosphere.humidity)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-300 flex items-center gap-1"><Radiation size={14}/> Radiation</span><span className={`${environment.radiation>35?'text-amber-300':'text-white'} font-semibold`}>{environment.radiation} index</span></div>
              <div className="flex justify-between"><span className="text-slate-300 flex items-center gap-1"><Trash2 size={14}/> Waste Level</span><span className={`${resources.waste.current > 22 ? 'text-amber-300' : 'text-white'} font-semibold`}>{resources.waste.current.toFixed(1)} / {resources.waste.max} kg</span></div>
              {state.mission.profile?.archivedStorms?.find((s) => s.day === day) && (
                <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200"><strong>ARCHIVED STORM SOL:</strong> {state.mission.profile.archivedStorms.find((s) => s.day === day).label}. Radiation spiking — shelter the crew.</div>
              )}
              {!mars && state.mission.profile?.lunarNightDays?.includes(day) && (
                <div className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200"><strong>LUNAR NIGHT:</strong> The Sun is below the horizon — solar generation is effectively zero. Survive on batteries and discipline.</div>
              )}
              <div className="flex justify-between"><span className="text-slate-300 flex items-center gap-1"><Sun size={14}/> Solar Efficiency</span><span className="text-white font-semibold">{environment.solarEfficiency}%</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Sunlight Factor</span><span className="text-white font-semibold">{environment.sunlight}</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Solar Generation</span><span className="text-sky-200 font-semibold">~{rates.solarGeneration.toFixed(1)} units/day</span></div>
              <p className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                {rates.power.reserveLow
                  ? 'LOW POWER RESERVE: life support keeps priority; water recovery and greenhouse output are throttled first. Shed optional systems.'
                  : 'Power priority: critical life support runs first; optional loads can be shed to protect the reserve.'}
              </p>
            </div>
          </div>
          {mars && (
            <div className="glass rounded-xl p-5">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Radio size={16} className="text-sky-300"/>4b. Earth Link</h2>
              <p className="text-[11px] text-slate-400">Mars one-way light time ≈ 4–24 min. Earth advises — but the reply arrives late, never in time for live rescue.</p>
              {state.earthRequest ? (
                <div className="text-amber-300 text-sm mt-2">Radio call out — Earth reply expected in ~{Math.max(0, state.earthRequest.answerDay - day)} Sol(s). One-way light time ~{state.earthRequest.delayMin} min.</div>
              ) : state.earthAnswer ? (
                <div className="mt-2 text-sm"><p className="text-sky-300 font-semibold">Earth (delayed {state.earthAnswer.delayMin} min) said:</p><p className="text-slate-200 mt-1">{state.earthAnswer.text}</p></div>
              ) : (
                <div className="text-slate-400 text-sm mt-2">No advisory received. You’re on your own for now.</div>
              )}
              <button onClick={askEarth} disabled={state.phase !== 'active' || !!state.earthRequest} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-sky-400/30 text-sky-100 hover:bg-sky-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition"><Radio size={13} /> ASK EARTH (delay 4–24 min)</button>
            </div>
          )}
          <div className="glass rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><AlertTriangle size={16} className={issue ? (issueDanger ? 'text-red-300' : 'text-amber-300') : 'text-emerald-300'} />5. Crew Reports &amp; Emergencies</h2>
            {issue ? (
              <div className={`rounded-xl border p-3 ${issueDanger ? 'border-red-400/40 bg-red-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
                <div className="flex items-start gap-3">
                  <CrewAvatar astronaut={issueReporter} size={40} alert={issueDanger} />
                  <div className="min-w-0">
                    <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${issueDanger ? 'text-red-300' : 'text-amber-300'}`}>
                      {issueIsEmergency ? 'Emergency' : 'Crew report'} · Sol {issue.day}
                    </p>
                    <p className="text-sm font-semibold text-white">{issue.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{issueReporter?.name} reports to the Mission Director.</p>
                  </div>
                </div>
                <button onClick={() => setOpenIssueId(issue?.id ?? null)} className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-950 transition ${issueDanger ? 'bg-red-400 hover:bg-red-300' : 'bg-amber-400 hover:bg-amber-300'}`}>
                  Review report <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="text-emerald-300 text-sm">No active reports. The crew is operating normally — stay ready, reports arrive every few seconds.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4 min-w-0">
        <div className="glass rounded-xl p-5 min-w-0">
          <h2 className="text-xl font-semibold text-white mb-3">4. Equipment Management</h2>
          <div className="space-y-2">
            {equipmentDefs.map((d) => {
              const cond = equipmentCondition?.[d.id] ?? 100
              const condTone = cond >= 70 ? 'bg-emerald-400' : cond >= 40 ? 'bg-amber-400' : 'bg-red-400'
              return (
                <div key={d.id} className="p-3 rounded-lg bg-slate-900/40 border border-white/5 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white font-medium flex items-center gap-2 min-w-0">{d.name}<span className="text-[9px] uppercase tracking-wider text-slate-500 border border-white/10 rounded px-1 shrink-0">{d.priority}</span></div>
                      <div className="text-xs text-slate-400 truncate">{d.energyUse} units/day · {d.effect}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => repairEquipment(d.id)} title="Repair equipment (1 spare part)" aria-label={`Repair ${d.name}`} className="px-2 py-1.5 rounded-md text-slate-300 border border-white/10 hover:border-amber-400/40 hover:text-amber-200 transition"><Wrench size={14} /></button>
                      <button onClick={() => toggleEquipment(d.id)} className={`px-3 py-1.5 rounded-md text-sm border ${equipment[d.id] ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' : 'bg-slate-800 text-slate-300 border-white/10'}`}>{equipment[d.id] ? 'ON' : 'OFF'}</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400"><span className="w-16">Condition</span><div className="flex-1 h-1.5 rounded bg-slate-800 overflow-hidden"><div className={`h-full ${condTone}`} style={{ width: `${cond}%` }} /></div><span className="w-8 text-right text-slate-300">{Math.round(cond)}%</span></div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
            <div>
              <div className="text-sm text-white">Optional loads — science, comms &amp; lighting</div>
              <div className="text-[11px] text-slate-400">Draws 10 power/day while ON. Shed these first; research pauses while OFF.</div>
            </div>
            <button onClick={toggleOptionalLoads} className={`px-3 py-1.5 rounded-md text-sm border shrink-0 ${state.optionalLoads === false ? 'bg-slate-800 text-slate-300 border-white/10' : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'}`}>{state.optionalLoads === false ? 'OFF' : 'ON'}</button>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-white/5 pt-2">Spare parts remaining: <span className="text-amber-300 font-semibold">{resources.spareParts}</span>. Repairs restore one system to 100% condition (costs 1 part).</div>

        </div>
        <div className="glass rounded-xl p-5 min-w-0">
          <h2 className="text-xl font-semibold text-white mb-3">6. Mission Activity Log</h2>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {log.map((entry, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${entry.type==='danger'?'border-red-400/30 bg-red-500/10':entry.type==='warning'?'border-amber-400/30 bg-amber-500/10':entry.type==='success'?'border-emerald-400/30 bg-emerald-500/10':'border-white/10 bg-slate-900/40'}`}>
                <span className="text-sky-300 font-medium">Sol {entry.day}:</span> <span className="text-slate-200">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sky-300 uppercase tracking-wider text-xs">Surface Ops</p>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Rocket size={18} className="text-sky-300"/>7. Rover &amp; EVA Expeditions</h2>
          </div>
          <span className="text-xs text-slate-400">Costs battery &amp; power · increases fatigue &amp; radiation dose</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => sendRoverSurvey('roverSurvey')} disabled={state.phase !== 'active' || !!state.roverMission} className="text-left p-3 rounded-lg border border-sky-400/30 hover:bg-sky-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <div className="font-semibold text-white">Rover Survey</div>
            <div className="text-[11px] text-slate-400 mt-1">{roverNote('roverSurvey')}</div>
          </button>
          <button onClick={() => sendRoverSurvey('geologicalSample')} disabled={state.phase !== 'active' || !!state.roverMission} className="text-left p-3 rounded-lg border border-sky-400/30 hover:bg-sky-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <div className="font-semibold text-white">Geological Sample Run</div>
            <div className="text-[11px] text-slate-400 mt-1">{roverNote('geologicalSample')}</div>
          </button>
          {mars ? (
            <button onClick={() => sendRoverSurvey('marsCo2Study')} disabled={state.phase !== 'active' || !!state.roverMission} className="text-left p-3 rounded-lg border border-violet-400/30 hover:bg-violet-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
              <div className="font-semibold text-white">ISRU CO2 Oxygen Study</div>
              <div className="text-[11px] text-slate-400 mt-1">{roverNote('marsCo2Study')}</div>
            </button>
          ) : (
            <button onClick={() => sendRoverSurvey('moonIceDrill')} disabled={state.phase !== 'active' || !!state.roverMission} className="text-left p-3 rounded-lg border border-cyan-400/30 hover:bg-cyan-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
              <div className="font-semibold text-white">Ice Drill — Shadowed Crater</div>
              <div className="text-[11px] text-slate-400 mt-1">{roverNote('moonIceDrill')} · chance of +40 L water</div>
            </button>
          )}
          <button onClick={() => sendOnEva(evaAstronaut, 'geologicalSample')} disabled={evaBlocked} className="text-left p-3 rounded-lg border border-amber-400/30 hover:bg-amber-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <div className="font-semibold text-white">EVA Geological Run</div>
            <div className="text-[11px] text-slate-400 mt-1">{evaAction.baseScience} base science · uses suit O2 &amp; {evaAction.batteryCost} battery · risk: spacesuit emergency</div>
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <label htmlFor="eva-select" className="text-slate-500">EVA crew:</label>
          <select id="eva-select" value={evaAstronaut} onChange={(e) => setEvaAstronaut(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200">
            {crew.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.profession}</option>)}
          </select>
          <span>Suit integrity {Math.round(equipmentCondition?.spacesuit ?? 90)}%</span>
          <span className="text-slate-500">Rover trips {stats.roverTrips} · EVAs {stats.evas} · Ice extracted {stats.iceExtractedKg} L</span>
          {state.roverMission && <span className="text-sky-300">Rover away — returns in {Math.max(0.1, state.roverMission.daysRemaining).toFixed(1)} Sols</span>}
        </div>
      </section>

      <CrewReportModal
        issue={openIssueId && openIssueId === issue?.id ? issue : null}
        astronaut={issueReporter}
        onChoose={(choiceId) => {
          if (issueIsEmergency) chooseEmergency(choiceId)
          else resolveCrewReport(choiceId)
          setOpenIssueId(null)
        }}
        onClose={() => setOpenIssueId(null)}
        spareParts={resources.spareParts}
      />
    </div>
  )
}
