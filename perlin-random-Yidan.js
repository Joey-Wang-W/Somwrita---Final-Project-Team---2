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
  }

  update(activity = 1) {
    // Hantao's interaction activity speeds up the organic noise field.
    let activityBoost = constrain(activity, 0.25, 3.0);
    this.time += this.noiseSpeed * activityBoost;
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

    let macroDeformation = map(macroNoise, 0, 1, -45, this.deformationStrength);
    let detailDeformation = map(detailNoise, 0, 1, -this.detailStrength, this.detailStrength);
    let pulseDeformation = pulse * this.pulseStrength;

    return macroDeformation + detailDeformation + pulseDeformation;
  }
}