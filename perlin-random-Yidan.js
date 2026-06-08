// Perlin Noise & Randomness mechanic
// Creative director: Yidan Wang
// This mechanic uses p5.js noise() and randomSeed() to create smooth organic variation.

class PerlinRandomMechanic {
  constructor() {
    this.seed = floor(random(100000));

    randomSeed(this.seed);
    noiseSeed(this.seed);

    this.time = 0;
    this.noiseSpeed = random(0.003, 0.009);
    this.noiseScale = random(1.0, 2.4);
    this.deformationStrength = random(80, 180);
  }

  update(activity = 1) {
    this.time += this.noiseSpeed * activity;
  }

  getDeformation(xDir, yDir, zDir) {
    let noiseValue = noise(
      xDir * this.noiseScale + this.time,
      yDir * this.noiseScale,
      zDir * this.noiseScale + this.time
    );

    return map(noiseValue, 0, 1, -60, this.deformationStrength);
  }
}