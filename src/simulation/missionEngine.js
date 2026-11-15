import { moonMission } from '../data/moonMission'
import { marsMission } from '../data/marsMission'
import { defaultEquipmentState, DEFAULT_SPARE_PARTS } from '../data/equipment'
import { crewReportTemplates } from '../data/crewReports'
import {
  MISSION_DURATION_DAYS,
  DIFFICULTIES,
  getPhaseForDay,
  SAFE_RANGES,
  EQUIPMENT_CONDITION,
  CREW,
  mulberry32,
  makeSeed,
  conditionEfficiency,
  CREW_ROLES,
  EXPLORATION,
  RADIATION_DOSE,
} from './config'
import { applyResources, applyEffects, getDailyRates, powerAvailability } from './resourceManager'
import { evaluateMission } from './missionEvaluator'
import { clamp } from '../utils/calculations'

export const MISSIONS = { moon: moonMission, mars: marsMission }

function makeCrewMember(role) {
  return {
    id: role.id,
    name: role.id === 'maya' ? 'Maya Lin' : role.id === 'alex' ? 'Alex Rivera' : 'Samira Khan',
    profession: role.profession,
    color: role.color,
    health: 100,
    fatigue: 10,
    stress: 15,
    hydration: 88,
    nutrition: 92,
    radiationDose: 0,
    status: 'active', // active | incapacitated | lost
    task: role.profession === 'Engineer' ? 'Habitat inspection' : role.profession === 'Scientist' ? 'Scientific research' : 'Rover operation',
  }
}

export function createMissionState(missionId, astronautName = 'Commander', difficulty = 'survival') {
  const mission = MISSIONS[missionId]
  if (!mission) throw new Error('Unknown mission')
  const diff = DIFFICULTIES[difficulty] ?? DIFFICULTIES.survival
  const seed = makeSeed()
  const supply = diff.supplyMultiplier
  const missionLength = diff.durationDays ?? MISSION_DURATION_DAYS
  const initial = mission.initial.resources
  const startResources = {
    oxygen: { current: Math.round(initial.oxygen.current * supply), max: Math.round(initial.oxygen.max * supply) },
    water: { current: Math.round(initial.water.current * supply), max: Math.round(initial.water.max * supply) },
    food: { current: Math.round(initial.food.current * supply), max: Math.round(initial.food.max * supply) },
    electricity: { current: Math.round(initial.electricity.current * supply), max: Math.round(initial.electricity.max * supply) },
    battery: { current: initial.battery.current, max: initial.battery.max },
    spareParts: DEFAULT_SPARE_PARTS,
    waste: { current: 4, max: 30 },
  }

  return finishNewState({
    schemaVersion: 3,
    missionId,
    missionLength,
    mission,
    astronautName,
    difficulty,
    seed,
    day: 1,
    missionClock: 0,
    phase: 'active', // active | emergency | completed
    astronauts: CREW_ROLES.map(makeCrewMember),
    resources: startResources,
    atmosphere: { oxygenConc: 20.9, co2Ppm: 520, pressure: 101.3, humidity: 42 },
    environment: {
      temperature: 21,
      outsideTemp: mission.initial.environment.temperature,
      radiation: mission.initial.environment.radiation,
      solarEfficiency: mission.initial.environment.solarEfficiency,
      sunlight: mission.initial.environment.sunlight,
    },
    equipment: defaultEquipmentState(),
    equipmentCondition: {
      oxygenRecycler: EQUIPMENT_CONDITION.start,
      co2Scrubber: EQUIPMENT_CONDITION.start,
      waterRecycler: EQUIPMENT_CONDITION.start,
      wasteProcessor: EQUIPMENT_CONDITION.start,
      greenhouse: EQUIPMENT_CONDITION.start,
      solarPower: EQUIPMENT_CONDITION.start,
      heating: EQUIPMENT_CONDITION.start,
      radiationShelter: EQUIPMENT_CONDITION.start,
      rover: 90,
      spacesuit: 92,
    },
    greenhouseGrowth: 0, // Sols of growth completed (0..3) before harvest
    optionalLoads: true, // science, comms & lighting — can be shed to protect power
    pendingEmergency: null,
    crewReport: null,   // { id, type, title, description, choices, astronautId, station, severity }
    reportSeq: 0,       // increments so reports stay reproducible-ish and unique
    roverMission: null, // { actionKey, dayStarted, daysRemaining, aborted }
    firedStorms: [],   // archived DONKI storm Sols already triggered this run
    earthRequest: null, // { delayMin, answerDay, topic } — Mars only (4–24 min one-way)
    earthAnswer: null,  // { day, topic, title, text } — revealed when the delayed reply arrives
    lastCycleSummary: null,
    log: [
      { day: 1, type: 'info', text: `Mission initialized: ${mission.destination}. Commander ${astronautName} in command. Difficulty: ${diff.label}.` },
      { day: 1, type: 'info', text: 'ASTRA guidance: survival is the mission. Watch oxygen, CO2, water, food and power every Sol.' },
    ],
    history: [snapshotHistory(1, startResources, mission.initial.environment, null)],
    stats: {
      emergenciesEncountered: 0,
      emergenciesHandled: 0,
      reportsHandled: 0,
      scientificPoints: 0,
      roverTrips: 0,
      evas: 0,
      iceExtractedKg: 0,
    },
    scene: {
      mode: 'nominal',
      crewOverride: null,
      lastDecision: null,
    },
    rates: null,
    result: null,
  })
}

// Sol-start snapshot: lets the real-time clock report "what changed this Sol".
function snapshotSolStart(resources, atmosphere, environment) {
  return {
    oxygen: resources.oxygen.current,
    water: resources.water.current,
    food: resources.food.current,
    electricity: resources.electricity.current,
    battery: resources.battery.current,
    co2Ppm: atmosphere?.co2Ppm ?? 0,
    pressure: atmosphere?.pressure ?? 101.3,
    temperature: environment?.temperature ?? 21,
    radiation: environment?.radiation ?? 0,
    waste: resources.waste?.current ?? 0,
  }
}

function finishNewState(state) {
  state.solStart = snapshotSolStart(state.resources, state.atmosphere, state.environment)
  return state
}

