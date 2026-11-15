import { Wrench, FlaskConical, Mountain } from 'lucide-react'

const ROLE_ICON = { Engineer: Wrench, Scientist: FlaskConical, Geologist: Mountain }

export default function CrewAvatar({ astronaut, size = 44, alert = false, className = '' }) {
  if (!astronaut) return null
  const initials = astronaut.name.split(' ').map((p) => p[0]).join('')
  const Icon = ROLE_ICON[astronaut.profession] ?? Wrench
  const ring = alert ? 'ring-2 ring-red-400/70 shadow-[0_0_18px_rgba(248,113,113,0.45)]' : 'ring-1 ring-white/15'
  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-full font-black text-slate-950 ${ring} ${className}`}
      style={{ width: size, height: size, background: astronaut.color, fontSize: size * 0.32 }}
      aria-hidden="true"
    >
      {initials}
      <span className="absolute -bottom-1 -right-1 grid h-[55%] w-[55%] place-items-center rounded-full border-2 border-[#060d1c] bg-slate-900 text-sky-300">
        <Icon size={Math.max(9, size * 0.23)} />
      </span>
      {alert && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-red-400" />}
    </div>
  )
}
