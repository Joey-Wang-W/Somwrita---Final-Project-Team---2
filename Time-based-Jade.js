// =========================================================================
// AI acknowledgement: This file was generated with the help of Claude.
// Time-based mechanic
// Creator: Jade
// Function:
// - Read the shared emotionValue from sketch.js (driven by #emotion-slider)
// - Drive 8 morphological phases using millis() as the sole time source
// - Output a time state object via getJadeTime() each frame,
//   mirroring the pattern of getYingAudio() in Audio Driven-YingHu.js
// - emotionValue modulates phase duration and mutation intensity:
//     -1 (unpleasant) -> faster cycle, stronger mutation, shorter hair
//      0 (neutral)    -> baseline rhythm
//     +1 (pleasant)   -> slower cycle, softer mutation, longer hair
//
// How to integrate (one line in sketch.js draw()):
//     let jadeState = getJadeTime();
//     myPlanet.setTimeState(jadeState);   // if OscilloscopeSphere supports it
// =========================================================================


// ── Time axis constants ───────────────────────────────────────────────────
const JADE_BASE_PHASE_DUR = 8.0;   // seconds each phase holds at emotionValue = 0
const JADE_BASE_TRANS_DUR = 2.5;   // seconds for cross-fade between phases

// ── 8 morphological phases (referenced from Heartbeat_Topography series) ─
// Each entry defines the target state for that phase.
// getJadeTime() interpolates between the current and next phase.
const JADE_PHASES = [
  {
    name:        'BURST',       // img1: exploding flower, hollow centre
    radiusScale:  1.00,
    colorShift:   0.10,
    mutationAmt:  0.55,
    hollowAmt:    0.55,         // large central void
    lobeAmt:      0.00,
    twistAmt:     0.00,
    hairLen:      0.90,         // long outward-radiating hair
    rotSpeed:     0.0018,
    palette: [[0,0,0],[12,85,8],[72,210,25],[205,238,185]],
  },
  {
    name:        'PETAL',       // img2: wide flat flower, split lobes
    radiusScale:  0.88,
    colorShift:   0.22,
    mutationAmt:  0.30,
    hollowAmt:    0.00,
    lobeAmt:      0.72,         // strong lobe split -> petal shape
    twistAmt:     0.00,
    hairLen:      0.65,
    rotSpeed:     0.0014,
    palette: [[2,20,5],[10,95,22],[26,158,52],[228,242,212]],
  },
  {
    name:        'ELONGATE',    // img3: vertical ellipse, large hollow
    radiusScale:  1.05,
    colorShift:   0.38,
    mutationAmt:  0.50,
    hollowAmt:    0.65,
    lobeAmt:      0.00,
    twistAmt:     0.00,
    hairLen:      1.00,         // longest hair
    rotSpeed:     0.0022,
    palette: [[4,38,48],[18,180,195],[148,222,12],[212,244,230]],
  },
  {
    name:        'SPIRAL',      // img4: near-circle with spiral twist
    radiusScale:  1.00,
    colorShift:   0.50,
    mutationAmt:  0.60,
    hollowAmt:    0.00,
    lobeAmt:      0.00,
    twistAmt:     0.68,
    hairLen:      0.75,
    rotSpeed:     0.0025,
    palette: [[0,18,32],[8,100,130],[95,200,22],[188,232,172]],
  },
  {
    name:        'TORUS',       // img5: donut ring, fully hollow centre
    radiusScale:  1.02,
    colorShift:   0.62,
    mutationAmt:  0.35,
    hollowAmt:    1.00,         // maximum void -> ring silhouette
    lobeAmt:      0.00,
    twistAmt:     0.92,         // strong twist creates ring gap
    hairLen:      0.48,
    rotSpeed:     0.0020,
    palette: [[0,0,0],[7,82,10],[42,165,38],[202,230,195]],
  },
  {
    name:        'BUTTERFLY',   // img6: bilateral wings, pinched waist
    radiusScale:  0.92,
    colorShift:   0.74,
    mutationAmt:  0.45,
    hollowAmt:    0.00,
    lobeAmt:      1.00,         // maximum lobe -> wing shape
    twistAmt:     0.00,
    hairLen:      0.80,
    rotSpeed:     0.0016,
    palette: [[28,62,32],[142,220,150],[232,170,192],[252,250,248]],
  },
  {
    name:        'NEBULA',      // img7: cloud puff, sparse scattered hair
    radiusScale:  0.82,         // body contracts, hair extends outward
    colorShift:   0.86,
    mutationAmt:  0.80,         // highest mutation -> most irregular shape
    hollowAmt:    0.00,
    lobeAmt:      0.25,
    twistAmt:     0.00,
    hairLen:      0.88,
    rotSpeed:     0.0012,
    palette: [[95,165,212],[222,152,178],[172,128,198],[254,246,250]],
  },
  {
    name:        'BLOOM',       // img8: dense sphere, rose-petal folds
    radiusScale:  1.00,
    colorShift:   1.00,
    mutationAmt:  0.40,
    hollowAmt:    0.00,
    lobeAmt:      0.00,
    twistAmt:     0.42,
    hairLen:      0.58,
    rotSpeed:     0.0020,
    palette: [[14,7,52],[65,36,152],[30,152,72],[132,222,78]],
  },
];

