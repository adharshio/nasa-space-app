# Junior Astronaut Mission Trainer

A web app built for the NASA Space Apps Challenge 2026 challenge **"Build a Junior Astronaut Mission Trainer"**.

Run a **Moon South Pole outpost** for 30 days and balance competing demands—**power, oxygen, water, food, and radiation shielding**—to keep your crew alive through mission events inspired by archived NASA data/context.

## How to run

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

## How to play

### Objective
Survive **30 mission days** at the lunar outpost. The mission succeeds if you reach the end with your crew still alive and critical supplies above zero.

### Mission setup
1. On the **Mission Briefing** screen, choose a **crew size (2–6)**.
   - Larger crews consume oxygen, water, and food faster and increase power demand.
2. Click **Start Mission**.

### Resources
Keep these above **0** (or you lose):

- **Power** – generated daily from solar (simplified Moon South Pole assumption) and spent by habitat/systems/actions.
- **Oxygen** – life support breathable supply (daily consumption per crew, with recycling assist).
- **Water** – drinking and systems (daily consumption per crew, with recycling assist).
- **Food** – crew nutrition (daily consumption per crew, with greenhouse supplement).
- **Shielding** – protection against radiation; low shielding harms crew health over time.
- **Crew Health** – overall condition; reaches 0 if hazards/supply failures are not managed.

### Each day (turn)
1. **(Optional) Take one outpost action** to respond to your current margins:
   - **Boost Power:** `+10 Power`, `-1 Food`
   - **Tend Greenhouse:** `+8 Food`, `-3 Water`, `-3 Power`
   - **Maintain Shielding:** `+8 Shielding`, `-4 Power`
   - **Optimize Recycling:** `+6 Oxygen`, `+6 Water`, `-5 Power`
   > You can click actions to adjust before advancing; watch the bars because actions have costs.
2. **Click "Advance Day"** to simulate the day:
   - Daily solar gain and baseline/crew power use are applied.
   - Crew consumes oxygen, water, and food (with partial recycling/greenhouse offsets).
   - Low power reduces life-support effectiveness; low shielding damages health.
3. **Resolve events when they appear:** on certain days you’ll get a scenario event with 2 choices. Each choice shows its trade-offs and the **archived NASA data/context** that informed it. Pick the option that best fits your situation.

### Winning and losing
- **Win:** Survive all 30 days. A score is calculated from your final resource/health levels.
- **Lose:** Mission ends immediately if **Crew Health, Oxygen, Water, or Food** reaches 0. You can click **Play Again** to retry.

### Tips
- Don’t let **Power** fall too low—power shortages hit oxygen/water and health.
- Invest in **Shielding** before/after radiation-related events.
- Treat events as trade-offs: preserving one resource often costs another.

## NASA data & references (archived, educational use)
The simulation uses **simplified, archived/public reference context** (not live feeds) to drive gameplay and learning:

- **NASA BVAD (NTRS 20210024855):** baseline crew consumables/life-support assumptions inform per-crew consumption and supply trade-offs. https://ntrs.nasa.gov/citations/20210024855
- **NASA DONKI (CCMC):** space weather events (e.g. solar energetic particles) inform radiation-hazard scenarios (curated/archived examples). https://kauai.ccmc.gsfc.nasa.gov/DONKI/
- **MSL RAD / PDS (archived context):** Mars surface radiation measurements provide context for radiation risk framing. https://pds-ppi.igpp.ucla.edu/search/view/?f=yes&id=pds://PPI/MSL-M-RAD-3-RDR-V1.0
- **NASA Moon Trek (archived layer context):** south-pole illumination/Earth-visibility context informs power/operations assumptions for the lunar scenario. https://trek.nasa.gov/moon/

> This is an educational game for the challenge, not a real mission planning or safety tool.
