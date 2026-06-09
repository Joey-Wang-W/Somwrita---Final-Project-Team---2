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
let ying_amplitude;
let ying_audioActivity = 0.02;
let ying_sounds = {};
let ying_started = false;
let ying_currentColor = [80, 180, 255];
let ying_pan = 0;
let ying_centroid = 0;

// Emotion stops for the shared slider.
// Each stop contains two audio layers:
// 1. heartbeatFile: the main sound, kept loud and used for analysis
// 2. backgroundFile: the mood layer, kept quieter so the heartbeat stays clear
// Slider values: -1 = unpleasant, 0 = neutral, 1 = pleasant.
const ying_emotionStops = [
  {
    name: 'unpleasant',
    value: -1.0,
    heartbeatFile: 'sounds/heartbeat_sad.mp3',
    backgroundFile: 'sounds/Sad background music.mp3',
    color: [90, 105, 225],
    boost: 1.15
  },
  {
    name: 'neutral',
    value: 0.0,
    heartbeatFile: 'sounds/heartbeat_calm.mp3',
    backgroundFile: 'sounds/calm background music.ogg',
    color: [80, 190, 255],
    boost: 1.45
  },
  {
    name: 'pleasant',
    value: 1.0,
    heartbeatFile: 'sounds/heartbeat_excited.mp3',
    backgroundFile: 'sounds/happy background music.mp3',
    color: [255, 205, 55],
    boost: 4.75
  }
];

// Background music supports the emotion but stays lower in the mix.
const ying_heartbeatVolume = 1.0;
const ying_backgroundVolume = 0.22;

// Called from sketch.js preload().
// Loading all sound files early prevents playback/analysis from starting before
function preloadAudio() {
  for (const stop of ying_emotionStops) {
    loadYingSound(stop);
  }
}

function setupAudio() {
  for (const stop of ying_emotionStops) {
    if (!ying_sounds[stop.name]?.heartbeat || !ying_sounds[stop.name]?.background) {
      loadYingSound(stop);
    }
  }

  ying_fft = new p5.FFT(0.82, 64);
  ying_amplitude = new p5.Amplitude(0.82);

  updateAudioMix();
}

function loadYingSound(stop) {
  // Store the two layers together under the emotion name.
  ying_sounds[stop.name] = {
    heartbeat: loadSound(stop.heartbeatFile, () => {
      if (ying_started) {
        prepareYingSound(stop);
        updateAudioMix();
      }
    }),
    background: loadSound(stop.backgroundFile, () => {
      if (ying_started) {
        prepareYingSound(stop);
        updateAudioMix();
      }
    })
  };
}

function prepareSingleYingSound(sound) {
  if (!sound || !sound.isLoaded()) return false;

  // Start looping only once. The first audible volume is applied by updateAudioMix().
  if (!sound.isPlaying()) {
    sound.setVolume(0);
    sound.loop();
  }

  return true;
}

function prepareYingSound(stop) {
  const soundGroup = ying_sounds[stop.name];
  if (!soundGroup) return false;

  // A mood can still begin if one layer is ready slightly before the other.
  const heartbeatReady = prepareSingleYingSound(soundGroup.heartbeat);
  const backgroundReady = prepareSingleYingSound(soundGroup.background);

  return heartbeatReady || backgroundReady;
}

function setYingGroupVolume(soundGroup, weight) {
  if (!soundGroup) return;

  // weight comes from the emotion slider crossfade.
  // The heartbeat uses full volume, while the background layer is scaled down.
  if (soundGroup.heartbeat) {
    soundGroup.heartbeat.setVolume(weight * ying_heartbeatVolume, 0.18);
    soundGroup.heartbeat.pan(ying_pan);
  }

  if (soundGroup.background) {
    soundGroup.background.setVolume(weight * ying_backgroundVolume, 0.18);
    soundGroup.background.pan(ying_pan * 0.6);
  }
}

function getYingHeartbeat(stopName) {
  return ying_sounds[stopName]?.heartbeat;
}

function startYingAudio() {
  // Browsers require a user gesture before the audio context is allowed to make sound.
  userStartAudio();

  for (const stop of ying_emotionStops) {
    prepareYingSound(stop);
  }

  const firstSound = getYingHeartbeat(ying_emotionStops[0].name);
  if (firstSound) {
    ying_fft.setInput(firstSound);
    ying_amplitude.setInput(firstSound);
  }

  ying_started = true;
  updateAudioMix();
}

