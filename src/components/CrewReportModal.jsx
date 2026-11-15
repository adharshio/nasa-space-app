import { motion } from 'framer-motion'
import { Radio, X, ShieldAlert, ArrowRight, AlertTriangle } from 'lucide-react'
import AstronautPortrait from './AstronautPortrait'
import CrewAvatar from './CrewAvatar'

const EFFECT_LABELS = {
  oxygen: ['O₂', ''],
  water: ['Water', ' L'],
  food: ['Food', ''],
  electricity: ['Power', ''],
  battery: ['Battery', '%'],
  spareParts: ['Parts', ''],
  waste: ['Waste', ''],
  radiation: ['Radiation', ''],
  healthDelta: ['Health', ''],
  stressDelta: ['Stress', ''],
  fatigueDelta: ['Fatigue', ''],
  cabinCo2: ['CO₂', ' ppm'],
  cabinO2: ['Cabin O₂', '%'],
  pressure: ['Pressure', ' kPa'],
  temperatureDelta: ['Temp', '°C'],
  solarEfficiencyDelta: ['Solar', '%'],
  conditionDelta: ['Condition', '%'],
}

const GOOD_WHEN_POSITIVE = new Set([
  'oxygen', 'water', 'food', 'electricity', 'battery', 'spareParts', 'healthDelta',
  'conditionDelta', 'solarEfficiencyDelta', 'pressure', 'cabinO2',
])

function effectChips(choice) {
  const effects = choice.effects || {}
  return Object.entries(effects)
    .filter(([key, value]) => EFFECT_LABELS[key] && Number.isFinite(value) && value !== 0)
    .map(([key, value]) => {
      const [label, unit] = EFFECT_LABELS[key]
      const good = GOOD_WHEN_POSITIVE.has(key) ? value > 0 : value < 0
      return {
        key,
        text: `${label} ${value > 0 ? '+' : ''}${value}${unit}`,
        good,
      }
    })
}