function snapshotHistory(day, resources, environment, atmosphere) {
  return {
    day,
    oxygen: Math.round(resources.oxygen.current),
    water: Math.round(resources.water.current),
    food: Math.round(resources.food.current),
    electricity: Math.round(resources.electricity.current),
    battery: Math.round(resources.battery.current),
    temperature: environment.temperature,
    radiation: environment.radiation,
    co2Ppm: atmosphere?.co2Ppm,
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
  co2_scrubber_failure: {
    backup: { mode: 'repair', crew: { maya: 'repair', samira: 'repair', alex: 'inside' } },
    repair: { mode: 'repair', crew: REPAIR },
    ignore: { mode: 'leak', crew: WALK },
  },
  water_contamination: {
    purify: { mode: 'repair', crew: { maya: 'inside', alex: 'inside', samira: 'repair' } },
    reserve: { mode: 'leak', crew: INSIDE },
    ignore: { mode: 'leak', crew: WALK },
  },
  power_failure: {
    backup_power: { mode: 'conserve', crew: INSIDE },
    priority_life_support: { mode: 'conserve', crew: INSIDE },
    ignore: { mode: 'leak', crew: WALK },
  },
  medical_emergency: {
    stabilize: { mode: 'inside', crew: { maya: 'inside', alex: 'inside', samira: 'inside' } },
    monitor: { mode: 'inside', crew: INSIDE },
    ignore: { mode: 'leak', crew: WALK },
  },
  fire_smoke: {
    evacuate: { mode: 'conserve', crew: INSIDE },
    isolate: { mode: 'repair', crew: REPAIR },
    ignore: { mode: 'leak', crew: WALK },
  },
  spacesuit_failure: {
    emergency_return: { mode: 'radiation_storm', crew: WALK },
    repair_suit: { mode: 'repair', crew: REPAIR },
    ignore: { mode: 'leak', crew: WALK },
  },
  solar_storm: {
    shelter: { mode: 'shelter', crew: SHELTER },
    monitor: { mode: 'radiation_storm', crew: INSIDE },
    continue: { mode: 'radiation_storm', crew: WALK },
  },
}

export function sceneModeFor(type, choiceId) {
  return SCENE_RULES[type]?.[choiceId]?.mode ?? 'nominal'
}
export function crewOverrideFor(type, choiceId) {
  return SCENE_RULES[type]?.[choiceId]?.crew ?? WALK
}

// --- Crew issues: which astronaut reports them, where the warning marker sits
// on the base scene, and how urgent they are.
const ISSUE_REPORTER = {
  equipment_failure: 'maya',
  power_failure: 'maya',
  oxygen_leak: 'maya',
  fire_smoke: 'maya',
  co2_scrubber_failure: 'maya',
  extreme_temperature: 'maya',
  water_leak: 'alex',
  water_contamination: 'alex',
  medical_emergency: 'alex',
  dust_storm: 'samira',
  spacesuit_failure: 'samira',
  radiation_storm: 'samira',
  solar_storm: 'samira',
}

const ISSUE_STATION = {
  dust_storm: 'solar',
  power_failure: 'solar',
  solar_storm: 'solar',
  oxygen_leak: 'habitat',
  medical_emergency: 'habitat',
  co2_scrubber_failure: 'habitat',
  extreme_temperature: 'habitat',
  equipment_failure: 'lab',
  water_leak: 'lab',
  water_contamination: 'lab',
  fire_smoke: 'lab',
  radiation_storm: 'vault',
  spacesuit_failure: 'rover',
}

const ISSUE_SEVERITY = {
  oxygen_leak: 'danger',
  fire_smoke: 'danger',
  medical_emergency: 'danger',
  spacesuit_failure: 'danger',
  radiation_storm: 'danger',
  solar_storm: 'danger',
}

export function issueMetaFor(type, fallbackReporter = 'maya') {
  const reporterId = ISSUE_REPORTER[type] ?? fallbackReporter
  return {
    reporterId,
    astronautId: reporterId,
    station: ISSUE_STATION[type] ?? 'lab',
    severity: ISSUE_SEVERITY[type] ?? 'warning',
  }
}

function annotateIssue(template, extraReporter) {
  const meta = issueMetaFor(template.type)
  const reporterId = extraReporter ?? meta.reporterId
  return { ...template, ...meta, reporterId, astronautId: reporterId }
}

function buildWarnings(state) {
  const warnings = []
  const { resources, atmosphere, environment, equipmentCondition } = state
  const o2Frac = resources.oxygen.current / resources.oxygen.max
  const waterFrac = resources.water.current / resources.water.max
  const foodFrac = resources.food.current / resources.food.max
  const maxDose = Math.max(0, ...(state.astronauts ?? []).map((c) => c.radiationDose ?? 0))
  if (o2Frac < 0.25) warnings.push({ level: 'danger', text: 'Oxygen reserve critically low — isolate leaks, check recycler and scrubber.' })
  else if (o2Frac < 0.45) warnings.push({ level: 'warning', text: 'Oxygen reserves below 45% — start conserving before the next Sol.' })
  if (atmosphere.co2Ppm > 2500) warnings.push({ level: 'danger', text: `CO2 at ${Math.round(atmosphere.co2Ppm)} ppm — crew health degrading. Repair or back up the scrubber.` })
  else if (atmosphere.co2Ppm > 1500) warnings.push({ level: 'warning', text: `CO2 elevated (${Math.round(atmosphere.co2Ppm)} ppm) — scrubber performance is slipping.` })
  if (atmosphere.pressure < 95) warnings.push({ level: 'warning', text: 'Cabin pressure below safe range — check for leaks and reserve supply.' })
  if (waterFrac < 0.25) warnings.push({ level: 'warning', text: 'Water reserves low — throttle greenhouse use and protect recovery.' })
  if (foodFrac < 0.25) warnings.push({ level: 'warning', text: 'Food stocks low — greenhouse output and consumption must balance.' })
  if (resources.battery.current < 20) warnings.push({ level: 'warning', text: 'Battery almost drained — solar shortage incoming, shed optional loads.' })
  if (maxDose > RADIATION_DOSE.danger) warnings.push({ level: 'danger', text: `Cumulative radiation dose ${Math.round(maxDose)} — crew health is degrading. Shelter and limit EVA.` })
  else if (maxDose > RADIATION_DOSE.warn) warnings.push({ level: 'warning', text: `Cumulative radiation dose ${Math.round(maxDose)} — reduce exposure and use the shelter.` })
  if (environment.radiation > 35) warnings.push({ level: 'warning', text: 'Radiation high — crew should shelter; limit EVA and exterior work.' })
  if (resources.spareParts <= 1) warnings.push({ level: 'warning', text: `Only ${resources.spareParts} spare part(s) left — repairs will become impossible.` })
  for (const [key, cond] of Object.entries(equipmentCondition ?? {})) {
    if (cond < 25 && key !== 'rover' && key !== 'spacesuit') warnings.push({ level: 'warning', text: `${key} condition critical (${Math.round(cond)}%) — repair soon.` })
  }
  return warnings
}

function pushLog(state, text, type = 'info') {
  state.log = [{ day: state.day, type, text }, ...state.log].slice(0, 80)
}

export function toggleEquipment(state, id) {
  if (state.phase === 'completed') return state
  const next = structuredClone(state)
  next.equipment[id] = !next.equipment[id]
  const names = { oxygenRecycler: 'Oxygen recycling', co2Scrubber: 'CO2 scrubber', waterRecycler: 'Water recovery', wasteProcessor: 'Waste processor', greenhouse: 'Hydroponic greenhouse', solarPower: 'Solar power', heating: 'Heating/thermal control', radiationShelter: 'Radiation shelter' }
  pushLog(next, `${names[id] ?? id} ${next.equipment[id] ? 'enabled' : 'disabled'}.`, 'info')
  return next
}

export function toggleOptionalLoads(state) {
  if (state.phase === 'completed') return state
  const next = structuredClone(state)
  next.optionalLoads = next.optionalLoads === false
  pushLog(next, next.optionalLoads
    ? 'Optional loads enabled: science, comms and lighting draw 10 power/day.'
    : 'Optional loads shed: science, comms and lighting are off, saving 10 power/day. Research pauses.', 'info')
  return next
}

export function repairEquipment(state, id) {
  if (state.phase === 'completed') return state
  const next = structuredClone(state)
  const condition = next.equipmentCondition?.[id] ?? 100
  if (condition >= 90) { pushLog(next, `${id} is already in good condition.`, 'info'); return next }
  if (next.resources.spareParts <= 0) { pushLog(next, `Cannot repair ${id}: no spare parts left.`, 'warning'); return next }
  next.resources.spareParts -= EQUIPMENT_CONDITION.repairPartsCost
  next.equipmentCondition[id] = 100
  pushLog(next, `Repaired ${id} using 1 spare part. Condition restored to 100%.`, 'success')
  return next
}

export function sendRoverSurvey(state, actionKey = 'roverSurvey') {
  if (state.phase !== 'active') return state
  if (state.roverMission) {
    const busy = structuredClone(state)
    pushLog(busy, 'Rover is already away — recall it before launching another sortie.', 'warning')
    return busy
  }
  const action = EXPLORATION[actionKey]
  if (!action || (action.appliesTo && action.appliesTo !== state.missionId)) return state
  const next = structuredClone(state)
  const batteryCost = action.batteryCost
  if (next.resources.battery.current < batteryCost) { pushLog(next, 'Rover cannot deploy: insufficient battery charge.', 'warning'); return next }
  if (next.resources.electricity.current < action.electricityCost) { pushLog(next, 'Rover cannot deploy: insufficient electrical power.', 'warning'); return next }
  next.resources.battery.current = clamp(next.resources.battery.current - batteryCost, 0, next.resources.battery.max)
  next.resources.electricity.current = clamp(next.resources.electricity.current - action.electricityCost, 0, next.resources.electricity.max)
  next.stats.roverTrips += 1
  next.roverMission = { actionKey, dayStarted: next.day, daysRemaining: 2, aborted: false }
  next.equipmentCondition.rover = clamp(next.equipmentCondition.rover - 1, 5, 100)
  for (const c of next.astronauts) if (c.task === 'Rover operation') c.radiationDose += action.radiation * 0.5
  pushLog(next, `Rover launching: "${action.label}". Expected back in ~2 Sols. Battery −${batteryCost}, power −${action.electricityCost}.`, 'success')
  return next
}

export const CREW_TASKS = ['Habitat inspection', 'Equipment repair', 'Solar array maintenance', 'Greenhouse monitoring', 'Scientific research', 'Rover operation', 'Medical monitoring', 'Rest']

export function setCrewTask(state, crewId, task) {
  if (state.phase === 'completed') return state
  if (!CREW_TASKS.includes(task)) return state
  const next = structuredClone(state)
  const crew = next.astronauts.find((a) => a.id === crewId)
  if (!crew) return state
  crew.task = task
  pushLog(next, `${crew.name.split(' ')[0]} assigned to: ${task}.`, 'info')
  return next
}

function resolveRoverMission(next) {
  const mission = next.roverMission
  if (!mission) return
  const action = EXPLORATION[mission.actionKey] ?? EXPLORATION.roverSurvey
  const rng = mulberry32(next.seed + next.day * 2654435761 + next.stats.roverTrips * 97)
  const roll = rng()
  const scientistActive = next.astronauts.some((a) => a.profession === 'Scientist' && a.status === 'active')
  const geologistActive = next.astronauts.some((a) => a.profession === 'Geologist' && a.status === 'active')
  const scienceTarget = scientistActive ? 2 : 1
  const geoTarget = geologistActive ? 1.3 : 1
  let science = Math.round(action.baseScience * scienceTarget * (0.75 + roll * 0.6) * geoTarget)
  if (mission.aborted) science = Math.round(science * 0.55)
  next.stats.scientificPoints += science
  let found = ''
  const iceChance = geologistActive ? 0.25 : 0.35
  if (!mission.aborted && action.waterReward && roll > iceChance) {
    const before = next.resources.water.current
    next.resources.water.current = clamp(before + action.waterReward, 0, next.resources.water.max)
    const gained = Math.round(next.resources.water.current - before)
    next.stats.iceExtractedKg += gained
    found = ` Drill confirmed water ice — ${gained} L processed into potable water.`
  } else if (roll > 0.62) {
    found = ' High-value samples returned to the science queue.'
  } else {
    found = ' Limited findings returned.'
  }
  pushLog(next, `Rover returned: +${science} science points.${found}${mission.aborted ? ' (mission cut short)' : ''}`, mission.aborted ? 'warning' : 'success')
  next.roverMission = null
}

export function abortRoverMission(state) {
  if (!state.roverMission) return state
  const next = structuredClone(state)
  if (next.roverMission.aborted) return next
  next.roverMission.daysRemaining = Math.min(next.roverMission.daysRemaining, 1)
  next.roverMission.aborted = true
  const recallCost = 8
  next.resources.battery.current = clamp(next.resources.battery.current - recallCost, 0, next.resources.battery.max)
  pushLog(next, `Recall signal sent. Rover returning now (emergency recall −${recallCost} battery).`, 'warning')
  return next
}

export function sendOnEva(state, astronautId, actionKey = 'geologicalSample') {
  if (state.phase !== 'active') return state
  const action = EXPLORATION[actionKey] ?? EXPLORATION.geologicalSample
  const next = structuredClone(state)
  const crew = next.astronauts.find((a) => a.id === astronautId)
  if (!crew) return state
  if (crew.status !== 'active') {
    pushLog(next, `EVA aborted: ${crew.name} is not fit for surface operations.`, 'warning')
    return next
  }
  const suit = next.equipmentCondition.spacesuit ?? 90
  if (suit < 40) { pushLog(next, 'EVA aborted: spacesuit integrity too low. Inspect or repair suit systems.', 'warning'); return next }
  if (next.resources.oxygen.current < 12) { pushLog(next, 'EVA aborted: insufficient oxygen reserve.', 'warning'); return next }
  if (next.resources.battery.current < action.batteryCost) { pushLog(next, 'EVA aborted: insufficient battery.', 'warning'); return next }
  const rng = mulberry32(next.seed + next.day * 40503 + (crew.id === 'maya' ? 11 : crew.id === 'alex' ? 22 : 33))
  next.resources.oxygen.current = clamp(next.resources.oxygen.current - 12, 0, next.resources.oxygen.max)
  next.resources.battery.current = clamp(next.resources.battery.current - action.batteryCost, 0, next.resources.battery.max)
  next.resources.electricity.current = clamp(next.resources.electricity.current - action.electricityCost, 0, next.resources.electricity.max)
  next.stats.evas += 1
  const geoMult = crew.profession === 'Geologist' ? 1.5 : crew.profession === 'Engineer' ? 0.9 : 1
  const science = Math.round(action.baseScience * geoMult * (0.7 + rng() * 0.7))
  next.stats.scientificPoints += science
  crew.fatigue = clamp(crew.fatigue + action.fatigue, 0, 100)
  crew.radiationDose += action.radiation + 2
  crew.stress = clamp(crew.stress + 6, 0, 100)
  next.equipmentCondition.spacesuit = clamp(suit - 4 - rng() * 8, 5, 100)
  if (rng() > 0.88 - (next.missionId === 'mars' ? 0.06 : 0.03)) {
    next.pendingEmergency = {
      id: `spacesuit_failure-${next.day}-${Math.floor(rng() * 1000)}`,
      day: next.day,
      type: 'spacesuit_failure',
      ...issueMetaFor('spacesuit_failure'),
      reporterId: crew.id,
      astronautId: crew.id,
      title: 'Spacesuit Failure',
      description: `${crew.name}'s suit reports a malfunction during the EVA. Oxygen status and mobility are compromised.`,
      science: 'Spacesuits are life-support systems in themselves. A suit failure threatens oxygen supply, thermal control and communication.',
      appliesTo: ['moon', 'mars'],
      choices: [
        { id: 'emergency_return', label: 'Abort EVA and return to airlock', consequence: 'Protect crew immediately. Save suit and life. Cost: return now, small loss of EVA science.', effects: { oxygen: -6, electricity: -12, healthDelta: -2 } },
        { id: 'repair_suit', label: 'Attempt on-task suit repair', consequence: 'Protect science return. Risk continued exposure. Cost: 1 spare part; suit condition improves if repaired.', effects: { spareParts: -1, electricity: -8, healthDelta: -6, radiation: 2 } },
        { id: 'ignore', label: 'Push on despite warnings', consequence: 'Protect nothing. Cost: high risk — oxygen, radiation and health penalties.', effects: { oxygen: -14, radiation: 6, healthDelta: -14, stressDelta: 18 } },
      ],
    }
    next.phase = 'emergency'
    next.stats.emergenciesEncountered += 1
    pushLog(next, `EMERGENCY: ${crew.name}'s spacesuit malfunctioned during EVA!`, 'danger')
    return next
  }
  pushLog(next, `EVA by ${crew.name} complete: +${science} science points. Crew returned safely.`, 'success')
  return next
}

function refreshCrewStatus(c) {
  if (c.health <= 0) c.status = 'lost'
  else if (c.health < 35) c.status = 'incapacitated'
  else c.status = 'active'
}

// Exponential approach that stays correct for partial-Sol ticks.
function approach(current, target, ratePerSol, dt) {
  if (dt <= 0 || ratePerSol <= 0) return current
  if (ratePerSol >= 1) return target
  return current + (target - current) * (1 - Math.pow(1 - ratePerSol, dt))
}

function applyAtmosphereAndCrew(next, dt = 1) {
  const a = next.atmosphere
  const r = next.resources
  const e = next.equipment
  const diff = DIFFICULTIES[next.difficulty] ?? DIFFICULTIES.survival
  const power = powerAvailability(next)

  // --- Oxygen concentration ---
  // Generation/recycling needs power. Without power, cabin O2 slowly falls.
  const oxyEff = conditionEfficiency(next.equipmentCondition.oxygenRecycler)
  const oxyPowered = e.oxygenRecycler && power.hasPower
  const o2Target = oxyPowered ? 21 : 15
  const o2Rate = (oxyPowered ? 1.3 * (power.reserveLow ? 0.7 : 1) : -2.2) * oxyEff
  const o2Step = Math.min(Math.abs(o2Target - a.oxygenConc), Math.abs(o2Rate) * dt)
  a.oxygenConc = clamp(a.oxygenConc + Math.sign(o2Target - a.oxygenConc) * o2Step, 10, 24)

  // --- CO2 concentration ---
  // CO2 accumulates from respiration; scrubber removes it only while powered.
  const co2Gen = 3.1 * next.astronauts.length // ppm per day-ish baseline drift
  const scrubEff = conditionEfficiency(next.equipmentCondition.co2Scrubber)
  const scrub = e.co2Scrubber && power.hasPower ? 1150 * scrubEff * (power.reserveLow ? 0.6 : 1) : 0
  const co2Delta = co2Gen - (scrub > 0 ? co2Gen * (1 + scrub / 500) : -900)
  a.co2Ppm = clamp(a.co2Ppm + co2Delta * dt, 350, 5000)

  // --- Pressure ---
  const pressureLeak = next.modifiers?.pressureLeak ?? 0
  a.pressure = clamp(approach(a.pressure, 100.5, 0.06, dt) - pressureLeak * dt, 80, 108)

  // --- Humidity drift ---
  const humShift = (e.greenhouse ? 1.5 : 0) + (e.wasteProcessor ? 0 : 4) - (e.heating && power.hasPower ? 0.5 : 0)
  a.humidity = clamp(a.humidity + humShift * dt, 15, 80)

  // --- Waste accumulation ---
  next.resources.waste.current = clamp(
    next.resources.waste.current + (0.9 * next.astronauts.length * diff.consumptionMultiplier - (e.wasteProcessor && power.hasPower ? 2.2 : 0)) * dt,
    0,
    next.resources.waste.max,
  )

  // --- Equipment degradation ---
  const wear = EQUIPMENT_CONDITION.dailyWear + (next.environment.radiation > 30 ? 0.4 : 0)
  for (const key of Object.keys(next.equipmentCondition)) {
    next.equipmentCondition[key] = clamp(next.equipmentCondition[key] - wear * (key === 'rover' || key === 'spacesuit' ? 0.6 : 1) * dt, 5, 100)
  }

  // --- Crew physiology ---
  const highWaste = next.resources.waste.current > 22
  for (const c of next.astronauts) {
    if (c.status === 'lost') continue
    // hydration & nutrition — restored while supplies are available (crew drink/eat from reserves)
    if (r.water.current > 25) c.hydration = approach(c.hydration, 95, 0.22, dt)
    else if (r.water.current > 8) c.hydration = clamp(c.hydration - 5 * diff.consumptionMultiplier * dt, 0, 100)
    else c.hydration = clamp(c.hydration - 10 * diff.consumptionMultiplier * dt, 0, 100)
    if (r.food.current > 25) c.nutrition = approach(c.nutrition, 95, 0.22, dt)
    else if (r.food.current > 8) c.nutrition = clamp(c.nutrition - 4.5 * diff.consumptionMultiplier * dt, 0, 100)
    else c.nutrition = clamp(c.nutrition - 9 * diff.consumptionMultiplier * dt, 0, 100)
    let healthDelta = 1.2 // natural recovery when conditions are fine
    if (r.water.current <= 5) healthDelta -= 6
    if (r.food.current <= 5) healthDelta -= 5
    // atmosphere
    if (a.oxygenConc < SAFE_RANGES.oxygenConc.low) healthDelta -= (SAFE_RANGES.oxygenConc.low - a.oxygenConc) * 2.2
    if (a.oxygenConc > SAFE_RANGES.oxygenConc.high) healthDelta -= (a.oxygenConc - SAFE_RANGES.oxygenConc.high) * 1.0
    if (a.co2Ppm > SAFE_RANGES.co2Ppm.warn) healthDelta -= ((a.co2Ppm - SAFE_RANGES.co2Ppm.warn) / 1000) * 2.4
    if (a.co2Ppm > SAFE_RANGES.co2Ppm.danger) healthDelta -= 8
    if (a.pressure < SAFE_RANGES.pressure.low || a.pressure > SAFE_RANGES.pressure.high) healthDelta -= 4
    // humidity: very dry or very damp cabin air hurts the crew
    if (a.humidity > 65) healthDelta -= 1.2
    if (a.humidity < 22) healthDelta -= 1.2
    // temperature
    const t = next.environment.temperature
    if (t < SAFE_RANGES.temperature.low || t > SAFE_RANGES.temperature.high) healthDelta -= 5
    if (t < 10 || t > 34) healthDelta -= 6
    // radiation
    if (next.environment.radiation > 30) healthDelta -= (next.environment.radiation - 30) * 0.09 * (e.radiationShelter ? 0.3 : 1)
    c.radiationDose += next.environment.radiation * RADIATION_DOSE.perIndex * (e.radiationShelter ? 0.35 : 1) * dt
    // accumulated dose — shielding slows it, but nothing erases it
    if (c.radiationDose > RADIATION_DOSE.critical) healthDelta -= 7
    else if (c.radiationDose > RADIATION_DOSE.danger) healthDelta -= 4
    else if (c.radiationDose > RADIATION_DOSE.warn) healthDelta -= 2
    // hygiene / waste
    if (highWaste) { healthDelta -= 3.5; c.stress = clamp(c.stress + 4 * dt, 0, 100) }
    // hydration & nutrition effects
    if (c.hydration < 40) healthDelta -= 4
    if (c.hydration < 20) healthDelta -= 6
    if (c.nutrition < 40) healthDelta -= 4
    if (c.nutrition < 20) healthDelta -= 6
    // fatigue/stress cross-effect
    if (c.fatigue > 70) healthDelta -= 3
    if (c.stress > 75) healthDelta -= 3
    c.health = clamp(c.health + healthDelta * dt, 0, 100)
    // fatigue & stress recovery/accumulation
    c.fatigue = clamp(c.fatigue + (5.5 - (c.fatigue > 60 ? 2.5 : 4.5)) * dt, 0, 100)
    c.stress = clamp(c.stress + ((next.phase === 'emergency' ? 5 : 0.8) - 1.8) * dt, 0, 100)
    refreshCrewStatus(c)
  }
}

function applyCrewAssignments(next, dt = 1) {
  const crew = next.astronauts
  const power = powerAvailability(next)
  let repairBoost = 0
  let solarCare = 0, inspection = 0, tending = 0, medCalm = 0
  for (const c of crew) {
    if (c.status !== 'active') continue
    if (c.task === 'Rest') {
      c.fatigue = clamp(c.fatigue - 7 * dt, 0, 100); c.stress = clamp(c.stress - 2.5 * dt, 0, 100)
    } else if (c.task === 'Medical monitoring') {
      medCalm += 1; c.stress = clamp(c.stress - 2.5 * dt, 0, 100)
      c.health = clamp(c.health + 0.7 * dt, 0, 100)
    } else if (c.task === 'Scientific research') {
      if (power.hasPower && next.optionalLoads !== false) next.stats.scientificPoints += 1 * dt
    } else if (c.task === 'Rover operation') {
      if (power.hasPower) next.stats.scientificPoints += 1 * dt
    } else if (c.task === 'Solar array maintenance') {
      solarCare += 1
    } else if (c.task === 'Greenhouse monitoring') {
      tending += 1
    } else if (c.task === 'Habitat inspection') {
      inspection += 1
    } else if (c.task === 'Equipment repair') {
      repairBoost += c.profession === 'Engineer' ? 1.6 : 1.0
    }
    // Non-rest tasks add a small fatigue load
    if (c.task !== 'Rest') c.fatigue = clamp(c.fatigue + 1.4 * dt, 0, 100)
  }
  // Engineering & systems upkeep (assignments genuinely influence the sim)
  if (tending > 0 && next.equipment.greenhouse) {
    const growth = Number.isFinite(next.greenhouseGrowth) ? next.greenhouseGrowth : 0
    if (growth < CREW.greenhouseGrowDays && power.hasPower && next.resources.water.current > 5) {
      next.greenhouseGrowth = Math.min(CREW.greenhouseGrowDays, growth + 0.5 * tending * dt)
    } else if (growth >= CREW.greenhouseGrowDays) {
      next.resources.food.current = clamp(next.resources.food.current + 0.7 * tending * dt, 0, next.resources.food.max)
    }
  }
  if (solarCare > 0) next.environment.solarEfficiency = clamp(next.environment.solarEfficiency + 0.8 * solarCare * dt, 20, 100)
  if (inspection > 0) {
    for (const key of Object.keys(next.equipmentCondition)) {
      if (key === 'rover' || key === 'spacesuit') continue
      next.equipmentCondition[key] = clamp(next.equipmentCondition[key] + 0.6 * inspection * dt, 5, 100)
    }
  }
  if (repairBoost > 0) {
    let worstKey = null
    let worstCond = 101
    for (const key of Object.keys(next.equipmentCondition)) {
      if (key === 'rover' || key === 'spacesuit') continue
      if (next.equipmentCondition[key] < worstCond) { worstCond = next.equipmentCondition[key]; worstKey = key }
    }
    if (worstKey) next.equipmentCondition[worstKey] = clamp(next.equipmentCondition[worstKey] + repairBoost * dt, 5, 100)
  }
  if (medCalm > 0) for (const c of crew) c.stress = clamp(c.stress - 0.8 * medCalm * dt, 0, 100)
  return next
}

function progressRover(next, dt = 1) {
  if (!next.roverMission) return
  next.roverMission.daysRemaining -= dt
  next.equipmentCondition.rover = clamp(next.equipmentCondition.rover - 1.5 * dt, 5, 100)
  for (const c of next.astronauts) if (c.task === 'Rover operation') c.fatigue = clamp(c.fatigue + 3 * dt, 0, 100)
  if (next.roverMission.daysRemaining <= 0) resolveRoverMission(next)
}

// Archived DONKI events, scripted per mission profile — not live data
function applyScheduledStorm(state, next) {
  const storms = state.mission.profile?.archivedStorms ?? []
  const storm = storms.find((s) => s.day === state.day && !(next.firedStorms ?? []).includes(s.day))
  if (!storm) return
  next.firedStorms = [...(next.firedStorms ?? []), storm.day]
  next.environment.radiation = scheduledStormRadiation(storm.day)
  const tmpl = emergencyTemplatesFor(next.missionId).find((t) => t.type === 'solar_storm')
  if (tmpl) {
    const choices = [...tmpl.choices]
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(mulberry32(next.seed + storm.day * 811 + i)() * (i + 1))
      ;[choices[i], choices[j]] = [choices[j], choices[i]]
    }
    next.pendingEmergency = {
      id: `solar_storm-${next.day}-archived`,
      day: next.day,
      ...tmpl,
      ...issueMetaFor('solar_storm'),
      title: `Solar Particle Event — ${storm.label}`,
      description: `Archived event replay: ${storm.label}. Radiation is spiking. Shelter the crew now — shielding saves health.`,
      science: 'This replays an archived solar storm from the NASA DONKI/CCMC catalog. Real events dose anything unshielded — vaults and thick regolith drop the dose dramatically.',
      choices,
    }
    next.phase = 'emergency'
    next.stats.emergenciesEncountered += 1
    pushLog(next, `RADIATION STORM (${storm.label}) — crew must shelter.`, 'danger')
  }
}

