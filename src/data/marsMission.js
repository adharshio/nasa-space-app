export const marsMission = {
  id: 'mars',
  name: 'Mars Base',
  destination: 'Ares Planitia Outpost',
  difficulty: 'Hard',
  durationDays: 24,
  astronauts: 3,
  description:
    'Command a Martian habitat in a thin CO2 atmosphere. Survive cold conditions, dust storms, radiation, and variable solar power while balancing limited supplies.',
  challenges: [
    'Very thin carbon dioxide atmosphere – habitat pressure and oxygen are critical',
    'Dust storms reduce sunlight and solar panel efficiency',
    'Low temperatures increase heating demand',
    'Radiation exposure requires monitoring and shelter use',
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
      temperature: -45,
      radiation: 22,
      solarEfficiency: 75,
      sunlight: 0.9,
    },
  },
  profile: {
    baseTemp: -45,
    tempSwing: 15,
    baseRadiation: 16,
    solarBase: 0.72,
    dustRisk: 0.18,
  },
}
