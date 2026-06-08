// Perlin Noise & Randomness mechanic
// Creative director: Yidan Wang
// This mechanic uses p5.js noise() and randomSeed() to create smooth organic variation.

class PerlinRandomMechanic {
  constructor() {
    this.seed = floor(random(100000));
    // Random seed gives each refresh a different but internally consistent ecosystem.
    randomSeed(this.seed);
    noiseSeed(this.seed);
    this.time = 0;
    // Seeded random parameters control the personality of each run.
    this.noiseSpeed = random(0.003, 0.009);
    this.macroScale = random(0.75, 1.25);
    this.detailScale = random(2.0, 4.5);
    this.deformationStrength = random(90, 170);
    this.detailStrength = random(16, 42);
    this.pulseStrength = random(8, 24);

    // Stores the shared emotion value from sketch.js.
    // -1 increases unstable detail noise, 1 increases smoother macro flow.
    this.emotionValue = 0;
  }

  update(activity = 1, emotionValue = 0) {
    // Hantao's interaction activity speeds up the organic noise field.
    let activityBoost = constrain(activity, 0.25, 3.0);
    this.time += this.noiseSpeed * activityBoost;
    
    // Store the shared emotion value so getDeformation() can shape the noise response.
    this.emotionValue = emotionValue;
  }

  getDeformation(xDir, yDir, zDir) {
    // Large-scale Perlin layer creates slow terrain-like emotional topography.
    let macroNoise = noise(
      xDir * this.macroScale + this.time,
      yDir * this.macroScale,
      zDir * this.macroScale + this.time
    );
    // Smaller detail layer adds biological surface vibration without becoming random/static.
    let detailNoise = noise(
      xDir * this.detailScale - this.time * 1.7,
      yDir * this.detailScale + this.time * 0.8,
      zDir * this.detailScale
    );
    // Time-based pulse makes the surface feel alive while still driven by this mechanic.
    let pulse = sin(this.time * TWO_PI * 0.7 + yDir * PI);

    // Map the shared emotion slider into two visual tendencies.
    // Unpleasant states amplify detail noise, making the surface sharper and less stable.
    // Pleasant states amplify macro flow and pulse, making the surface feel smoother and more open.
   
    // Split the slider into two clear emotional directions.
    // unpleasant = 1 on the left side, pleasant = 1 on the right side.
    let unpleasant = map(this.emotionValue, -1, 1, 1, 0);
    let pleasant = map(this.emotionValue, -1, 1, 0, 1);

    // Pleasant states create broader, smoother swelling.
    let macroRange = map(pleasant, 0, 1, 90, 230);
    let macroDeformation = map(macroNoise, 0, 1, -25, macroRange);

    // Unpleasant states add sharper outward ridges.
    // This is mostly positive so it remains visible even with the sphere's minimum-radius guardrail.
    let detailCentered = map(detailNoise, 0, 1, -1, 1);
    let detailDeformation = detailCentered * this.detailStrength * map(unpleasant, 0, 1, 0.45, 3.4);

    // Extra ridge layer makes negative emotion visibly more unstable and spiky.
    let ridgeDeformation = pow(detailNoise, 3) * map(unpleasant, 0, 1, 0, 95);

    // Pleasant states breathe more gently and openly.
    let pulseDeformation = pulse * this.pulseStrength * map(pleasant, 0, 1, 0.55, 2.4);


    return macroDeformation + detailDeformation + pulseDeformation + ridgeDeformation ;
  }
}