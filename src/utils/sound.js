// Web Audio API procedural sound engine - zero external asset dependencies
// Works completely offline and on any modern browser

let ctx = null;
let isMuted = false;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuted() {
  return isMuted;
}

// Gentle interface click
export function playClick() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  const now = c.currentTime;

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

// Apollo-style Quindar radio beep for astronaut transmission popups
export function playRadioChirp() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "sine";
  // Classic 2524Hz Quindar intro beep tone
  osc.frequency.setValueAtTime(2524, now);

  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

// Construction / Building placement sound
export function playBuild() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.19);
}

// Upgrade completed sound (Clash of Clans / SimCity style triumphant ding)
export function playUpgrade() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const freqs = [440, 554.37, 659.25, 880];

  freqs.forEach((f, idx) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const startTime = now + idx * 0.07;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, startTime);

    gain.gain.setValueAtTime(0.14, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.26);
  });
}

// Resource collection bubble pop
export function playResourceCollect() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

// Alarm / Siren for Solar Storm (SEP) warning or blackouts
export function playAlarm() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const count = 3;

  for (let i = 0; i < count; i++) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const startTime = now + i * 0.28;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.linearRampToValueAtTime(587, startTime + 0.22);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.26);
  }
}

// Rewarding cheerful chime for smart choices or scientific discovery
export function playGoodChoice() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, idx) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const startTime = now + idx * 0.09;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.36);
  });
}

// Low warning buzz for risky moves or brownouts
export function playWarning() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.35);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.42);
}

// Triumphant fanfare for mission completion / high rating
export function playFanfare() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const notes = [
    { f: 523.25, d: 0.15, delay: 0 },
    { f: 659.25, d: 0.15, delay: 0.15 },
    { f: 783.99, d: 0.15, delay: 0.3 },
    { f: 1046.5, d: 0.5, delay: 0.45 },
  ];

  notes.forEach((n) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const startTime = now + n.delay;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(n.f, startTime);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.d);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + n.d + 0.05);
  });
}
