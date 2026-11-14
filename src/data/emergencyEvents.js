export const emergencyTemplates = [
  {
    type: 'dust_storm',
    title: 'Dust Storm',
    description: 'A regional dust storm reduces sunlight reaching the habitat.',
    science: 'Dust in the atmosphere scatters and blocks sunlight, lowering solar panel output and visibility.',
    appliesTo: ['mars'],
    choices: [
      {
        id: 'conserve',
        label: 'Conserve power and wait it out',
        consequence: 'Reduces non-essential loads; battery preserved but operations slow.',
        effects: { electricity: 10, food: -4, solarEfficiencyDelta: -20, duration: 2 },
      },
      {
        id: 'clean',
        label: 'Run panel cleaning/maintenance cycle',
        consequence: 'Uses power now to recover some efficiency sooner.',
        effects: { electricity: -35, solarEfficiencyDelta: -8, duration: 1 },
      },
      {
        id: 'ignore',
        label: 'Continue normal operations',
        consequence: 'Higher energy strain while generation is reduced.',
        effects: { electricity: -20, battery: -8, solarEfficiencyDelta: -25, duration: 2 },
      },
    ],
  },
  {
    type: 'oxygen_leak',
    title: 'Oxygen Leakage',
    description: 'Sensors detect a pressure drop indicating oxygen loss in a habitat section.',
    science: 'In sealed habitats, leaks reduce breathable oxygen partial pressure and must be isolated quickly.',
    appliesTo: ['moon', 'mars'],
    choices: [
      {
        id: 'seal',
        label: 'Isolate section and seal the leak',
        consequence: 'Uses power and crew effort; stops most ongoing loss.',
        effects: { oxygen: -6, electricity: -18, water: -2 },
      },
      {
        id: 'reserve',
        label: 'Activate emergency oxygen reserves',
        consequence: 'Restores oxygen quickly but consumes stored reserves/capacity margin.',
        effects: { oxygen: 12, electricity: -10 },
      },
      {
        id: 'delay',
        label: 'Delay response and monitor',
        consequence: 'Leak worsens, causing significant oxygen loss.',
        effects: { oxygen: -22, electricity: -5 },
      },
    ],
  },
  {
    type: 'water_leak',
    title: 'Water Leakage',
    description: 'A coolant or storage line rupture is draining water reserves.',
    science: 'Water is critical for drinking, hygiene, cooling, and food systems; leaks compound multiple risks.',
    appliesTo: ['moon', 'mars'],
    choices: [
      {
        id: 'isolate',
        label: 'Isolate affected system',
        consequence: 'Limits loss with moderate repair cost.',
        effects: { water: -8, electricity: -12, food: -2 },
      },
      {
        id: 'reroute',
        label: 'Reroute to backup tanks',
        consequence: 'Saves more water but requires extra power and time.',
        effects: { water: -3, electricity: -22, battery: -5 },
      },
      {
        id: 'patch_later',
        label: 'Patch later',
        consequence: 'Continued leakage drains reserves.',
        effects: { water: -25, electricity: -4 },
      },
    ],
  },
  {
    type: 'radiation_storm',
    title: 'Radiation Storm',
    description: 'Solar activity increases radiation levels around the habitat.',
    science: 'Energetic particles from solar events raise radiation dose rates; shielding and sheltering reduce exposure.',
    appliesTo: ['moon', 'mars'],
    choices: [
      {
        id: 'shelter',
        label: 'Move crew to radiation shelter',
        consequence: 'Best protection; increased shelter power use and reduced operations.',
        effects: { radiation: -10, electricity: -20, food: -3, oxygen: -2 },
      },
      {
        id: 'limit_eva',
        label: 'Limit EVA and reinforce monitoring',
        consequence: 'Partial protection with moderate operational impact.',
        effects: { radiation: -2, electricity: -8, oxygen: -1 },
      },
      {
        id: 'continue',
        label: 'Continue mission activities',
        consequence: 'Crew receives higher radiation exposure.',
        effects: { radiation: 18, electricity: 0 },
      },
    ],
  },
  {
    type: 'equipment_failure',
    title: 'Equipment Failure',
    description: 'A critical subsystem reports malfunction and reduced performance.',
    science: 'Complex life-support hardware can fail; redundancy and timely repair protect mission stability.',
    appliesTo: ['moon', 'mars'],
    choices: [
      {
        id: 'repair_now',
        label: 'Allocate resources to repair now',
        consequence: 'Restores reliability at immediate resource cost.',
        effects: { electricity: -25, water: -4, oxygen: -2, equipmentBoost: 1 },
      },
      {
        id: 'workaround',
        label: 'Use manual workaround',
        consequence: 'Keeps systems running with reduced efficiency.',
        effects: { electricity: -10, food: -3, equipmentBoost: 0 },
      },
      {
        id: 'defer',
        label: 'Defer repair',
        consequence: 'Failure cascades into broader resource losses.',
        effects: { electricity: -15, oxygen: -8, water: -8, equipmentBoost: -1 },
      },
    ],
  },
  {
    type: 'extreme_temperature',
    title: 'Extreme Temperature Event',
    description: 'External temperatures shift beyond normal operating range.',
    science: 'Habitats require active thermal control; extreme cold/heat increases energy demand to protect crew and systems.',
    appliesTo: ['moon', 'mars'],
    choices: [
      {
        id: 'max_heating',
        label: 'Increase heating/thermal control',
        consequence: 'Stabilizes habitat but consumes significant power.',
        effects: { electricity: -30, battery: -6, temperatureDelta: 8 },
      },
      {
        id: 'balance',
        label: 'Balance thermal control and conservation',
        consequence: 'Moderate stabilization with moderate energy use.',
        effects: { electricity: -16, temperatureDelta: 3 },
      },
      {
        id: 'minimum',
        label: 'Run minimum thermal control',
        consequence: 'Saves power but risks unsafe habitat conditions.',
        effects: { electricity: -6, temperatureDelta: -10, oxygen: -3 },
      },
    ],
  },
]
