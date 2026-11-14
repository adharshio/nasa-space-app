import { moonMission } from '../data/moonMission'
import { marsMission } from '../data/marsMission'
import { defaultEquipmentState } from '../data/equipment'
import { applyDailyResources, applyEffects } from './resourceManager'
import { updateEnvironment } from './environmentManager'
import { generateEmergency } from './eventGenerator'
import { evaluateMission } from './missionEvaluator'
import { clamp } from '../utils/calculations'

export const MISSIONS = { moon: moonMission, mars: marsMission }

export function createMissionState(missionId, astronautName = 'Commander') {
  const mission = MISSIONS[missionId]
  if (!mission) throw new Error('Unknown mission')
  return {
    missionId,
    mission,
    astronautName,
    day: 1,
    phase: 'active', // active | emergency | completed
    astronauts: mission.astronauts,
    resources: structuredClone(mission.initial.resources),
    environment: { ...mission.initial.environment },
    equipment: defaultEquipmentState(),
    pendingEmergency: null,
    log: [
      { day: 1, type: 'info', text: `Mission initialized: ${mission.destination}. Astronaut ${astronautName} in command.` },
    ],
    history: [snapshotHistory(1, mission.initial.resources, mission.initial.environment)],
    stats: { emergenciesEncountered: 0, emergenciesHandled: 0 },
    modifiers: { solarPenalty: 0, solarEfficiencyDelta: 0, radiationOffset: 0, temperatureOffset: 0, equipmentEfficiency: 1, duration: 0 },
    scene: {
      mode: 'nominal', // nominal | shelter | repair | conserve | evacuation | radiation_storm | dust_storm | low_power | leak
      crewOverride: { maya: 'walk', alex: 'walk', samira: 'walk' },
      lastDecision: null,
    },
    result: null,
  }
}

function snapshotHistory(day, resources, environment) {
  return {
    day,
    oxygen: Math.round(resources.oxygen.current),
    water: Math.round(resources.water.current),
    food: Math.round(resources.food.current),
    electricity: Math.round(resources.electricity.current),
    battery: Math.round(resources.battery.current),
    temperature: environment.temperature,
    radiation: environment.radiation,
  }
}

const WALK = { maya: 'walk', alex: 'walk', samira: 'walk' }
const INSIDE = { maya: 'inside', alex: 'inside', samira: 'inside' }
const SHELTER = { maya: 'shelter', alex: 'shelter', samira: 'shelter' }
const REPAIR = { maya: 'repair', alex: 'repair', samira: 'repair' }

const SCENE_RULES = {
  dust_storm: {
    conserve: { mode: 'conserve', crew: INSIDE },
    clean: { mode: 'repair', crew: { maya: 'inside', alex: 'repair', samira: 'inside' } },
    ignore: { mode: 'dust_storm', crew: WALK },
  },
  oxygen_leak: {
    seal: { mode: 'repair', crew: { maya: 'repair', alex: 'repair', samira: 'repair' } },
    reserve: { mode: 'leak', crew: INSIDE },
    delay: { mode: 'leak', crew: WALK },
  },
  water_leak: {
    isolate: { mode: 'repair', crew: { maya: 'repair', alex: 'repair', samira: 'repair' } },
    reroute: { mode: 'repair', crew: { maya: 'inside', alex: 'inside', samira: 'repair' } },
    patch_later: { mode: 'leak', crew: WALK },
  },
  radiation_storm: {
    shelter: { mode: 'shelter', crew: SHELTER },
    limit_eva: { mode: 'radiation_storm', crew: INSIDE },
    continue: { mode: 'radiation_storm', crew: WALK },
  },
  equipment_failure: {
    repair_now: { mode: 'repair', crew: { maya: 'inside', alex: 'repair', samira: 'inside' } },
    workaround: { mode: 'repair', crew: { maya: 'inside', alex: 'inside', samira: 'inside' } },
    defer: { mode: 'leak', crew: WALK },
  },
  extreme_temperature: {
    max_heating: { mode: 'conserve', crew: INSIDE },
    balance: { mode: 'conserve', crew: INSIDE },
    minimum: { mode: 'radiation_storm', crew: INSIDE },
  },
}

export function sceneModeFor(type, choiceId) {
  return SCENE_RULES[type]?.[choiceId]?.mode ?? 'nominal'
}

export function crewOverrideFor(type, choiceId) {
  return SCENE_RULES[type]?.[choiceId]?.crew ?? WALK
}

function pushLog(state, text, type = 'info') {
  state.log = [{ day: state.day, type, text }, ...state.log].slice(0, 80)
}

export function toggleEquipment(state, id) {
  if (state.phase === 'completed') return state
  const next = structuredClone(state)
  next.equipment[id] = !next.equipment[id]
  pushLog(next, `${id} ${next.equipment[id] ? 'enabled' : 'disabled'}.`, 'info')
  return next
}

