// =========================================================================
// AI acknowledgement: This file was updated with the help of Codex.
// Audio-driven mechanism
// Creator: Ying Hu
// Function:
// - Read the shared HTML emotion slider from sketch.js: emotionValue (-1..1)
// - Crossfade several heartbeat audio tracks across the emotion range
// - Analyze the active audio mix and output an activity level for the sphere
// =========================================================================

let ying_fft;
let ying_audioActivity = 0.02;
let ying_sounds = {};
let ying_started = false;
let ying_currentColor = [80, 180, 255];

// -1 = unpleasant, 0 = neutral/calm, 1 = pleasant.
const ying_emotionStops = [
  {
    name: 'sad',
    value: -1.0,
    file: 'sounds/heartbeat_sad.mp3',
    color: [90, 105, 225],
    boost: 1.15
  },
  {
    name: 'anxious',
    value: -0.35,
    file: 'sounds/heartbeat_anxious.mp3',
    color: [210, 80, 135],
    boost: 2.35
  },
  {
    name: 'calm',
    value: 0.25,
    file: 'sounds/heartbeat_calm.mp3',
    color: [80, 190, 255],
    boost: 1.45
  },
  {
    name: 'excited',
    value: 1.0,
    file: 'sounds/heartbeat_excited.mp3',
    color: [255, 205, 55],
    boost: 4.75
  }
];

function preloadAudio() {
  for (const stop of ying_emotionStops) {
    loadYingSound(stop);
  }
}

function setupAudio() {
  // define a p5 preload() hook.
  for (const stop of ying_emotionStops) {
    if (!ying_sounds[stop.name]) {
      loadYingSound(stop);
    }
  }

  ying_fft = new p5.FFT(0.82, 64);
  startYingAudio();
}

function loadYingSound(stop) {
  ying_sounds[stop.name] = loadSound(stop.file, () => {
    if (ying_started) {
      prepareYingSound(stop);
      updateAudioMix();
    }
  });
}

function prepareYingSound(stop) {
  const sound = ying_sounds[stop.name];
  if (!sound || !sound.isLoaded()) return false;

  sound.setVolume(0);
  if (!sound.isPlaying()) {
    sound.loop();
  }

  return true;
}

function startYingAudio() {
  // a user gesture before the audio context is allowed to make sound.
  userStartAudio();

  for (const stop of ying_emotionStops) {
    prepareYingSound(stop);
  }

  const firstSound = ying_sounds[ying_emotionStops[0].name];
  if (firstSound) {
    ying_fft.setInput(firstSound);
  }

  ying_started = true;
  updateAudioMix();
}

function yingSmoothstep(t) {
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function getYingEmotionValue() {
  if (typeof emotionValue === 'number') {
    return constrain(emotionValue, -1, 1);
  }

  const slider = document.getElementById('emotion-slider');
  if (slider) {
    return constrain(Number(slider.value), -1, 1);
  }

  return 0;
}

function getYingMix(v) {
  const weights = {};

  for (let i = 0; i < ying_emotionStops.length; i++) {
    weights[ying_emotionStops[i].name] = 0;
  }

  if (v <= ying_emotionStops[0].value) {
    weights[ying_emotionStops[0].name] = 1;
    return weights;
  }

  const last = ying_emotionStops[ying_emotionStops.length - 1];
  if (v >= last.value) {
    weights[last.name] = 1;
    return weights;
  }

  for (let i = 0; i < ying_emotionStops.length - 1; i++) {
    const left = ying_emotionStops[i];
    const right = ying_emotionStops[i + 1];

    if (v >= left.value && v <= right.value) {
      const t = yingSmoothstep((v - left.value) / (right.value - left.value));
      weights[left.name] = 1 - t;
      weights[right.name] = t;
      return weights;
    }
  }

  weights.calm = 1;
  return weights;
}

function getWeightedAudioProperty(weights, key) {
  let total = 0;

  for (const stop of ying_emotionStops) {
    total += stop[key] * (weights[stop.name] || 0);
  }

  return total;
}

function getWeightedColor(weights) {
  const color = [0, 0, 0];

  for (const stop of ying_emotionStops) {
    const weight = weights[stop.name] || 0;
    color[0] += stop.color[0] * weight;
    color[1] += stop.color[1] * weight;
    color[2] += stop.color[2] * weight;
  }

  return color;
}

function getDominantYingSound(weights) {
  let strongestStop = ying_emotionStops[0];
  let strongestWeight = -1;

  for (const stop of ying_emotionStops) {
    const weight = weights[stop.name] || 0;
    if (weight > strongestWeight) {
      strongestWeight = weight;
      strongestStop = stop;
    }
  }

  return ying_sounds[strongestStop.name];
}

function updateAudioMix() {
  const emotion = getYingEmotionValue();
  const weights = getYingMix(emotion);

  for (const stop of ying_emotionStops) {
    const sound = ying_sounds[stop.name];
    if (sound) {
      sound.setVolume(weights[stop.name] || 0, 0.18);
    }
  }

  const dominantSound = getDominantYingSound(weights);
  if (dominantSound) {
    ying_fft.setInput(dominantSound);
  }

  ying_currentColor = getWeightedColor(weights);
  return weights;
}

function getYingAudio() {
  const weights = updateAudioMix();

  let spectrum = ying_fft ? ying_fft.analyze() : [];
  let bass = 0;
  let lowMid = 0;

  for (let i = 0; i < 8; i++) bass += spectrum[i] || 0;
  for (let i = 8; i < 18; i++) lowMid += spectrum[i] || 0;

  bass = bass / 8 / 255;
  lowMid = lowMid / 10 / 255;

  const rawEnergy = bass * 0.72 + lowMid * 0.28;
  const boost = getWeightedAudioProperty(weights, 'boost');
  const targetActivity = constrain(map(rawEnergy * boost, 0, 1, 0.02, 3.0), 0.02, 3.0);

  ying_audioActivity = lerp(ying_audioActivity, targetActivity, 0.12);
  return ying_audioActivity;
}

function triggerHeartbeatPulse() {
  startYingAudio();

  const cx = width / 2;
  const cy = height / 2;

  if (dist(mouseX, mouseY, cx, cy) < 220) {
    ying_audioActivity = min(ying_audioActivity + 0.8, 3.0);
  }
}

function drawEmotionUI() {
  // This function stays as a no-op so older sketches can still call it safely.
}