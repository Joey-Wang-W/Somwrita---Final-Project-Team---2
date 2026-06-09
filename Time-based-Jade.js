// =========================================================================
// AI acknowledgement: This file was updated with the help of Gemini.
// It limits the heartbeat pulse amplitude and time evolution scaling 
// strictly between 0.3 and 1.5 to prevent visual exaggeration at maximum slider values.
// =========================================================================

const JADE_BASE_PHASE_DUR = 8.0;
const JADE_BASE_TRANS_DUR = 2.5;

const JADE_PHASES = [
  {
    name: 'BURST',
    radiusScale: 1.05, timeScale: 1.2,
    haloR: 72,  haloG: 210, haloB: 25,
    haloRadius: 240, haloCount: 3, haloAlpha: 110,
    partR: 205, partG: 238, partB: 185,
    particleCount: 60, particleRadius: 215, particleSize: 3.2,
    rotSpeed: 0.0018,
  },
  {
    name: 'PETAL',
    radiusScale: 0.88, timeScale: 0.7,
    haloR: 26,  haloG: 158, haloB: 52,
    haloRadius: 210, haloCount: 2, haloAlpha: 85,
    partR: 228, partG: 242, partB: 212,
    particleCount: 45, particleRadius: 192, particleSize: 2.8,
    rotSpeed: 0.0014,
  },
  {
    name: 'ELONGATE',
    radiusScale: 1.12, timeScale: 0.9,
    haloR: 18,  haloG: 180, haloB: 195,
    haloRadius: 265, haloCount: 4, haloAlpha: 135,
    partR: 148, partG: 222, partB: 12,
    particleCount: 70, particleRadius: 235, particleSize: 3.0,
    rotSpeed: 0.0022,
  },
  {
    name: 'SPIRAL',
    radiusScale: 1.00, timeScale: 1.5,
    haloR: 8,   haloG: 100, haloB: 130,
    haloRadius: 230, haloCount: 3, haloAlpha: 105,
    partR: 95,  partG: 200, partB: 22,
    particleCount: 55, particleRadius: 208, particleSize: 3.2,
    rotSpeed: 0.0025,
  },
  {
    name: 'TORUS',
    radiusScale: 0.82, timeScale: 1.8,
    haloR: 42,  haloG: 165, haloB: 38,
    haloRadius: 250, haloCount: 5, haloAlpha: 145,
    partR: 202, partG: 230, partB: 195,
    particleCount: 80, particleRadius: 222, particleSize: 2.5,
    rotSpeed: 0.0020,
  },
  {
    name: 'BUTTERFLY',
    radiusScale: 1.08, timeScale: 0.6,
    haloR: 142, haloG: 220, haloB: 150,
    haloRadius: 275, haloCount: 2, haloAlpha: 95,
    partR: 232, partG: 170, partB: 192,
    particleCount: 50, particleRadius: 245, particleSize: 3.8,
    rotSpeed: 0.0016,
  },
  {
    name: 'NEBULA',
    radiusScale: 0.92, timeScale: 2.0,
    haloR: 172, haloG: 128, haloB: 198,
    haloRadius: 295, haloCount: 6, haloAlpha: 55,
    partR: 222, partG: 152, partB: 178,
    particleCount: 88, particleRadius: 262, particleSize: 2.0,
    rotSpeed: 0.0012,
  },
  {
    name: 'BLOOM',
    radiusScale: 1.15, timeScale: 0.5,
    haloR: 65,  haloG: 36,  haloB: 152,
    haloRadius: 228, haloCount: 4, haloAlpha: 125,
    partR: 132, partG: 222, partB: 78,
    particleCount: 65, particleRadius: 202, particleSize: 3.0,
    rotSpeed: 0.0020,
  },
];

// Globals read by sketch.js each frame
let jade_radiusScale = 1.0;
let jade_timeScale   = 1.0;

// Internal
let jade_customT = 0; 
let jade_ringAngle = 0;
let jade_lastState = null;