const EARTH_ANSWERS = {
  oxygen: 'Oxygen is your weakest link. Isolate cabin leaks, activate reserves, and keep the recycler at full load. If CO2 alarms sound, check the scrubber — oxygen alone will not save them.',
  water: 'Water is your margin. Run recovery at high load, use reserves sparingly, and treat greenhouse demand as optional until reserves recover.',
  food: 'Ration carefully. Greenhouse production needs water and power — cut it if either is tight. Feed the crew, not the science.',
  power: 'Power is your margin. Shed optional loads first — experiments, comms, lighting. Battery first, never bleed the reserve you cannot refill.',
  general: 'Commander: keep life support and thermal control online above all else. Decide now what you will sacrifice if supplies run thin — fuel is not your only finite resource.',
}

function processEarth(next) {
  const req = next.earthRequest
  if (!req) return
  if (next.day >= req.answerDay) {
    next.earthAnswer = { day: next.day, topic: req.topic, delayMin: req.delayMin, text: EARTH_ANSWERS[req.topic] ?? EARTH_ANSWERS.general }
    next.earthRequest = null
    pushLog(next, `Earth reply received (one-way light time ~${req.delayMin} min). Relay advisory delivered to command.`, 'info')
  }
}

export function askEarth(state) {
  if (state.phase !== 'active') return state
  if (state.mission?.id !== 'mars') return state
  if (state.earthRequest) return state
  const next = structuredClone(state)
  const rng = mulberry32(next.seed + next.day * 9161 + 777)
  const delayMin = 4 + Math.floor(rng() * 21) // 4–24 min one-way light time
  const answerDay = next.day + 1 + Math.floor(rng() * 2)
  const fractions = [
    ['oxygen', next.resources.oxygen.current / next.resources.oxygen.max],
    ['water', next.resources.water.current / next.resources.water.max],
    ['food', next.resources.food.current / next.resources.food.max],
    ['power', next.resources.electricity.current / next.resources.electricity.max],
  ].sort((a, b) => a[1] - b[1])
  const topic = fractions[0][1] < 0.35 ? fractions[0][0] : 'general'
  next.earthRequest = { delayMin, answerDay, topic, askedDay: next.day }
  pushLog(next, `Radio call sent to Earth. One-way light time is ~${delayMin} min — an advisory will arrive in a Sol or two.`, 'info')
  return next
}

