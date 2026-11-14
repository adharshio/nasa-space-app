import { AlertTriangle } from 'lucide-react'

export default function EmergencyModal({ emergency, onChoose }) {
  if (!emergency) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full glass rounded-2xl p-5 border border-amber-400/30">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/30"><AlertTriangle className="text-amber-300" /></div>
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-300">Emergency · Day {emergency.day}</p>
            <h2 className="text-2xl font-bold text-white">{emergency.title}</h2>
          </div>
        </div>
        <p className="text-slate-200 mb-2">{emergency.description}</p>
        <div className="rounded-lg bg-slate-900/60 border border-cyan-500/15 p-3 mb-4">
          <p className="text-sm text-cyan-200"><strong>Scientific reason:</strong> {emergency.science}</p>
        </div>
        <p className="text-sm text-slate-300 mb-3">Choose a response. Each option has consequences for mission resources/conditions.</p>
        <div className="grid gap-3">
          {emergency.choices.map((c) => (
            <button key={c.id} onClick={() => onChoose(c.id)} className="text-left p-4 rounded-xl border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/5 transition bg-slate-900/40">
              <div className="font-semibold text-white mb-1">{c.label}</div>
              <div className="text-sm text-slate-300">{c.consequence}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
