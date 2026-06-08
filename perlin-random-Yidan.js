// Perlin Noise & Randomness mechanic
// Creative director: Yidan Wang
// This mechanic uses Perlin noise and random seeds to create organic motion and variation.

class PerlinRandomMechanic {
  constructor() {
    this.seed = floor(random(100000));
    noiseSeed(this.seed);
    randomSeed(this.seed);

    this.time = 0;
    this.noiseSpeed = random(0.003, 0.01);
    this.noiseScale = random(1.0, 2.0);
    this.deformationStrength = random(80, 180);
  }

  update() {
    this.time += this.noiseSpeed;
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