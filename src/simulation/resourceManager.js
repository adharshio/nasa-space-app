import { clamp } from '../utils/calculations'

export function getDailyRates(state) {
  const { astronauts, equipment, environment, modifiers } = state
  const eff = modifiers?.equipmentEfficiency ?? 1
  const stormSolarPenalty = modifiers?.solarPenalty ?? 0

  // Base consumption per astronaut per day (illustrative simulation values)
  const baseOxygenUse = 4.2 * astronauts
  const baseWaterUse = 5.0 * astronauts
  const baseFoodUse = 3.0 * astronauts
  const baseElecUse = 22 // habitat baseline

  // Equipment effects
  const oxygenRecovery = equipment.oxygenRecycler ? 0.45 * eff : 0.05
  const waterRecovery = equipment.waterRecycler ? 0.4 * eff : 0.05
  const greenhouseFood = equipment.greenhouse ? 1.8 * eff : 0
  const greenhouseWaterUse = equipment.greenhouse ? 2.2 : 0
  const greenhouseElecUse = equipment.greenhouse ? 20 : 0
  const heatingElec = equipment.heating ? (environment.temperature < -10 ? 28 : 20) : 4
  const shelterElec = equipment.radiationShelter ? 10 : 0
  const recyclerElec = (equipment.oxygenRecycler ? 18 : 0) + (equipment.waterRecycler ? 16 : 0)

  const oxygenDelta = -(baseOxygenUse * (1 - oxygenRecovery))
  const waterDelta = -(baseWaterUse * (1 - waterRecovery)) - greenhouseWaterUse
  const foodDelta = -baseFoodUse + greenhouseFood

  const sunlight = Math.max(0, (environment.sunlight ?? 1) * (1 - stormSolarPenalty))
  const solarEff = clamp((environment.solarEfficiency ?? 70) / 100, 0, 1.2)
  const solarGeneration = equipment.solarPower ? 85 * sunlight * solarEff : 0
  const electricityDemand = baseElecUse + heatingElec + shelterElec + recyclerElec + greenhouseElecUse + (astronauts * 2)
  const electricityNet = solarGeneration - electricityDemand

  return {
    oxygenDelta,
    waterDelta,
    foodDelta,
    electricityNet,
    electricityDemand,
    solarGeneration,
    sunlight,
  }
}

export function applyDailyResources(state) {
  const rates = getDailyRates(state)
  const r = structuredClone(state.resources)

  r.oxygen.current = clamp(r.oxygen.current + rates.oxygenDelta, 0, r.oxygen.max)
  r.water.current = clamp(r.water.current + rates.waterDelta, 0, r.water.max)
  r.food.current = clamp(r.food.current + rates.foodDelta, 0, r.food.max)

  // Battery/electricity logic: net positive charges battery, net negative drains battery then electricity reserve
  let battery = r.battery.current
  let elec = r.electricity.current
  if (rates.electricityNet >= 0) {
    // charge battery first, overflow to electricity reserve
    const charge = rates.electricityNet * 0.12
    battery = clamp(battery + charge, 0, r.battery.max)
    elec = clamp(elec + rates.electricityNet * 0.15, 0, r.electricity.max)
  } else {
    const deficit = Math.abs(rates.electricityNet)
    const batteryDrain = deficit * 0.18
    if (battery >= batteryDrain) {
      battery -= batteryDrain
    } else {
      const remaining = batteryDrain - battery
      battery = 0
      elec = clamp(elec - remaining * 2.5, 0, r.electricity.max)
    }
    // if electricity reserve very low, strain life support a bit
    if (elec < 40) {
      r.oxygen.current = clamp(r.oxygen.current - 1.5, 0, r.oxygen.max)
      r.water.current = clamp(r.water.current - 1.0, 0, r.water.max)
    }
  }
  r.battery.current = clamp(battery, 0, r.battery.max)
  r.electricity.current = clamp(elec, 0, r.electricity.max)

  return { resources: r, rates }
}

export function applyEffects(state, effects = {}) {
  const r = structuredClone(state.resources)
  const env = { ...state.environment }
  if (effects.oxygen) r.oxygen.current = clamp(r.oxygen.current + effects.oxygen, 0, r.oxygen.max)
  if (effects.water) r.water.current = clamp(r.water.current + effects.water, 0, r.water.max)
  if (effects.food) r.food.current = clamp(r.food.current + effects.food, 0, r.food.max)
  if (effects.electricity) r.electricity.current = clamp(r.electricity.current + effects.electricity, 0, r.electricity.max)
  if (effects.battery) r.battery.current = clamp(r.battery.current + effects.battery, 0, r.battery.max)
  if (effects.radiation) env.radiation = clamp(env.radiation + effects.radiation, 0, 100)
  if (effects.temperatureDelta) env.temperature = env.temperature + effects.temperatureDelta
  return { resources: r, environment: env }
}
