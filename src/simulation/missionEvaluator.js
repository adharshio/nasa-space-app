export function evaluateMission(state, { forcedFailure = null } = {}) {
  const r = state.resources
  const survivedDays = state.day
  let status = 'success'
  let reason = `Mission completed: crew sustained for ${state.mission.durationDays} days.`
  if (forcedFailure) {
    status = 'failure'
    reason = forcedFailure
  } else if (r.oxygen.current <= 0) { status = 'failure'; reason = 'Mission failed: oxygen depleted.' }
  else if (r.water.current <= 0) { status = 'failure'; reason = 'Mission failed: water reserves depleted.' }
  else if (r.food.current <= 0) { status = 'failure'; reason = 'Mission failed: food supplies depleted.' }
  else if (r.electricity.current <= 0 && r.battery.current <= 0) { status = 'failure'; reason = 'Mission failed: total power loss.' }

  const remaining = {
    oxygen: Math.round(r.oxygen.current),
    water: Math.round(r.water.current),
    food: Math.round(r.food.current),
    electricity: Math.round(r.electricity.current),
  }
  const emergenciesEncountered = state.stats?.emergenciesEncountered || 0
  const emergenciesHandled = state.stats?.emergenciesHandled || 0
  const base = status === 'success' ? 500 : 150
  const score = Math.max(0, Math.round(
    base + survivedDays * 10 + remaining.oxygen + remaining.water * 0.5 + remaining.food + remaining.electricity * 0.2 + emergenciesHandled * 25 - Math.max(0, emergenciesEncountered - emergenciesHandled) * 15
  ))

  const good = []
  const bad = []
  const mistakes = []
  const suggestions = []
  if (remaining.oxygen > 40) good.push('Maintained healthy oxygen reserves through recycling/decisions.')
  else bad.push('Oxygen margins were low; prioritize leak response and recycler uptime.')
  if (remaining.water > 60) good.push('Water management kept reserves stable.')
  else { bad.push('Water reserves dropped significantly.'); mistakes.push('Delayed response to water stress/leaks or overused greenhouse without balance.') }
  if (remaining.food > 35) good.push('Food supply remained sufficient for the crew.')
  else mistakes.push('Food production/consumption balance was tight.')
  if (emergenciesHandled >= emergenciesEncountered && emergenciesEncountered > 0) good.push('Handled emergencies effectively with timely decisions.')
  if (emergenciesHandled < emergenciesEncountered) { bad.push('Some emergencies were not optimally resolved.'); mistakes.push('Suboptimal emergency choices increased resource loss.') }
  if (r.battery.current < 20) mistakes.push('Battery buffer was frequently low, risking outages during low solar periods.')
  suggestions.push('Keep oxygen/water recyclers active when power allows and respond early to leaks.')
  suggestions.push('Monitor solar efficiency and conserve power during storms or low-light periods.')
  suggestions.push('Use the radiation shelter during radiation storms to reduce exposure impact.')

  return {
    status,
    reason,
    survivedDays,
    astronautStatus: status === 'success' ? 'All astronauts stable' : 'Crew safety compromised',
    remaining,
    emergenciesEncountered,
    emergenciesHandled,
    score,
    good: good.length ? good : ['Mission completed with baseline stability.'],
    bad: bad.length ? bad : ['No major negative trends recorded.'],
    mistakes: mistakes.length ? mistakes : ['No critical resource management mistakes detected.'],
    suggestions,
  }
}
