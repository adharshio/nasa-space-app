export const equipmentDefs = [
  {
    id: 'oxygenRecycler',
    name: 'Oxygen Recycling System',
    icon: 'Wind',
    description: 'Recycles CO2 and conserves breathable oxygen for the crew.',
    energyUse: 18,
    effect: 'Recovers a portion of oxygen demand (does not create unlimited oxygen).',
  },
  {
    id: 'waterRecycler',
    name: 'Water Recycling System',
    icon: 'Droplets',
    description: 'Recovers used water from humidity and wastewater streams.',
    energyUse: 16,
    effect: 'Returns a portion of daily water use to reserves.',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse Food Production',
    icon: 'Sprout',
    description: 'Grows supplemental food crops inside the habitat.',
    energyUse: 20,
    effect: 'Produces food but consumes water and electricity.',
  },
  {
    id: 'solarPower',
    name: 'Solar Power System',
    icon: 'Sun',
    description: 'Generates electricity from available sunlight.',
    energyUse: 0,
    effect: 'Output depends on sunlight, panel efficiency, and dust conditions.',
  },
  {
    id: 'heating',
    name: 'Heating System',
    icon: 'Flame',
    description: 'Maintains safe habitat temperature for crew and equipment.',
    energyUse: 22,
    effect: 'Stabilizes temperature; higher demand in cold conditions.',
  },
  {
    id: 'radiationShelter',
    name: 'Radiation Shelter',
    icon: 'Shield',
    description: 'Shielded area that reduces crew radiation exposure during events.',
    energyUse: 10,
    effect: 'Lowers radiation impact when activated, especially during storms.',
  },
]

export function defaultEquipmentState() {
  return {
    oxygenRecycler: true,
    waterRecycler: true,
    greenhouse: true,
    solarPower: true,
    heating: true,
    radiationShelter: false,
  }
}