export default function CrewReportModal({ issue, astronaut, onChoose, onClose, spareParts = 0 }) {
  if (!issue) return null
  const emergency = issue.kind === 'emergency' || issue.origin === 'emergency'
  const danger = emergency || issue.severity === 'danger'
  const accent = danger ? '#f87171' : '#fbbf24'
  const accentText = danger ? 'text-red-300' : 'text-amber-300'
  const border = danger ? 'border-red-400/45' : 'border-amber-400/40'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#02060f]/95 backdrop-blur-xl">
      {/* deep-space backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(70%_60%_at_85%_80%,rgba(129,140,248,0.12),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#7dd3fc_1px,transparent_1px),linear-gradient(to_bottom,#7dd3fc_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1px_1px_at_12%_22%,rgba(255,255,255,.7),transparent),radial-gradient(1.5px_1.5px_at_82%_18%,rgba(255,255,255,.6),transparent),radial-gradient(1px_1px_at_68%_72%,rgba(255,255,255,.5),transparent),radial-gradient(1px_1px_at_28%_82%,rgba(255,255,255,.5),transparent)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-[1380px] flex-col px-4 py-4 sm:px-6 lg:py-5">
        {/* transmission bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-300">
              <Radio size={17} />
              <span className="absolute inset-0 animate-ping rounded-full border border-sky-400/30" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-300">Incoming transmission</p>
              <p className="text-[11px] text-slate-400">Live link · {emergency ? 'emergency channel' : 'crew channel'} · Sol {issue.day}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${danger ? 'border-red-400/40 bg-red-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${accentText}`}>Urgency</span>
              <span className="flex items-end gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full ${i === 0 ? 'h-2.5' : i === 1 ? 'h-3.5' : 'h-4'} ${i === 0 || (danger && i <= 2) || (!danger && i <= 1) ? (danger ? 'bg-red-400' : 'bg-amber-400') : 'bg-slate-700'}`}
                  />
                ))}
              </span>
              <span className={`text-[10px] font-bold ${accentText}`}>{danger ? 'HIGH' : 'MEDIUM'}</span>
            </div>
            <button onClick={onClose} aria-label="Close transmission" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-4 py-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:py-2">
          {/* full-body astronaut */}
          <div className="relative mx-auto flex h-[300px] w-full max-w-[460px] items-center justify-center sm:h-[360px] lg:h-[74vh] lg:max-h-[720px]">
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-slate-950/75 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200 backdrop-blur">
              <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: astronaut?.color ?? accent }} />
              {astronaut?.name ?? 'Crew member'} · {astronaut?.profession ?? 'Astronaut'}
            </div>
            <AstronautPortrait astronaut={astronaut} severity={danger ? 'danger' : 'warning'} />
          </div>

          {/* message box */}
          <motion.section
            initial={{ opacity: 0, x: 26, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className={`relative overflow-hidden rounded-3xl border ${border} bg-[#071021]/95 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]`}
          >
            {/* speech tail */}
            <span className={`absolute -left-3 top-24 hidden h-6 w-6 rotate-45 border-b border-l lg:block ${danger ? 'border-red-400/45' : 'border-amber-400/40'}`} style={{ background: '#071021' }} />

            <div className={`flex items-start gap-3 border-b border-white/10 p-4 sm:p-5 ${danger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
              <CrewAvatar astronaut={astronaut} size={54} alert={danger} />
              <div className="min-w-0 flex-1">
                <p className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] ${accentText}`}>
                  {danger ? <ShieldAlert size={13} /> : <Radio size={13} />}
                  {emergency ? 'Emergency report' : 'Crew report'} · to the Mission Director
                </p>
                <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{issue.title}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  <span className="font-semibold text-sky-200">{astronaut?.name ?? 'Crew'}</span> · {astronaut?.profession ?? 'Astronaut'} · reporting live to the Mission Director
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:max-h-[58vh] lg:overflow-auto">
              <p className="text-[15px] leading-relaxed text-slate-200">{issue.description}</p>

              <div className="mt-3 rounded-xl border border-cyan-500/20 bg-slate-950/55 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Why this matters</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{issue.science}</p>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <AlertTriangle size={14} className={accentText} />
                <p className="text-xs text-slate-300"><span className="font-semibold text-white">Mission Director:</span> every response protects one part of the mission and costs another. Choose fast.</p>
              </div>

              <div className="mt-3 grid gap-2.5">
                {issue.choices.map((choice, index) => {
                  const needsPart = (choice.effects?.spareParts ?? 0) < 0
                  const partMentioned = /spare part/i.test(choice.label)
                  const disabled = needsPart && spareParts <= 0
                  const chips = effectChips(choice)
                  return (
                    <motion.button
                      key={choice.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.05 }}
                      onClick={() => { if (!disabled) onChoose(choice.id) }}
                      disabled={disabled}
                      className={`group w-full rounded-2xl border p-3.5 text-left transition ${disabled
                        ? 'cursor-not-allowed border-white/5 bg-slate-900/20 opacity-55'
                        : danger
                          ? 'border-white/10 bg-slate-950/45 hover:border-red-400/45 hover:bg-red-500/[0.07]'
                          : 'border-white/10 bg-slate-950/45 hover:border-amber-400/45 hover:bg-amber-500/[0.07]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-black ${danger ? 'border-red-400/40 text-red-300' : 'border-amber-400/40 text-amber-300'}`}>{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white">{choice.label}{needsPart && !partMentioned ? ' · needs 1 spare part' : ''}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{choice.consequence}</p>
                          {chips.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {chips.map((chip) => (
                                <span
                                  key={chip.key}
                                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${chip.good
                                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-red-400/30 bg-red-500/10 text-red-300'}`}
                                >
                                  {chip.text}
                                </span>
                              ))}
                            </div>
                          )}
                          {disabled && <p className="mt-1 text-xs text-red-300">No spare parts left — choose another response.</p>}
                        </div>
                        <ArrowRight size={16} className={`mt-1 shrink-0 transition group-hover:translate-x-0.5 ${accentText}`} />
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${emergency ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                {emergency ? 'Mission time is paused until you respond.' : 'Mission time keeps running — respond when ready.'}
              </span>
              <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 transition hover:bg-white/5">Decide later</button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