// =========================================================================
// getJadeTime()
// Call once per draw() frame, mirrors getYingAudio() in Audio Driven-YingHu.js
//
// Returns an object with:
//   phase          string name of the current morphological phase
//   phaseIndex     0-7
//   progress       0-1, hold period progress
//   transitionT    0-1, cross-fade blend factor (0 = pure current phase)
//   radiusScale    sphere radius multiplier (~0.6 to ~1.4)
//   colorShift     0-1, drives palette interpolation
//   mutationAmount 0-1, surface distortion intensity
//   hollowAmount   0-1, central void size
//   lobeAmount     0-1, petal / wing split strength
//   twistAmount    0-1, spiral twist strength
//   hairLength     0-1, hair strand length multiplier
//   rotSpeed       suggested Y-rotation increment per frame (radians)
//   palette        [[r,g,b] x4] interpolated colour set
//   t              raw elapsed time in seconds
//   emotionValue   current emotion reading (-1 to 1)
// =========================================================================
function getJadeTime() {

  // Read shared emotionValue written by the emotion slider in sketch.js.
  // Falls back to 0 (neutral) if not yet defined.
  const ev = (typeof emotionValue !== 'undefined') ? emotionValue : 0;

  // ── Scale cycle length by emotionValue ───────────────────────────────
  // -1 (unpleasant): 50% of base duration -> faster, more agitated rhythm
  //  0 (neutral):    100% base duration   -> normal rhythm
  // +1 (pleasant):   180% of base duration -> slower, more serene rhythm
  const timeScale = jademap(ev, -1, 1, 0.5, 1.8);
  const phaseDur  = JADE_BASE_PHASE_DUR * timeScale;
  const transDur  = JADE_BASE_TRANS_DUR * timeScale;
  const cycleDur  = phaseDur + transDur;
  const totalDur  = JADE_PHASES.length * cycleDur;

  // millis() is the sole time source for this mechanic
  const t   = millis() / 1000.0;
  const tm  = t % totalDur;

  const idx = floor(tm / cycleDur) % JADE_PHASES.length;
  const ph  = tm - idx * cycleDur;
  const ni  = (idx + 1) % JADE_PHASES.length;

  const cur  = JADE_PHASES[idx];
  const next = JADE_PHASES[ni];

  // blendT: 0 during hold period, ramps 0->1 during transition
  let blendT   = 0;
  let progress = min(ph / phaseDur, 1.0);

  if (ph >= phaseDur) {
    blendT   = jadeSmootherstep((ph - phaseDur) / transDur);
    progress = 1.0;
  }

  // ── Build state object ────────────────────────────────────────────────

  // Radius: interpolate targets + slow sine breath.
  // Breath amplitude is wider when unpleasant (tension) and
  // narrower when pleasant (ease), matching the emotional character.
  const radiusScale = jadelerpVal(cur.radiusScale, next.radiusScale, blendT)
                    + sin(t * 0.8) * jademap(ev, -1, 1, 0.12, 0.03);

  // Colour shift drifts continuously with time so colour never fully stops.
  // Faster drift when unpleasant, slower when pleasant.
  const colorShift = jadelerpVal(cur.colorShift, next.colorShift, blendT)
                   + t * jademap(ev, -1, 1, 0.05, 0.015);

  // Mutation scaled up for unpleasant (agitated) and down for pleasant (calm)
  const mutationAmount = jadelerpVal(cur.mutationAmt, next.mutationAmt, blendT)
                       * jademap(ev, -1, 1, 1.5, 0.6);

  // Hair length: shorter/denser when unpleasant, longer/airier when pleasant
  const hairLength = jadelerpVal(cur.hairLen, next.hairLen, blendT)
                   * jademap(ev, -1, 1, 0.7, 1.2);

  // Interpolated 4-colour palette [[r,g,b], ...]
  const palette = cur.palette.map((c, i) => [
    jadelerpVal(c[0], next.palette[i][0], blendT),
    jadelerpVal(c[1], next.palette[i][1], blendT),
    jadelerpVal(c[2], next.palette[i][2], blendT),
  ]);


  return {
    phase:         blendT < 0.5 ? cur.name : next.name,
    phaseIndex:    blendT < 0.5 ? idx : ni,
    progress,
    transitionT:   blendT,
    radiusScale,
    colorShift,
    mutationAmount,
    hollowAmount:  jadelerpVal(cur.hollowAmt, next.hollowAmt, blendT),
    lobeAmount:    jadelerpVal(cur.lobeAmt,   next.lobeAmt,   blendT),
    twistAmount:   jadelerpVal(cur.twistAmt,  next.twistAmt,  blendT),
    hairLength,
    rotSpeed:      jadelerpVal(cur.rotSpeed,  next.rotSpeed,  blendT),
    palette,
    t,
    emotionValue:  ev,
  };
}

// ── Private helpers (prefixed jade_ to avoid name collisions) ─────────────

// Linear interpolation between a and b by factor t
function jadelerpVal(a, b, t) {
  return a + (b - a) * t;
}

// Re-maps a value from one range to another (mirrors p5's map())
// Prefixed to avoid collision with p5's built-in map()
function jademap(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

// 5th-order smooth step — smoother than smoothstep, no velocity snap at ends
function jadeSmootherstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * t * (t * (6 * t - 15) + 10);
}