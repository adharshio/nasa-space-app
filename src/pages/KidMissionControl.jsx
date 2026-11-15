import { useState } from 'react'
import { useMission } from '../hooks/useMission'
import MissionClock from '../components/MissionClock'
import CrewAvatar from '../components/CrewAvatar'
import CrewReportModal from '../components/CrewReportModal'
import { Wind, Apple, Zap, AlertTriangle, ChevronRight } from 'lucide-react'

function Gauge({ label, pct, note, icon: Icon }) {
  const p = Math.max(0, Math.min(100, pct))
  const status = p >= 66 ? 'Great!' : p >= 33 ? 'Okay' : p > 0 ? 'Careful!' : 'Oh no!'
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (p / 100) * circumference
  const ring = p >= 66 ? '#34d399' : p >= 33 ? '#fbbf24' : '#f87171'
  return (
    <div className="glass rounded-3xl p-6 flex flex-col items-center text-center border-sky-500/20">
      <Icon size={30} className="text-sky-300 mb-1" aria-hidden="true" />
      <h2 className="text-2xl font-black text-white tracking-wide">{label}</h2>
      <svg width="170" height="170" viewBox="0 0 170 170" className="my-3" role="img" aria-label={`${label}: ${Math.round(p)} percent`}>
        <circle cx="85" cy="85" r={radius} stroke="#1e293b" strokeWidth="18" fill="none" />
        <circle cx="85" cy="85" r={radius} stroke={ring} strokeWidth="18" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 85 85)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
        <text x="85" y="80" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800">{Math.round(p)}%</text>
        <text x="85" y="112" textAnchor="middle" fill={ring} fontSize="15" fontWeight="700">{status}</text>
      </svg>
      <p className="text-slate-300 text-lg leading-snug">{note}</p>
    </div>
  )
}

export default function KidMissionControl() {
  const { state, chooseEmergency, resolveCrewReport, speed, setSpeed, solProgress } = useMission()
  const [openIssueId, setOpenIssueId] = useState(null)
  if (!state) return null

  const { resources, atmosphere, day, astronautName, log, pendingEmergency, phase } = state
  const crew = state.astronauts
  const crewReport = state.crewReport
  const emergency = phase === 'emergency' ? pendingEmergency : null
  const issue = emergency
    ? { ...emergency, kind: 'emergency' }
    : crewReport
      ? { ...crewReport, kind: 'crew' }
      : null
  const issueReporter = issue ? (crew.find((c) => c.id === issue.astronautId) ?? crew[0]) : null
  const issueIsEmergency = issue?.kind === 'emergency'
  const issueDanger = issueIsEmergency || issue?.severity === 'danger'
  const oxygenPct = (resources.oxygen.current / resources.oxygen.max) * 100
  const cabinPct = ((atmosphere?.oxygenConc ?? 21) - 17) / 6 * 100
  const airPct = Math.round((oxygenPct + Math.max(0, Math.min(100, cabinPct))) / 2)
  const foodPct = (resources.food.current / resources.food.max) * 100
  const waterPct = (resources.water.current / resources.water.max) * 100
  const suppliesPct = Math.round((foodPct + waterPct) / 2)
  const elecPct = (resources.electricity.current / resources.electricity.max) * 100
  const battPct = resources.battery.current
  const powerPct = Math.round((elecPct + battPct) / 2)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="glass rounded-3xl p-6 border-sky-500/25 text-center">
        <p className="text-sky-300 uppercase tracking-widest text-sm">ASTRA · Kid Mission</p>
        <h1 className="text-5xl font-black text-white mt-1">{astronautName}</h1>
        <p className="text-2xl text-slate-300 mt-2">Day <span className="text-sky-300 font-bold">{day}</span> of <span className="font-bold">{state.missionLength}</span> — keep your friends breathing!</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Gauge icon={Wind} label="Air" pct={airPct} note="Do we have enough air to breathe?" />
        <Gauge icon={Apple} label="Food & Water" pct={suppliesPct} note="Have we got food and drinks?" />
        <Gauge icon={Zap} label="Power" pct={powerPct} note="Do we have electricity and battery?" />
      </div>

      {issue && (
        <div className={`rounded-3xl border-2 p-5 ${issueDanger ? 'border-red-400/50 bg-red-500/10' : 'border-amber-400/50 bg-amber-500/10'}`}>
          <div className="flex flex-wrap items-center gap-4">
            <CrewAvatar astronaut={issueReporter} size={70} alert={issueDanger} />
            <div className="min-w-0 flex-1">
              <p className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest ${issueDanger ? 'text-red-300' : 'text-amber-300'}`}>
                <AlertTriangle size={18} /> {issueIsEmergency ? 'Emergency!' : 'A friend has news!'}
              </p>
              <p className="mt-1 text-2xl font-black text-white">{issueReporter?.name?.split(' ')[0]} says: “{issue.title}”</p>
              <p className="text-lg text-slate-300">{issueIsEmergency ? 'Mission time is paused. Let’s fix it together!' : 'Time is still going — help when you are ready.'}</p>
            </div>
            <button
              onClick={() => setOpenIssueId(issue?.id ?? null)}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-xl font-black text-slate-950 shadow-lg transition ${issueDanger ? 'bg-red-400 hover:bg-red-300' : 'bg-amber-400 hover:bg-amber-300'}`}
            >
              What happened? <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <MissionClock
            day={Math.min(day, state.missionLength)}
            missionLength={state.missionLength}
            solProgress={solProgress}
            speed={speed}
            setSpeed={setSpeed}
            phase={phase}
          />
          <p className="mt-3 text-center text-lg text-slate-300">Time keeps going on its own — pause any time you need to think!</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <h2 className="text-xl font-bold text-white mb-2">Mission Log (latest first)</h2>
        <div className="space-y-2 max-h-56 overflow-auto">
          {log.slice(0, 5).map((entry, i) => (
            <div key={i} className="text-lg text-slate-200"><span className="text-sky-300 font-semibold">Day {entry.day}:</span> {entry.text}</div>
          ))}
        </div>
      </div>

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