export function advanceDay(state) {
  if (state.phase !== 'active') return state
  let next = structuredClone(state)

  // Apply daily resource ticks
  const applied = applyDailyResources(next)
  next.resources = applied.resources

  // Update environment/modifiers
  const envUpdate = updateEnvironment(next)
  next.environment = envUpdate.environment
  next.modifiers = envUpdate.modifiers

  // Radiation exposure impact: high radiation without shelter harms oxygen reserve proxy/crew conditions
  let radImpact = 0
  if (next.environment.radiation > 35) radImpact = next.equipment.radiationShelter ? 1 : 4
  else if (next.environment.radiation > 25) radImpact = next.equipment.radiationShelter ? 0.5 : 2
  if (radImpact > 0) {
    next.resources.oxygen.current = clamp(next.resources.oxygen.current - radImpact, 0, next.resources.oxygen.max)
    pushLog(next, `Radiation exposure impacted habitat systems (-${radImpact.toFixed(1)} oxygen).`, 'warning')
  }

  next.day += 1
  pushLog(next, `Day ${next.day - 1} complete. Net power ${applied.rates.electricityNet >= 0 ? '+' : ''}${applied.rates.electricityNet.toFixed(1)} units.`, 'info')
  next.history = [...next.history, snapshotHistory(next.day, next.resources, next.environment)].slice(-40)

  // Check failure after day
  const failureCheck = evaluateMission({ ...next, day: next.day - 1 })
  if (failureCheck.status === 'failure' && (next.resources.oxygen.current <= 0 || next.resources.water.current <= 0 || next.resources.food.current <= 0 || (next.resources.electricity.current <= 0 && next.resources.battery.current <= 0))) {
    next.phase = 'completed'
    next.result = evaluateMission(next, { forcedFailure: failureCheck.reason })
    pushLog(next, next.result.reason, 'danger')
    return next
  }

  // Mission success at duration
  if (next.day > next.mission.durationDays) {
    next.phase = 'completed'
    next.result = evaluateMission({ ...next, day: next.mission.durationDays })
    pushLog(next, next.result.reason, next.result.status === 'success' ? 'success' : 'danger')
    return next
  }

  // Generate emergency for new day
  const emergency = generateEmergency(next)
  if (emergency) {
    next.pendingEmergency = emergency
    next.phase = 'emergency'
    next.stats.emergenciesEncountered += 1
    pushLog(next, `Emergency: ${emergency.title}. Immediate decision required.`, 'danger')
  }

  return next
}

export function resolveEmergency(state, choiceId) {
  if (!state.pendingEmergency) return state
  const next = structuredClone(state)
  const emergency = next.pendingEmergency
  const choice = emergency.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  let resources = next.resources
  let environment = next.environment
  const applied = applyEffects(next, choice.effects)
  resources = applied.resources
  environment = applied.environment

  // apply special modifiers
  if (choice.effects.solarEfficiencyDelta) {
    environment.solarEfficiency = clamp(environment.solarEfficiency + choice.effects.solarEfficiencyDelta, 20, 100)
    next.modifiers.solarEfficiencyDelta = (next.modifiers.solarEfficiencyDelta || 0) + choice.effects.solarEfficiencyDelta
  }
  if (choice.effects.duration) next.modifiers.duration = Math.max(next.modifiers.duration || 0, choice.effects.duration)
  if (choice.effects.equipmentBoost === 1) next.modifiers.equipmentEfficiency = 1.05
  if (choice.effects.equipmentBoost === -1) next.modifiers.equipmentEfficiency = 0.9

  // Map emergency response to surface-scene crew behavior and mode
  next.scene = {
    mode: sceneModeFor(emergency.type, choice.id),
    crewOverride: crewOverrideFor(emergency.type, choice.id),
    lastDecision: { type: emergency.type, choiceId: choice.id, title: emergency.title, label: choice.label },
  }

  next.resources = resources
  next.environment = environment

  // rudimentary handling assessment
  const harmful = ['delay', 'patch_later', 'ignore', 'continue', 'defer', 'minimum']
  if (!harmful.includes(choice.id)) next.stats.emergenciesHandled += 1

  pushLog(next, `Emergency response (${emergency.title}): ${choice.label}. ${choice.consequence}`, harmful.includes(choice.id) ? 'warning' : 'success')
  next.pendingEmergency = null
  next.phase = 'active'

  // failure check post-decision
  if (next.resources.oxygen.current <= 0 || next.resources.water.current <= 0 || next.resources.food.current <= 0 || (next.resources.electricity.current <= 0 && next.resources.battery.current <= 0)) {
    next.phase = 'completed'
    next.result = evaluateMission(next)
    pushLog(next, next.result.reason, 'danger')
  }

  return next
}

export function restartMission(state) {
  return createMissionState(state.missionId, state.astronautName)
}
