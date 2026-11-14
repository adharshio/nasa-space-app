export const moonMission = {
  id: 'moon',
  name: 'Moon Base',
  destination: 'Lunar South Pole Habitat',
  difficulty: 'Moderate',
  durationDays: 20,
  astronauts: 3,
  description:
    'Operate a lunar habitat near the South Pole. Manage life support with no breathable atmosphere, extreme temperature swings, radiation exposure, and lighting-dependent solar power.',
  challenges: [
    'No breathable atmosphere – oxygen must be recycled and conserved',
    'Extreme temperature variations require heating control',
    'Radiation exposure demands shelter and shielding discipline',
    'Solar energy availability depends on location and lighting conditions',
  ],
  initial: {
    resources: {
      oxygen: { current: 100, max: 120 },
      water: { current: 200, max: 240 },
      food: { current: 100, max: 120 },
      electricity: { current: 500, max: 600 },
      battery: { current: 100, max: 100 },
    },
    environment: {
      temperature: -20,
      radiation: 18,
      solarEfficiency: 85,
      sunlight: 1.0,
    },
  },
  profile: {
    baseTemp: -20,
    tempSwing: 25,
    baseRadiation: 12,
    solarBase: 0.85,
    dustRisk: 0.05,
  },
}
