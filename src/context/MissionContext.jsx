import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { advanceDay, createMissionState, resolveEmergency, restartMission, toggleEquipment } from '../simulation/missionEngine'

const MissionContext = createContext(null)
const STORAGE_KEY = 'astra-mission-state-v1'

export function MissionProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
  }, [state])

  const api = useMemo(() => ({
    state,
    hasMission: !!state,
    startMission: (missionId, astronautName) => setState(createMissionState(missionId, astronautName)),
    nextDay: () => setState((s) => (s ? advanceDay(s) : s)),
    chooseEmergency: (choiceId) => setState((s) => (s ? resolveEmergency(s, choiceId) : s)),
    toggleEquipment: (id) => setState((s) => (s ? toggleEquipment(s, id) : s)),
    restart: () => setState((s) => (s ? restartMission(s) : s)),
    clearMission: () => setState(null),
  }), [state])

  return <MissionContext.Provider value={api}>{children}</MissionContext.Provider>
}

export function useMissionContext() {
  const ctx = useContext(MissionContext)
  if (!ctx) throw new Error('useMissionContext must be used within MissionProvider')
  return ctx
}
