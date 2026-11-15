# ASTRA — Junior Astronaut Mission Trainer

An interactive, educational space-survival simulation built for the NASA Space Apps Challenge 2026 **“Build a Junior Astronaut Mission Trainer.”**

You command a 3-astronaut research outpost on the **Moon** (Lunar South Pole, *First Light*) or **Mars** (Ares Planitia, *Beyond Earth*) for **30 mission Sols** (10–12 in Kid Mode). The only question that matters:

> **Can I keep my astronauts alive for another Sol?**

## How to run

```bash
npm install
npm run dev
```

Open the local URL shown (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## How to play

### Goal
Survive **30 Sols** (Moon/Mars) — or **10–12 Sols** in Kid Mode — with oxygen, water, food, power and crew health still viable. Score weights **crew survival and health above all**, with science and emergency performance as bonuses.

### Launch
1. On the ASTRA home page, choose your **destination** (LUNAR or MARS).
2. Choose a **difficulty**:
   - **Explorer** — forgiving supplies & timers, meant for learning
   - **Survival** — balanced, the intended experience (supplies cover roughly a full 30-Sol mission with careful recycling; Mars needs load shedding)
   - **Mission Commander** — limited supplies, harsher emergencies (hard)
   - **Kid Mode** — 10–12 Sols, three big gauges (Air / Food &amp; Water / Power) and plain-language labels
3. Enter your **astronaut callsign** and click **ENTER MISSION**.

### The core loop (each Sol)
1. Inspect **Mission Control**: day/phase, crew health, resources, environment.
2. Adjust equipment (ON/OFF) and repair systems with **spare parts**.
3. Send the **rover** on surveys (science, lunar water-ice, Mars CO₂→O₂ ISRU study).
4. Manage atmosphere: **oxygen concentration**, **CO₂ ppm**, **cabin pressure**, **humidity**, **waste**.
5. **Let time run.** Mission time advances on its own — there is no “advance day” button. One Sol takes **24 real seconds** at 1× (1 real second = 1 mission hour), so a 30-Sol campaign is about a **12-minute** session. Use **Pause** and **1× / 2× / 4×** to control the pace.
6. **Watch for crew reports.** Every **10–15 real seconds** an astronaut raises a maintenance issue. Their avatar pops up below the base view, and a clickable **warning marker** appears on the surface scene. Click the marker (or the popup / sidebar card) to open a full-screen **transmission** with the full-body astronaut, a message box, an urgency meter and the response choices. The astronaut’s face reacts to urgency — concerned for warnings, alarmed for emergencies — and crew faces in the base scene show stress too. These are quick, small-stakes trade-offs; full emergencies pause time and demand a decision.
7. Resolve emergencies — each option states **what it protects / saves / costs**; answer order is shuffled, and “do nothing” choices were replaced by real trade-offs (e.g. “save power but lose air”). Mission time pauses while an emergency is waiting for your decision.

### What the sim models
- **Power:** solar generation depends on sunlight, panel condition, dust and mission (Mars runs **below** demand — choose what to switch off). Battery stores surplus and takes the strain. Critical life support keeps priority, important systems are throttled under low reserve, and **optional science/comms/lighting loads (10 power/day)** can be shed — research pauses while they are off.
- **Life support:** oxygen generation and **CO₂ removal are separate systems** — a scrubber is required even if O₂ is fine.
- **Atmosphere:** O₂ concentration, CO₂ ppm, cabin pressure, humidity, cabin temperature vs outside.
- **Crew:** individual health, fatigue, stress, hydration, nutrition, cumulative **radiation dose** — shielding reduces it, but dose accumulates over the mission and damages health at high levels (warning ~120, danger ~260, critical ~400).
- **Food:** the hydroponic greenhouse needs power, water and **three Sols of growing time** before the first harvest; it does not produce food instantly.
- **Lunar night:** Sols ~7–12 on the Moon see ~no sunlight; everything runs on battery.
- **Mars light-time:** 4–24 minutes one-way. **ASK EARTH** contacts Earth — but the advisory arrives a Sol or two later, never in time for live rescue.
- **Archived storms:** DONKI/CCMC space-weather events (Oct 2003 X17, Sep 2017 X9.3, May 2024 Gannon G5, Jul 2012 near-Carrington CME) replay on scripted Sols, labeled archived.

### Failure & success
- **Success:** all crew alive at the end of the Sols.
- **Failure:** all crew lost, oxygen/water/food exhausted, or total power loss (electricity 0 and battery 0).

## What’s real vs simplified
In-game **About the Data** tab (Mission Control → About the Data) lists it plainly — archived NASA DONKI/BVAD science, dose accumulation and shielding, the Moon’s south-pole insolation/ice physics, Mars’s thin CO₂ air and light-time, vs game-unit scaling, compressed time and scripted events.

## Data persistence
Mission state is saved in the browser (`LocalStorage`, key `astra-mission-state-v2`). Refresh keeps progress; **Restart Mission** resets the run. Older saves are normalized on load (mission length, greenhouse growth, storm history, crew tasks, optional loads), so a legacy run can still finish.

## NASA references (archived, educational use)
- **NASA BVAD (NTRS 20210024855)** — baseline crew consumables & life-support
- **NASA DONKI (CCMC)** — space-weather catalog used for the archived storm Sols
- **MSL RAD** — Mars surface radiation context
- **NASA Moon Trek** — South Pole illumination / permanently shadowed regions context

> This is an educational simulation for the Space Apps Challenge — not a real mission-planning or safety tool.