// ---------------------------------------------------------------------------
// Continuous-time core
// The clock advances in fractions of a Sol. Physics, life support, crew and
// equipment all scale with the elapsed fraction, so the base runs on its own.
// A Sol boundary triggers the old "day" bookkeeping: environment forecast,
// archived storms, Earth reply, history, mission checks and emergencies.
// ---------------------------------------------------------------------------

// Apply dt of a Sol of physics. dt = 1 reproduces one legacy daily turn.
export function simulateStep(state, dtSols = 1) {
  const dt = Math.max(0, Math.min(1, dtSols))
  if (dt <= 0) return state
  const next = structuredClone(state)
  // These only change at Sol boundaries (or on logged events); reusing the
  // references keeps the React tree stable during the 2 Hz ticker.
  next.history = state.history
  next.log = state.log

  // Habitat temperature drifts toward the heating target (exponential approach).
  const power = powerAvailability(next)
  const outside = next.environment.outsideTemp ?? next.environment.temperature ?? -20
  const heatingTarget = next.equipment.heating && power.hasPower ? (power.reserveLow ? 17 : 21) : clamp(outside, -60, 21)
  next.environment.temperature = next.environment.temperature + (heatingTarget - next.environment.temperature) * (1 - Math.pow(0.65, dt))
  next.environment.sunlight = next.environment.sunlight ?? 1

  // Life support / production resources (centralized in resourceManager)
  const applied = applyResources(next, dt)
  next.resources = applied.resources
  next.rates = applied.rates
  next.greenhouseGrowth = applied.greenhouseGrowth

  // Radiation exposure impact on habitat systems
  let radImpact = 0
  if (next.environment.radiation > 35) radImpact = next.equipment.radiationShelter ? 1 : 4
  else if (next.environment.radiation > 25) radImpact = next.equipment.radiationShelter ? 0.5 : 2
  if (radImpact > 0) {
    next.resources.oxygen.current = clamp(next.resources.oxygen.current - radImpact * dt, 0, next.resources.oxygen.max)
  }

  // Atmosphere & crew physiology (O2/CO2/pressure/humidity/waste/health)
  applyAtmosphereAndCrew(next, dt)

  // Crew assignments & rover progress (part of the same cycle)
  applyCrewAssignments(next, dt)
  progressRover(next, dt)

  return next
}

