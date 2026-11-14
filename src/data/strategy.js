// Strategic modules & astronaut requests for Nasa_Space_Exploration

export const INITIAL_MODULES = {
  power: {
    id: "power",
    name: "Solar Array & Battery",
    level: 1,
    maxLevel: 3,
    levelNames: ["Static Photovoltaic Array", "Sun-Tracking Dual Axis Array", "Kilopower Nuclear Stirling Reactor"],
    levelDescriptions: [
      "Fixed solar panels. Generates power during the lunar day.",
      "Motorized dual-axis tracking array. +65% power output.",
      "NASA Kilopower nuclear reactor. Generates continuous 40 kW day & night!",
    ],
    upgradeCosts: [
      { regolith: 0, science: 0, power: 0 },
      { regolith: 25, science: 4, power: 10 },
      { regolith: 60, science: 10, power: 25 },
    ],
    assignedAstronaut: "alex",
  },
  habitat: {
    id: "habitat",
    name: "Command Habitat & Life Support",
    level: 1,
    maxLevel: 3,
    levelNames: ["Inflatable Kevlar Hub", "Sintered Regolith Dome", "Multi-Ring Base Complex"],
    levelDescriptions: [
      "Inflatable pressurized habitat. Vulnerable to radiation and dust abrasion.",
      "Encased in 2 meters of melted lunar regolith. Eliminates air leaks.",
      "Multi-module living facility with panoramic cupola & medical bay.",
    ],
    upgradeCosts: [
      { regolith: 0, science: 0, power: 0 },
      { regolith: 30, science: 3, power: 12 },
      { regolith: 70, science: 8, power: 20 },
    ],
    assignedAstronaut: "maya",
  },
  greenhouse: {
    id: "greenhouse",
    name: "Aeroponic Greenhouse",
    level: 1,
    maxLevel: 3,
    levelNames: ["Microgreen Planter Pod", "Vertical Aeroponic Towers", "Closed-Loop Biome Dome"],
    levelDescriptions: [
      "Basic LED trays growing radishes and dwarf wheat.",
      "Nutrient mist roots. +50% fresh food, produces extra breathable O2.",
      "Self-sustaining ecosystem. High morale boost and zero water waste.",
    ],
    upgradeCosts: [
      { regolith: 0, science: 0, power: 0 },
      { regolith: 20, science: 5, power: 15 },
      { regolith: 50, science: 12, power: 25 },
    ],
    assignedAstronaut: "samira",
  },
  lab: {
    id: "lab",
    name: "Science & Geology Lab",
    level: 1,
    maxLevel: 3,
    levelNames: ["Sample Glovebox", "Laser Spectrometry Suite", "Quantum Geology Core"],
    levelDescriptions: [
      "Manual microscope and sample trays for lunar rock analysis.",
      "Automated mass spectrometer for ice and mineral analysis.",
      "Advanced astrophysics and in-situ resource synthesis center.",
    ],
    upgradeCosts: [
      { regolith: 0, science: 0, power: 0 },
      { regolith: 25, science: 6, power: 18 },
      { regolith: 65, science: 14, power: 30 },
    ],
    assignedAstronaut: null,
  },
  drill: {
    id: "drill",
    name: "Crater Ice Drill & Extractor",
    level: 1,
    maxLevel: 3,
    levelNames: ["Rotary Regolith Auger", "Heated Thermal Ice Probe", "Automated Subsurface Rig"],
    levelDescriptions: [
      "Extracts frozen crater dust. Yields water and regolith.",
      "Melts subterranean water ice and pumps directly into tanks.",
      "Deep core robotic excavator. Endless ice for rocket fuel & drinking.",
    ],
    upgradeCosts: [
      { regolith: 0, science: 0, power: 0 },
      { regolith: 35, science: 5, power: 16 },
      { regolith: 75, science: 11, power: 28 },
    ],
    assignedAstronaut: null,
  },
  shelter: {
    id: "shelter",
    name: "Radiation Storm Vault",
    level: 1,
    maxLevel: 3,
    levelNames: ["Water-Jacket Vault", "Sintered Regolith Bunker", "Electromagnetic Shield Grid"],
    levelDescriptions: [
      "Surrounded by water storage tanks. Absorbs 65% of solar protons.",
      "Buried beneath 3 meters of moon dust. Blocks 88% of radiation.",
      "Active magnetic deflection coils. Deflects 98% of solar cosmic rays!",
    ],
    upgradeCosts: [
      { regolith: 0, science: 0, power: 0 },
      { regolith: 40, science: 6, power: 14 },
      { regolith: 80, science: 12, power: 30 },
    ],
    assignedAstronaut: null,
  },
};

