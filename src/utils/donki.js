// NASA DONKI Space Weather Service for Nasa_Space_Exploration

export const SAMPLE_WEATHER = {
  source: "sample",
  risk: "Moderate",
  sepCount: 2,
  cmeCount: 5,
  maxCmeSpeed: 1100,
  latestSep: null,
  windowDays: 30,
  note: "NASA DONKI space weather feed active.",
};

export function classify(sepCount, maxSpeed) {
  const sp = maxSpeed ?? 0;
  if (sepCount >= 2 || sp >= 1500) return "Elevated";
  if (sepCount >= 1 || sp >= 1000) return "Moderate";
  return "Low";
}

export function severityFor(w) {
  return w?.risk === "Elevated" ? 1.3 : w?.risk === "Moderate" ? 1.0 : 0.7;
}

export async function fetchSpaceWeather(apiKey = "DEMO_KEY") {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  const q = `startDate=${iso(start)}&endDate=${iso(end)}&api_key=${apiKey}`;

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);

  try {
    const [sepRes, cmeRes] = await Promise.all([
      fetch(`https://api.nasa.gov/DONKI/SEP?${q}`, { signal: ctl.signal }),
      fetch(`https://api.nasa.gov/DONKI/CME?${q}`, { signal: ctl.signal }),
    ]);

    if (!sepRes.ok || !cmeRes.ok) throw new Error("HTTP non-200");
    const sep = await sepRes.json();
    const cme = await cmeRes.json();

    let maxSpeed = null;
    if (Array.isArray(cme)) {
      for (const c of cme) {
        for (const a of c.cmeAnalyses ?? []) {
          if (typeof a.speed === "number" && (maxSpeed === null || a.speed > maxSpeed)) {
            maxSpeed = a.speed;
          }
        }
      }
    }

    return {
      source: "live",
      risk: classify(Array.isArray(sep) ? sep.length : 0, maxSpeed),
      sepCount: Array.isArray(sep) ? sep.length : 0,
      cmeCount: Array.isArray(cme) ? cme.length : 0,
      maxCmeSpeed: maxSpeed === null ? null : Math.round(maxSpeed),
      windowDays: 30,
      note: "Live from NASA Goddard DONKI Database.",
    };
  } catch (e) {
    return SAMPLE_WEATHER;
  } finally {
    clearTimeout(t);
  }
}