function newSolSummary(next, completedDay) {
  const start = next.solStart
  if (!start) {
    return {
      day: completedDay,
      oxygenDelta: 0, waterDelta: 0, foodDelta: 0, electricityDelta: 0, batteryDelta: 0,
      co2Delta: 0, pressureDelta: 0, temperatureDelta: 0, radiationDelta: 0, wasteAdded: 0,
      warnings: buildWarnings(next),
    }
  }
  return {
    day: completedDay,
    oxygenDelta: next.resources.oxygen.current - start.oxygen,
    waterDelta: next.resources.water.current - start.water,
    foodDelta: next.resources.food.current - start.food,
    electricityDelta: next.resources.electricity.current - start.electricity,
    batteryDelta: next.resources.battery.current - start.battery,
    co2Delta: next.atmosphere.co2Ppm - start.co2Ppm,
    pressureDelta: next.atmosphere.pressure - start.pressure,
    temperatureDelta: next.environment.temperature - start.temperature,
    radiationDelta: next.environment.radiation - start.radiation,
    wasteAdded: next.resources.waste.current - start.waste,
    warnings: buildWarnings(next),
  }
}

// Terminal-condition checks — shared by the ticker and Sol rollover.
function checkMissionFailure(next) {
  if (next.phase === 'completed') return next
  const allLost = next.astronauts.every((c) => c.status === 'lost')
  const powerOut = next.resources.electricity.current <= 0 && next.resources.battery.current <= 0
  const oxygenOut = next.resources.oxygen.current <= 0
  const waterOut = next.resources.water.current <= 0
  const foodOut = next.resources.food.current <= 0
  if (allLost) {
    next.phase = 'completed'
    next.result = evaluateMission(next, { forcedFailure: 'Mission failed: all crew members were lost.' })
    pushLog(next, next.result.reason, 'danger')
    return next
  }
  if (oxygenOut || waterOut || foodOut || powerOut) {
    const reason = oxygenOut ? 'oxygen' : waterOut ? 'water' : foodOut ? 'food' : 'total power'
    next.phase = 'completed'
    next.result = evaluateMission(next, { forcedFailure: `Mission failed: ${reason} exhausted. Crew survival compromised.` })
    pushLog(next, next.result.reason, 'danger')
  }
  return next
}