// ── State computation ─────────────────────────────────────────────────────
function _jadeGetState() {
  const ev = (typeof emotionValue !== 'undefined') ? emotionValue : 0;

  // Adjust phase duration bounds to prevent abrupt transitions
  const durScale = jademap(ev, -1, 1, 1.8, 0.5);
  const phaseDur = JADE_BASE_PHASE_DUR * durScale;
  const transDur = JADE_BASE_TRANS_DUR * durScale;
  const cycleDur = phaseDur + transDur;
  const totalDur = JADE_PHASES.length * cycleDur;

  const t  = jade_customT;
  const tm = t % totalDur;

  const idx = floor(tm / cycleDur) % JADE_PHASES.length;
  const ph  = tm - idx * cycleDur;
  const ni  = (idx + 1) % JADE_PHASES.length;
  const cur = JADE_PHASES[idx];
  const nxt = JADE_PHASES[ni];

  let blendT = 0;
  if (ph >= phaseDur) {
    blendT = jadeSmootherstep((ph - phaseDur) / transDur);
  }

  const L = (a, b) => jadelerpVal(a, b, blendT);

  // Damped emotion modifiers to prevent extreme visual snapping
  const emotionRadMod  = jademap(ev, -1, 1, 0.95, 1.05);
  const emotionTimeMod = jademap(ev, -1, 1, 0.5, 1.0);

  // Toned down heartbeat pulse frequency and amplitude maximums
  const breathFreq = jademap(ev, -1, 1, 0.5, 1.0);
  const breathAmp  = jademap(ev, -1, 1, 0.02, 0.05);
  const breath     = sin(t * breathFreq) * breathAmp;

  const bright = jademap(ev, -1, 1, 0.6, 1.2);

  return {
    name:       blendT < 0.5 ? cur.name : nxt.name,
    t, ev, bright,
    radiusScale:  (L(cur.radiusScale, nxt.radiusScale) + breath) * emotionRadMod,
    mutTimeScale: L(cur.timeScale, nxt.timeScale) * emotionTimeMod,
    haloR:      L(cur.haloR,      nxt.haloR),
    haloG:      L(cur.haloG,      nxt.haloG),
    haloB:      L(cur.haloB,      nxt.haloB),
    haloRadius: L(cur.haloRadius, nxt.haloRadius),
    haloCount:  L(cur.haloCount,  nxt.haloCount),
    haloAlpha:  L(cur.haloAlpha,  nxt.haloAlpha),
    partR:          L(cur.partR,          nxt.partR),
    partG:          L(cur.partG,          nxt.partG),
    partB:          L(cur.partB,          nxt.partB),
    particleCount:  Math.round(L(cur.particleCount,  nxt.particleCount)),
    particleRadius: L(cur.particleRadius, nxt.particleRadius),
    particleSize:   L(cur.particleSize,   nxt.particleSize),
    rotSpeed:       L(cur.rotSpeed,       nxt.rotSpeed),
  };
}

// =========================================================================
// applyJadeColour()
// =========================================================================
function applyJadeColour() {
  const ev = (typeof emotionValue !== 'undefined') ? emotionValue : 0;

  // Constrained local clock progression strictly between 0.3 and 1.0
  const timeFactor = jademap(ev, -1, 1, 0.3, 1.0);
  jade_customT += (deltaTime / 1000.0) * timeFactor;

  jade_lastState   = _jadeGetState();
  jade_radiusScale = jade_lastState.radiusScale;
  jade_timeScale   = jade_lastState.mutTimeScale;
  
  jade_ringAngle   += jade_lastState.rotSpeed * timeFactor;
}

// =========================================================================
// displayJadeLayer()
// =========================================================================
function displayJadeLayer() {
  const s      = jade_lastState || _jadeGetState();
  const bright = s.bright;

  push();
  noFill();

  // Halo rings on XZ plane
  const ringCount = Math.round(s.haloCount);
  for (let r = 0; r < ringCount; r++) {
    const rr    = s.haloRadius + r * 20;
    const alpha = s.haloAlpha * (1.0 - r * 0.20) * bright;
    const pulse = sin(s.t * 1.1 + r * 1.0) * 14;
    strokeWeight(r === 0 ? 1.4 : 0.8);
    stroke(s.haloR, s.haloG, s.haloB, alpha);
    beginShape();
    for (let k = 0; k <= 72; k++) {
      const a = (k / 72) * TWO_PI;
      vertex((rr + pulse) * cos(a), 0, (rr + pulse) * sin(a));
    }
    endShape(CLOSE);
  }

  // Orbital particle ring
  strokeWeight(s.particleSize);
  for (let p = 0; p < s.particleCount; p++) {
    const angle  = (p / s.particleCount) * TWO_PI + jade_ringAngle;
    const wobble = sin(s.t * 0.85 + p * 0.38) * 14;
    const pr     = s.particleRadius + wobble;
    const facingAlpha = map(cos(angle - jade_ringAngle), -1, 1, 35, 175) * bright;
    stroke(p % 3 === 0 ? s.haloR : s.partR,
           p % 3 === 0 ? s.haloG : s.partG,
           p % 3 === 0 ? s.haloB : s.partB,
           facingAlpha);
    point(pr * cos(angle), 0, pr * sin(angle));
  }

  pop();
}

// ── Helpers ───────────────────────────────────────────────────────────────
function jadelerpVal(a, b, t) { return a + (b - a) * t; }
function jademap(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}
function jadeSmootherstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * t * (t * (6 * t - 15) + 10);
}