function yingSmoothstep(t) {
  // Smooth crossfade curve, softer than a straight linear transition.
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function getYingEmotionValue() {

  if (typeof emotionValue === 'number') {
    return constrain(emotionValue, -1, 1);
  }

  // Fallback: read directly from the HTML slider if the global is unavailable.
  const slider = document.getElementById('emotion-slider');
  if (slider) {
    return constrain(Number(slider.value), -1, 1);
  }

  return 0;
}

function getYingMix(v) {
  const weights = {};

  // Initialize every emotion to silence before calculating the active crossfade.
  for (let i = 0; i < ying_emotionStops.length; i++) {
    weights[ying_emotionStops[i].name] = 0;
  }

  // Clamp beyond the slider ends to the first/last emotion.
  if (v <= ying_emotionStops[0].value) {
    weights[ying_emotionStops[0].name] = 1;
    return weights;
  }

  const last = ying_emotionStops[ying_emotionStops.length - 1];
  if (v >= last.value) {
    weights[last.name] = 1;
    return weights;
  }

  // Find which two neighbouring emotions the slider is between,
  // then crossfade their weights smoothly.
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

  weights.neutral = 1;
  return weights;
}

function getWeightedAudioProperty(weights, key) {
  // Blend numeric emotion settings, such as boost, using the same crossfade weights.
  let total = 0;

  for (const stop of ying_emotionStops) {
    total += stop[key] * (weights[stop.name] || 0);
  }

  return total;
}

function getWeightedColor(weights) {
  // Current color can be shared with visual code if needed.
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

  return getYingHeartbeat(strongestStop.name);
}

function updateAudioMix() {
  const emotion = getYingEmotionValue();
  const weights = getYingMix(emotion);

  // Here the shared emotion slider replaces mouseX: unpleasant leans left,
  // neutral stays centred, and pleasant leans right.
  ying_pan = map(emotion, -1, 1, -0.35, 0.35);

  for (const stop of ying_emotionStops) {
    // Before the first click, all target weights are forced to 0 so nothing plays.
    const targetWeight = ying_started ? weights[stop.name] || 0 : 0;
    setYingGroupVolume(ying_sounds[stop.name], targetWeight);
  }

  // keeping background music out of the main activity signal.
  const dominantSound = getDominantYingSound(weights);
  if (dominantSound) {
    ying_fft.setInput(dominantSound);
    ying_amplitude.setInput(dominantSound);
  }

  ying_currentColor = getWeightedColor(weights);
  return weights;
}

function getYingAudio() {
  // Until the user clicks, keep the audio contribution calm and silent.
  if (!ying_started) {
    updateAudioMix();
    ying_audioActivity = lerp(ying_audioActivity, 0.02, 0.08);
    return ying_audioActivity;
  }

  const weights = updateAudioMix();

  let spectrum = ying_fft ? ying_fft.analyze() : [];

  // The heartbeat remains the analysed source, so background music supports
  // the mood without overpowering the visual reaction.
  const rms = ying_amplitude ? ying_amplitude.getLevel() : 0;
  const bass = ying_fft ? ying_fft.getEnergy('bass') / 255 : 0;
  const lowMid = ying_fft ? ying_fft.getEnergy('lowMid') / 255 : 0;
  const treble = ying_fft ? ying_fft.getEnergy('treble') / 255 : 0;
  ying_centroid = ying_fft ? constrain(ying_fft.getCentroid() / 22050, 0, 1) : 0;

  // Combine overall loudness and selected frequency bands into one activity value.
  // Bass is weighted strongly because heartbeat energy usually lives there.
  const spectralBrightness = treble * ying_centroid;
  const rawEnergy = rms * 0.45 + bass * 0.35 + lowMid * 0.15 + spectralBrightness * 0.05;
  const boost = getWeightedAudioProperty(weights, 'boost');
  const targetActivity = constrain(map(rawEnergy * boost, 0, 1, 0.02, 3.0), 0.02, 3.0);

  // Smooth the activity so the sphere pulses organically instead of jittering.
  ying_audioActivity = lerp(ying_audioActivity, targetActivity, 0.12);
  return ying_audioActivity;
}

function triggerHeartbeatPulse() {
  // First click starts the audio; later clicks add an extra pulse if the user
  // clicks near the central sphere.
  startYingAudio();

  const cx = width / 2;
  const cy = height / 2;

  if (dist(mouseX, mouseY, cx, cy) < 220) {
    ying_audioActivity = min(ying_audioActivity + 0.8, 3.0);
  }
}

function drawEmotionUI() {
  // The visible emotion UI lives in index.html.
  // This no-op keeps compatibility with older sketches that may still call it.
}