// Move from the Sol that just ended into the next one (mutates `state`).
function rolloverSol(state) {
  const next = state
  const completedDay = next.day
  const completedRates = next.rates ?? getDailyRates(next)

  // What changed during the Sol the player just lived through.
  next.lastCycleSummary = newSolSummary(next, completedDay)

  // Next Sol: reset staging scene, advance the counter and the sub-Sol clock.
  next.day = completedDay + 1
  next.missionClock = Math.max(0, (next.missionClock ?? 0) - 1)
  next.scene = { mode: 'nominal', crewOverride: null, lastDecision: next.scene?.lastDecision ?? null }

  // Environment for the new Sol (modifier timers decay once per Sol).
  const envUpdate = updateEnvironmentInPlace(next)
  next.environment = envUpdate.environment
  next.modifiers = envUpdate.modifiers

  if (next.environment.radiation > 25) {
    pushLog(next, `Radiation exposure strained habitat systems during Sol ${completedDay}.`, 'warning')
  }

  // Archived DONKI storm Sol is scripted — spike radiation before the crew enters it.
  applyScheduledStorm(next, next)

  // Earth's delayed reply is checked at the start of the new Sol.
  processEarth(next)

  pushLog(next, `Sol ${completedDay} complete. Net power ${completedRates.electricityNet >= 0 ? '+' : ''}${completedRates.electricityNet.toFixed(1)} units.`, 'info')
  next.history = [...next.history, snapshotHistory(next.day, next.resources, next.environment, next.atmosphere)].slice(-40)

  // New Sol baseline for the cycle summary.
  next.solStart = snapshotSolStart(next.resources, next.atmosphere, next.environment)

  // Terminal states
  checkMissionFailure(next)
  if (next.phase === 'completed') return next

  if (next.day > next.missionLength) {
    next.phase = 'completed'
    next.result = evaluateMission({ ...next, day: next.missionLength })
    pushLog(next, next.result.reason, next.result.status === 'success' ? 'success' : 'danger')
    return next
  }

  // Generate an emergency for the new Sol (seeded, reproducible)
  const emergency = generateEmergencySeeded(next)
  if (emergency) {
    next.pendingEmergency = emergency
    next.phase = 'emergency'
    next.stats.emergenciesEncountered += 1
    pushLog(next, `Emergency: ${emergency.title}. Immediate decision required.`, 'danger')
  }

  return next
}

