import { Pause, Play, Clock3, Gauge } from 'lucide-react'
import { TIME, solClockLabel, timeCompressionLabel } from '../simulation/config'

export default function MissionClock({
  day = 1,
  missionLength = 30,
  solProgress = 0,
  speed = 1,
  setSpeed = () => {},
  phase = 'active',
}) {
  const fraction = Math.max(0, Math.min(0.9999, solProgress))
  const running = speed > 0 && phase === 'active'
  const clock = solClockLabel(fraction)
  const missionPct = Math.max(0, Math.min(100, (((day - 1) + fraction) / Math.max(1, missionLength)) * 100))
  const solPct = Math.round(fraction * 100)
  const emergency = phase === 'emergency'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#060d1c]/85 px-4 py-3.5 shadow-[0_18px_50px_-20px_rgba(14,165,233,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(56,189,248,0.16),transparent_45%),radial-gradient(120%_120%_at_100%_100%,rgba(129,140,248,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#7dd3fc_1px,transparent_1px),linear-gradient(to_bottom,#7dd3fc_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 min-w-[210px]">
          <div className={`grid h-12 w-12 place-items-center rounded-xl border ${emergency ? 'border-amber-400/50 bg-amber-500/15 text-amber-300' : running ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-sky-400/30 bg-sky-500/10 text-sky-300'}`}>
            <Clock3 size={22} />
          </div>
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-300/80">
              <span className={`h-1.5 w-1.5 rounded-full ${emergency ? 'bg-amber-400' : running ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
              {emergency ? 'Awaiting decision' : running ? 'Mission time running' : 'Mission time paused'}
            </p>
            <p className="mt-0.5 font-mono text-3xl font-bold leading-none text-white tabular-nums">
              SOL {String(Math.min(day, missionLength)).padStart(2, '0')}
              <span className="ml-2 text-sm font-medium text-slate-400">/ {missionLength}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Local Sol time</p>
            <p className="font-mono text-2xl font-semibold leading-none text-cyan-200 tabular-nums">{clock}</p>
          </div>
          <div className="h-9 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Sol progress</p>
            <p className="font-mono text-2xl font-semibold leading-none text-white tabular-nums">{solPct}%</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSpeed(speed === 0 ? 1 : 0)}
            disabled={phase === 'completed'}
            title={speed === 0 ? 'Resume mission time' : 'Pause mission time'}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 ${running ? 'border border-sky-400/30 text-sky-100 hover:bg-sky-500/10' : 'bg-sky-500 text-slate-950 hover:bg-sky-400'}`}
          >
            {speed === 0 ? <Play size={15} /> : <Pause size={15} />}
            {speed === 0 ? 'Resume' : 'Pause'}
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/60 p-1" role="group" aria-label="Simulation speed">
            {TIME.speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                disabled={phase === 'completed'}
                aria-pressed={speed === s}
                className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-40 ${speed === s ? 'bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.4)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 transition-[width] duration-500"
            style={{ width: `${Math.max(1.5, missionPct)}%` }}
          >
            <span className="absolute inset-y-0 right-0 w-6 bg-white/40 blur-[6px]" />
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5"><Gauge size={12} className="text-cyan-300" /> Time compression · {timeCompressionLabel(speed || 1)} · 1 Sol = {TIME.secondsPerSol}s</span>
          <span>Mission progress {missionPct.toFixed(0)}% · auto-saves</span>
        </div>
      </div>
    </div>
  )
}