export const ASTRONAUT_REQUEST_DECK = [
  {
    id: "maya_cme_storm",
    astronautId: "maya",
    title: "DONKI Alert: Coronal Mass Ejection Detected!",
    situation:
      "Flight Director! NASA's DONKI space weather feed reports an X-class solar flare and CME heading straight for our crater. How do we reinforce our defense before proton impact?",
    priority: "emergency",
    choices: [
      {
        id: "maya_regolith_bunker",
        label: "Pile 30 Regolith over the bunker roof",
        hint: "Costs 30 Regolith, 100% crew safety, zero power drained",
        cost: { regolith: 30 },
        reward: { health: 5, morale: 8 },
        astronautReaction:
          "Maya: Outstanding call! The 2-meter lunar regolith layer completely stopped the solar protons. Crew radiation dose remained zero!",
        nasaLesson:
          "Moon regolith is rich in basalt and iron oxides, making it a superb natural radiation shield that doesn't need to be launched from Earth.",
      },
      {
        id: "maya_magnetic_deflector",
        label: "Overcharge the storm shelter's water shield",
        hint: "Costs 25 Power & 10 Water, saves regolith for building",
        cost: { power: 25, water: 10 },
        reward: { health: 2, morale: 5 },
        astronautReaction:
          "Maya: Water jacket pumps ran at max pressure! The proton storm washed right over us without harming the habitat.",
        nasaLesson:
          "Hydrogen atoms in water molecules are the ideal atomic mass for stopping high-energy protons, making water tanks dual-purpose shields.",
      },
      {
        id: "maya_ev_risk",
        label: "Hunker down in bunks with minimal shielding",
        hint: "Free on resources, but crew absorbs a noticeable radiation dose",
        cost: {},
        reward: { health: -12, morale: -10, science: 2 },
        astronautReaction:
          "Maya: The storm hit hard. Our dosimeters clicked loudly. We took about 15 mSv of radiation before the flare subsided.",
        nasaLesson:
          "Radiation doses compound over an astronaut's career. Exceeding permissible limits cuts an astronaut's maximum flight duration.",
      },
    ],
  },
  {
    id: "maya_ice_cavity",
    astronautId: "maya",
    title: "Radar Ping: Deep Crater Water Ice Deposit!",
    situation:
      "My ground-penetrating radar just returned a massive dielectric reflection 300 meters inside the shadowed crater wall! It's an untouched deposit of lunar water ice. What is your order?",
    priority: "opportunity",
    choices: [
      {
        id: "maya_full_drill",
        label: "Dispatch the rover to extract a core sample (+35 Water)",
        hint: "Costs 15 Power & 10 Regolith, yields huge water & science",
        cost: { power: 15, regolith: 10 },
        reward: { water: 35, science: 6, morale: 10 },
        astronautReaction:
          "Maya: Success! We extracted a 2-meter cylinder of pristine ancient lunar ice! Melting it adds 35L to our life support reserves!",
        nasaLesson:
          "In-Situ Resource Utilization (ISRU): Extracting water on the Moon saves $10,000+ per kilogram in rocket launch costs from Earth.",
      },
      {
        id: "maya_photo_survey",
        label: "Scan with the flying drone only (+3 Science)",
        hint: "Costs 5 Power, saves water extraction for later",
        cost: { power: 5 },
        reward: { science: 3, morale: 2 },
        astronautReaction:
          "Maya: The drone captured high-res multispectral imagery. Earth mission science confirmed the ice coordinates for future Sols.",
        nasaLesson:
          "Orbital and drone surveys allow mission planners to map resources safely before risking heavy drilling equipment in extreme cold.",
      },
    ],
  },
  {
    id: "alex_solar_dust",
    astronautId: "alex",
    title: "Solar Arrays Coated in Electrostatic Moon Dust!",
    situation:
      "Flight Director! The lunar terminator kicked up electrostatically levitated dust. It's clinging to our solar arrays, cutting power production by 40%! How should we clean them?",
    priority: "emergency",
    choices: [
      {
        id: "alex_ultrasonic_pulse",
        label: "Fire the ultrasonic piezoelectric vibration pulse",
        hint: "Costs 14 Power, instantly clears panels with zero risk",
        cost: { power: 14 },
        reward: { power: 25, morale: 5 },
        astronautReaction:
          "Alex: Buzzing with high frequency shook the charged dust right off! Solar generation is back to 100% capacity!",
        nasaLesson:
          "NASA develops electrodynamic dust shields (EDS) that use electric fields to levitate and slide dust off glass without mechanical wipers.",
      },
      {
        id: "alex_eva_brush",
        label: "Alex suits up for a manual spacewalk to brush them",
        hint: "Saves power, but uses 8 Oxygen and tires Alex out",
        cost: {},
        reward: { oxygen: -8, health: -4, power: 20, morale: 3 },
        astronautReaction:
          "Alex: Spacewalk was tough—lunar regolith is like crushed glass. But the panels are spotless and power is restored!",
        nasaLesson:
          "Spacewalks (EVAs) burn physical energy and oxygen rapidly. Astronauts plan every EVA down to the minute to balance fatigue.",
      },
      {
        id: "alex_rover_sweep",
        label: "Direct the automated rover to sweep with its brush arm",
        hint: "Costs 8 Power & 5 Regolith for brush wear",
        cost: { power: 8, regolith: 5 },
        reward: { power: 22, morale: 6 },
        astronautReaction:
          "Alex: Rover autonomous routine executed flawlessly! Robotics keeping humans safe inside the habitat.",
        nasaLesson:
          "Rovers handle hazardous or repetitive surface tasks, freeing astronauts for complex scientific analysis inside pressurized modules.",
      },
    ],
  },
  {
    id: "alex_airlock_leak",
    astronautId: "alex",
    title: "Micro-Meteoroid Hull Breach at Airlock Bravo!",
    situation:
      "Klaxon alert! A hypervelocity dust grain punctured the outer hatch seal of Airlock Bravo. Air is hissing out at 2 liters per minute. What's your repair plan?",
    priority: "emergency",
    choices: [
      {
        id: "alex_sintered_weld",
        label: "Apply molten regolith resin sealant with laser torch",
        hint: "Costs 15 Regolith & 12 Power, permanently reinforces the seal",
        cost: { regolith: 15, power: 12 },
        reward: { oxygen: 5, morale: 8, health: 3 },
        astronautReaction:
          "Alex: Sealed tight! The fused regolith patch is actually stronger than the original titanium frame. Hull integrity 100%!",
        nasaLesson:
          "NASA researchers melt lunar regolith with microwaves or lasers to create rock-solid ceramic structures, tiles, and landing pads.",
      },
      {
        id: "alex_seal_hatch",
        label: "Emergency seal the bulkhead door and vent the airlock",
        hint: "Costs 12 Oxygen, saves materials but loses air",
        cost: {},
        reward: { oxygen: -14, morale: -5 },
        astronautReaction:
          "Alex: Closed the blast door. The leak is isolated, but we vented 14% of our precious airlock atmosphere into the lunar vacuum.",
        nasaLesson:
          "Compartmentalization in spacecraft design ensures that a puncture in one module doesn't depressurize the entire outpost.",
      },
    ],
  },
  {
    id: "samira_crop_harvest",
    astronautId: "samira",
    title: "Bumper Harvest in the Aeroponic Greenhouse!",
    situation:
      "Flight Director! Our aeroponic lunar potatoes and micro-radishes grew 30% faster thanks to the 24-hour polar sunlight cycle! How should we allocate this bounty?",
    priority: "opportunity",
    choices: [
      {
        id: "samira_fresh_feast",
        label: "Serve a fresh feast for the crew (+20 Morale & +10 Health)",
        hint: "Huge boost to crew vitality, reduces stress",
        cost: {},
        reward: { morale: 20, health: 10, oxygen: 5 },
        astronautReaction:
          "Samira: Maya and Alex were overjoyed! Fresh crunchy greens after weeks of freeze-dried paste gave the whole base a massive morale surge!",
        nasaLesson:
          "NASA's Veggie experiment on the ISS demonstrated that growing and eating fresh vegetables is vital for psychological well-being on deep space voyages.",
      },
      {
        id: "samira_bioreactor_fuel",
        label: "Compost into the closed-loop bioreactor (+18 Water & +10 O2)",
        hint: "Converts harvest into critical life-support consumables",
        cost: {},
        reward: { water: 18, oxygen: 10, science: 3 },
        astronautReaction:
          "Samira: Channeled the biomass into our Sabatier recycling system. Recovered 18 liters of pure water and extra breathable oxygen!",
        nasaLesson:
          "Closed-loop life support (ECLSS) recycles organic waste, transpiration humidity, and carbon dioxide to minimize resupply requirements.",
      },
    ],
  },
  {
    id: "samira_recycler_jam",
    astronautId: "samira",
    title: "Water Filtration Membrane Jammed!",
    situation:
      "The condensation recovery pump has calcium salt buildup from recycled sweat and humidity. Without filtration, water consumption will double today. What should we do?",
    priority: "emergency",
    choices: [
      {
        id: "samira_acid_flush",
        label: "Flush membrane with heated citric acid solution",
        hint: "Costs 14 Power & 6 Water, restores recycler to 100%",
        cost: { power: 14, water: 6 },
        reward: { water: 20, morale: 6 },
        astronautReaction:
          "Samira: The descaling flush dissolved the mineral deposits! The water recovery loop is purer than bottled spring water on Earth.",
        nasaLesson:
          "The ISS Water Recovery System purifies urine and sweat into drinking water with 98% efficiency using distillation and catalytic oxidation.",
      },
      {
        id: "samira_sponge_ration",
        label: "Ration water strictly and switch to emergency reserves",
        hint: "Free on power, but drains water reserves and crew morale",
        cost: {},
        reward: { water: -16, morale: -8 },
        astronautReaction:
          "Samira: We're on strict sponge-bath rations. Crew is thirsty and spirits are down, but we kept the power bus online.",
        nasaLesson:
          "Water rationing is standard protocol when primary scrubbers fail, buying time for engineering teams to diagnose anomalies.",
      },
    ],
  },
];