// Real-time heartbeat: advance the simulation by dtSols (fraction of a Sol).
export function tickMission(state, dtSols) {
  if (!state || state.phase !== 'active') return state
  const dt = Math.max(0, Math.min(1, dtSols))
  if (dt <= 0) return state

  let next = simulateStep(state, dt)
  next.missionClock = (state.missionClock ?? 0) + dt

  let guard = 0
  while (next.missionClock >= 1 && next.phase === 'active' && guard < 4) {
    next = rolloverSol(next)
    guard += 1
  }

  if (next.phase === 'active') next = checkMissionFailure(next)
  return next
}

// Kept for compatibility / instant skip: simulate a full Sol and roll over.
export function advanceDay(state) {
  if (state.phase !== 'active') return state
  const simulated = simulateStep(state, 1)
  simulated.missionClock = 1
  return rolloverSol(simulated)
}

function buildEnvironment(state, day) {
  const env = { ...state.environment }
  const profile = state.mission.profile
  const mod = state.modifiers || {}
  const lunarNight = state.mission.id === 'moon' && Array.isArray(profile.lunarNightDays) && profile.lunarNightDays.includes(day)

  const swing = Math.sin(day / 2) * (profile.tempSwing ?? 15) * 0.3
  const outside = lunarNight
    ? (profile.nightBaseTemp ?? -150) + Math.sin(day) * 8
    : (profile.baseTemp ?? -20) + swing + (mod.temperatureOffset || 0)
  env.outsideTemp = Math.round(outside)

  let radiation = (profile.baseRadiation ?? 12) + (mod.radiationOffset || 0) + (day % 6 === 0 ? 4 : 0)
  if (state.equipment.radiationShelter) radiation -= 6
  env.radiation = clamp(Math.round(radiation), 0, 100)

  let sunlight = lunarNight ? 0.12 : (profile.solarBase ?? 0.8) + Math.cos(day / 3) * 0.08
  sunlight = clamp(sunlight - (mod.solarPenalty || 0), 0.02, 1.1)
  env.sunlight = Number(sunlight.toFixed(2))

  let efficiency = (state.mission.initial.environment.solarEfficiency || 75) + (mod.solarEfficiencyDelta || 0)
  if (state.mission.id === 'mars' && day % 5 === 0) efficiency -= 1.5
  env.solarEfficiency = clamp(Math.round(efficiency), 20, 100)
  return env
}

function updateEnvironmentInPlace(state) {
  const env = buildEnvironment(state, state.day)
  const mod = state.modifiers || {}
  const nextModifiers = { ...mod }
  if (nextModifiers.duration && nextModifiers.duration > 0) {
    nextModifiers.duration -= 1
    if (nextModifiers.duration <= 0) {
      nextModifiers.solarPenalty = 0
      nextModifiers.solarEfficiencyDelta = 0
    }
  }
  return { environment: env, modifiers: nextModifiers }
}

function scheduledStormRadiation(day) {
  return clamp(60 + (day % 7) * 2, 0, 100)
}

function generateEmergencySeeded(state) {
  if (state.pendingEmergency) return null
  if (state.phase !== 'active') return null
  const day = state.day
  const diff = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.survival
  const rng = mulberry32(state.seed + day * 2654435761)
  const chance = Math.min(0.62, (0.16 + day * 0.016) * diff.failureMultiplier)
  if (rng() > chance) return null

  // Weighted pool based on conditions
  const applicable = emergencyTemplatesFor(state.missionId)
  let pool = [...applicable]
  if (state.environment.solarEfficiency < 55) pool = pool.concat(applicable.filter((t) => t.type === 'dust_storm' || t.type === 'equipment_failure' || t.type === 'power_failure' || t.type === 'solar_storm'))
  if (state.environment.radiation > 28) pool = pool.concat(applicable.filter((t) => t.type === 'radiation_storm' || t.type === 'solar_storm'))
  if (state.resources.water.current < state.resources.water.max * 0.3) pool = pool.concat(applicable.filter((t) => t.type === 'water_leak' || t.type === 'water_contamination'))
  if (state.atmosphere.co2Ppm > 1200) pool = pool.concat(applicable.filter((t) => t.type === 'co2_scrubber_failure'))
  if (state.resources.electricity.current < 120) pool = pool.concat(applicable.filter((t) => t.type === 'power_failure' || t.type === 'equipment_failure'))
  const template = pool[Math.floor(rng() * pool.length)]
  // Shuffle answer order so players read options instead of memorizing positions
  const shuffled = [...template.choices]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return { id: `${template.type}-${day}-${Math.floor(rng() * 1000)}`, day, ...annotateIssue(template), choices: shuffled }
}

// --- Frequent crew reports (every 10–15 real seconds) --------------------
// These are non-blocking warning markers: the clock keeps running, an
// astronaut pops up to report to the Mission Director, and the player clicks
// the marker to open the decision panel.
const TAG_CONDITION = {
  power: (s) => s.resources.electricity.current < 180 || s.environment.solarEfficiency < 60,
  dust: (s) => s.missionId === 'mars' && s.environment.solarEfficiency < 65,
  water: (s) => s.resources.water.current < s.resources.water.max * 0.6,
  air: (s) => s.atmosphere.co2Ppm > 1100 || s.resources.oxygen.current < s.resources.oxygen.max * 0.5,
  crew: (s) => s.astronauts.some((c) => c.fatigue > 60 || c.stress > 65),
  waste: (s) => s.resources.waste.current > 18,
  suit: (s) => (s.equipmentCondition?.spacesuit ?? 90) < 75,
  radiation: (s) => s.environment.radiation > 28,
  thermal: (s) => s.environment.temperature < 18,
  food: (s) => s.resources.food.current < s.resources.food.max * 0.5,
}

function reportPool(state) {
  const pool = []
  for (const template of crewReportTemplates) {
    const boosted = template.tags?.some((tag) => TAG_CONDITION[tag]?.(state))
    const weight = boosted ? 3 : 1
    for (let i = 0; i < weight; i += 1) pool.push(template)
  }
  return pool
}

export function spawnCrewReport(state) {
  if (!state || state.phase !== 'active' || state.crewReport) return state
  const next = structuredClone(state)
  const seq = (next.reportSeq ?? 0) + 1
  next.reportSeq = seq
  const rng = mulberry32(next.seed + next.day * 7919 + seq * 104729)
  const pool = reportPool(next)
  const template = pool[Math.floor(rng() * pool.length)]
  if (!template) return state

  const shuffled = [...template.choices]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const preferredReporter = next.astronauts.find((c) => c.id === template.reporterId && c.status === 'active')
  const reporter = preferredReporter ?? next.astronauts.find((c) => c.status === 'active') ?? next.astronauts[0]

  next.crewReport = {
    id: `crew-${next.day}-${seq}`,
    day: next.day,
    type: template.id,
    title: template.title,
    description: template.description,
    science: template.science,
    choices: shuffled,
    reporterId: reporter?.id ?? template.reporterId,
    astronautId: reporter?.id ?? template.reporterId,
    station: template.station,
    severity: template.severity ?? 'warning',
    reportedAt: next.missionClock ?? 0,
    origin: 'crew',
  }
  pushLog(next, `${reporter?.name ?? 'Crew'} reports to the Mission Director: ${template.title}. A warning marker is active on the base.`, 'warning')
  return next
}

