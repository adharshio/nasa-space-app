import { useEffect, useMemo, useRef, useState } from 'react'
import { advanceDay, tickMission, createMissionState, repairEquipment, resolveEmergency, resolveCrewReport, spawnCrewReport, restartMission, sendOnEva, sendRoverSurvey, toggleEquipment, toggleOptionalLoads, abortRoverMission, setCrewTask, askEarth } from '../simulation/missionEngine'
import { TIME, CREW_REPORT } from '../simulation/config'
import { normalizeLoadedState } from './normalizeMissionState'
import { MissionContext } from './missionContextValue'

const STORAGE_KEY = 'astra-mission-state-v2'
const SAVE_INTERVAL_MS = 1500

function nextReportDelay() {
  return CREW_REPORT.minDelayMs + Math.random() * (CREW_REPORT.maxDelayMs - CREW_REPORT.minDelayMs)
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeLoadedState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function MissionProvider({ children }) {
  const [state, setState] = useState(loadSavedState)
  // 0 = paused. TIME.speeds are the available time-compression levels.
  const [speed, setSpeed] = useState(1)

  const speedRef = useRef(speed)
  const stateRef = useRef(state)
  const lastSaveRef = useRef(0)
  const reportTimerRef = useRef(0)
  const reportDelayRef = useRef(CREW_REPORT.minDelayMs)

  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { stateRef.current = state }, [state])

  // Persist at a sane cadence: the clock updates twice a second, so saving on
  // every render would hammer localStorage. State-changing events still flush.
  useEffect(() => {
    if (!state) {
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      return
    }
    const now = Date.now()
    const eventful = state.phase !== 'active'
    if (!eventful && now - lastSaveRef.current < SAVE_INTERVAL_MS) return
    lastSaveRef.current = now
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore storage errors (quota / privacy mode)
    }
  }, [state])

  // Flush the latest state when the tab closes or is backgrounded.
  useEffect(() => {
    const flush = () => {
      if (!stateRef.current) return
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)) } catch { /* ignore */ }
    }
    const onVisibility = () => { if (document.hidden) flush() }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // The real-time heartbeat. Mission time advances on its own — no "advance
  // day" button. It stops during emergencies (so the commander can decide),
  // while paused, and while the tab is hidden.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return
      const sp = speedRef.current
      if (!sp) return
      const dtSols = ((TIME.tickMs / 1000) * sp) / TIME.secondsPerSol
      setState((s) => {
        if (!s || s.phase !== 'active') return s
        return tickMission(s, dtSols)
      })
    }, TIME.tickMs)
    return () => window.clearInterval(id)
  }, [])

  // Crew-report cadence: every 10–15 real seconds the crew raises a new issue
  // with a clickable warning marker. It never interrupts the simulation.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return
      if (!speedRef.current) return
      const s = stateRef.current
      if (!s || s.phase !== 'active' || s.crewReport) return
      reportTimerRef.current += 1000
      if (reportTimerRef.current < reportDelayRef.current) return
      reportTimerRef.current = 0
      reportDelayRef.current = nextReportDelay()
      setState((prev) => (prev && prev.phase === 'active' && !prev.crewReport ? spawnCrewReport(prev) : prev))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const api = useMemo(() => ({
    state,
    hasMission: !!state,
    solProgress: state?.missionClock ?? 0,
    speed,
    setSpeed: (value) => {
      const v = Number(value)
      setSpeed(v === 0 ? 0 : TIME.speeds.includes(v) ? v : 1)
    },
    togglePause: () => setSpeed((v) => (v === 0 ? 1 : 0)),
    startMission: (missionId, astronautName, difficulty) => {
      lastSaveRef.current = 0
      reportTimerRef.current = 0
      reportDelayRef.current = nextReportDelay()
      setSpeed(1)
      setState(createMissionState(missionId, astronautName, difficulty))
    },
    nextDay: () => setState((s) => (s ? advanceDay(s) : s)),
    chooseEmergency: (choiceId) => setState((s) => (s ? resolveEmergency(s, choiceId) : s)),
    resolveCrewReport: (choiceId) => setState((s) => (s?.crewReport ? resolveCrewReport(s, choiceId) : s)),
    toggleEquipment: (id) => setState((s) => (s ? toggleEquipment(s, id) : s)),
    toggleOptionalLoads: () => setState((s) => (s ? toggleOptionalLoads(s) : s)),
    repairEquipment: (id) => setState((s) => (s ? repairEquipment(s, id) : s)),
    sendRoverSurvey: (actionKey) => setState((s) => (s ? sendRoverSurvey(s, actionKey) : s)),
    sendOnEva: (crewId, actionKey) => setState((s) => (s ? sendOnEva(s, crewId, actionKey) : s)),
    abortRoverMission: () => setState((s) => (s ? abortRoverMission(s) : s)),
    setCrewTask: (crewId, task) => setState((s) => (s ? setCrewTask(s, crewId, task) : s)),
    askEarth: () => setState((s) => (s ? askEarth(s) : s)),
    restart: () => {
      lastSaveRef.current = 0
      reportTimerRef.current = 0
      reportDelayRef.current = nextReportDelay()
      setSpeed(1)
      setState((s) => (s ? restartMission(s) : s))
    },
    clearMission: () => {
      stateRef.current = null
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      setState(null)
    },
  }), [state, speed])

  return <MissionContext.Provider value={api}>{children}</MissionContext.Provider>
}