export function resolveCrewReport(state, choiceId) {
  if (!state?.crewReport) return state
  const next = structuredClone(state)
  const report = next.crewReport
  const choice = report.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  // Choices that consume a spare part cannot be taken without one.
  if ((choice.effects.spareParts ?? 0) < 0 && next.resources.spareParts <= 0) {
    pushLog(next, `Cannot choose "${choice.label}": no spare parts left. Pick another response.`, 'warning')
    return next
  }

  const applied = applyEffects(next, choice.effects)
  next.resources = applied.resources
  next.environment = applied.environment
  next.atmosphere = applied.atmosphere ?? next.atmosphere
  for (const c of next.astronauts) refreshCrewStatus(c)

  if (choice.effects.solarEfficiencyDelta) {
    next.environment.solarEfficiency = clamp(next.environment.solarEfficiency + choice.effects.solarEfficiencyDelta, 20, 100)
    next.modifiers = { solarPenalty: 0, solarEfficiencyDelta: 0, radiationOffset: 0, temperatureOffset: 0, equipmentEfficiency: 1, ...(next.modifiers || {}) }
    next.modifiers.solarEfficiencyDelta = (next.modifiers.solarEfficiencyDelta || 0) + choice.effects.solarEfficiencyDelta
  }
  if (choice.effects.duration) next.modifiers = { ...(next.modifiers || {}), duration: Math.max(next.modifiers?.duration || 0, choice.effects.duration) }
  if (choice.effects.equipmentBoost === 1) next.modifiers = { ...(next.modifiers || {}), equipmentEfficiency: 1.05 }
  if (choice.effects.equipmentBoost === -1) next.modifiers = { ...(next.modifiers || {}), equipmentEfficiency: 0.9 }

  if (report.type === 'equipment_failure' || report.type === 'co2_scrubber_failure' || report.type === 'power_failure') {
    const target = report.type === 'equipment_failure' ? 'waterRecycler' : report.type === 'co2_scrubber_failure' ? 'co2Scrubber' : 'solarPower'
    next.equipmentCondition[target] = clamp(next.equipmentCondition[target] - EQUIPMENT_CONDITION.emergencyWear * 0.6, 5, 100)
  }

  next.scene = {
    mode: 'nominal',
    crewOverride: null,
    lastDecision: { type: report.type, choiceId: choice.id, title: report.title, label: choice.label },
  }

  const harmful = ['delay', 'patch_later', 'ignore', 'continue', 'defer', 'minimum', 'med_ignore', 'fire_ignore', 'push']
  if (!harmful.includes(choice.id)) {
    next.stats.reportsHandled = (next.stats.reportsHandled ?? 0) + 1
    next.stats.scientificPoints += 2
  }

  pushLog(next, `${report.title} handled: ${choice.label}. ${choice.consequence}`, harmful.includes(choice.id) ? 'warning' : 'success')
  next.crewReport = null
  return checkMissionFailure(next)
}

// Emergency data lives with the engine so generation stays seeded/authoritative
import { emergencyTemplates } from '../data/emergencyEvents'
function emergencyTemplatesFor(missionId) {
  return emergencyTemplates.filter((t) => t.appliesTo.includes(missionId))
}

export function resolveEmergency(state, choiceId) {
  if (!state.pendingEmergency) return state
  const next = structuredClone(state)
  const emergency = next.pendingEmergency
  const choice = emergency.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  // Choices that consume a spare part cannot be taken without one.
  if ((choice.effects.spareParts ?? 0) < 0 && next.resources.spareParts <= 0) {
    pushLog(next, `Cannot choose "${choice.label}": no spare parts left. Pick another response.`, 'warning')
    return next
  }

  const applied = applyEffects(next, choice.effects)
  next.resources = applied.resources
  next.environment = applied.environment
  next.atmosphere = applied.atmosphere ?? next.atmosphere
  for (const c of next.astronauts) refreshCrewStatus(c)

  // Special modifier keys (kept in engine — these are not pure resource effects)
  if (choice.effects.solarEfficiencyDelta) {
    next.environment.solarEfficiency = clamp(next.environment.solarEfficiency + choice.effects.solarEfficiencyDelta, 20, 100)
    next.modifiers = { solarPenalty: 0, solarEfficiencyDelta: 0, radiationOffset: 0, temperatureOffset: 0, equipmentEfficiency: 1, ...(next.modifiers || {}) }
    next.modifiers.solarEfficiencyDelta = (next.modifiers.solarEfficiencyDelta || 0) + choice.effects.solarEfficiencyDelta
  }
  if (choice.effects.duration) next.modifiers = { ...(next.modifiers || {}), duration: Math.max(next.modifiers?.duration || 0, choice.effects.duration) }
  if (choice.effects.equipmentBoost === 1) next.modifiers = { ...(next.modifiers || {}), equipmentEfficiency: 1.05 }
  if (choice.effects.equipmentBoost === -1) next.modifiers = { ...(next.modifiers || {}), equipmentEfficiency: 0.9 }

  // Equipment condition damage on failures
  if (emergency.type === 'equipment_failure' || emergency.type === 'co2_scrubber_failure' || emergency.type === 'power_failure') {
    const target = emergency.type === 'equipment_failure' ? 'waterRecycler' : emergency.type === 'co2_scrubber_failure' ? 'co2Scrubber' : 'solarPower'
    next.equipmentCondition[target] = clamp(next.equipmentCondition[target] - EQUIPMENT_CONDITION.emergencyWear * 0.6, 5, 100)
  }

  // Map response to surface-scene behavior
  next.scene = {
    mode: sceneModeFor(emergency.type, choice.id),
    crewOverride: crewOverrideFor(emergency.type, choice.id),
    lastDecision: { type: emergency.type, choiceId: choice.id, title: emergency.title, label: choice.label },
  }

  const harmful = ['delay', 'patch_later', 'ignore', 'continue', 'defer', 'minimum', 'med_ignore', 'fire_ignore']
  if (!harmful.includes(choice.id)) next.stats.emergenciesHandled += 1

  pushLog(next, `Emergency response (${emergency.title}): ${choice.label}. ${choice.consequence}`, harmful.includes(choice.id) ? 'warning' : 'success')
  next.pendingEmergency = null
  next.phase = 'active'

  // Failure check post-decision
  const allLost = next.astronauts.every((c) => c.status === 'lost')
  if (allLost || next.resources.oxygen.current <= 0 || next.resources.water.current <= 0 || next.resources.food.current <= 0 || (next.resources.electricity.current <= 0 && next.resources.battery.current <= 0)) {
    const reason = allLost ? 'all crew lost' : next.resources.oxygen.current <= 0 ? 'oxygen' : next.resources.water.current <= 0 ? 'water' : next.resources.food.current <= 0 ? 'food' : 'total power'
    next.phase = 'completed'
    next.result = evaluateMission(next, { forcedFailure: `Mission failed: ${reason} exhausted.` })
    pushLog(next, next.result.reason, 'danger')
  }

  return next
}

export function restartMission(state) {
  return createMissionState(state.missionId, state.astronautName, state.difficulty)
}

export { getDailyRates, getPhaseForDay }
