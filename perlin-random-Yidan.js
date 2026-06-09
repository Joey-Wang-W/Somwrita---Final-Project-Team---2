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

        // These seeded values make the colour flow different each refresh,
        // while still staying smooth and consistent within one run.
        this.colorScale = random(0.8, 1.45);
        this.colorShiftSpeed = random(0.35, 0.75);

        // Stores the shared emotion value from sketch.js.
        // -1 increases unstable detail noise, 1 increases smoother macro flow.
        this.emotionValue = 0;

        // Background particles adapt the Week 11 noisy-shapes idea into 3D.
        // Each particle has seeded random properties and its own noiseLocation.
        this.backgroundParticles = [];
        for (let i = 0; i < 120; i++) {
            this.backgroundParticles.push({
                theta: random(TWO_PI),
                phi: random(-PI / 2, PI / 2),
                distance: random(330, 680),
                size: random(2, 6),
                noiseScale: random(0.08, 0.24),
                noiseLocation: random(1000)
            });
        }

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


        return macroDeformation + detailDeformation + pulseDeformation + ridgeDeformation;
    }
    // This method extends Perlin mechanic from shape deformation into colour.
    // Instead of switching colours suddenly, the sphere samples noise at each surface point,
    // so the colour changes feel organic, emotional, and connected to the same moving field.
    getSurfaceColor(xDir, yDir, zDir, layer = 0, alpha = 180) {
        let colourNoise = noise(
            xDir * this.colorScale + this.time * this.colorShiftSpeed,
            yDir * this.colorScale + layer * 0.35,
            zDir * this.colorScale - this.time * this.colorShiftSpeed
        );

        let unpleasant = map(this.emotionValue, -1, 1, 1, 0);
        let pleasant = map(this.emotionValue, -1, 1, 0, 1);

        let uneasyR = lerp(140, 255, colourNoise);
        let uneasyG = lerp(45, 155, pow(colourNoise, 2));
        let uneasyB = lerp(150, 55, colourNoise);

        let calmR = lerp(35, 245, pleasant * colourNoise);
        let calmG = lerp(175, 255, colourNoise);
        let calmB = lerp(235, 95, colourNoise);

        let neutralR = lerp(45, 115, colourNoise);
        let neutralG = lerp(210, 255, colourNoise);
        let neutralB = lerp(125, 175, colourNoise);

        let r = lerp(neutralR, uneasyR, unpleasant * 0.85);
        let g = lerp(neutralG, uneasyG, unpleasant * 0.75);
        let b = lerp(neutralB, uneasyB, unpleasant * 0.85);

        r = lerp(r, calmR, pleasant * 0.8);
        g = lerp(g, calmG, pleasant * 0.65);
        b = lerp(b, calmB, pleasant * 0.75);

        return color(r, g, b, alpha);
    }

    // The background visualizes the emotional atmosphere around the main sphere.
    // It uses Perlin noise to drift particles smoothly instead of moving them randomly.
    displayBackground() {

        push();

        for (let p of this.backgroundParticles) {
            // Like Week 11 Part 4, every particle samples nearby Perlin values over time.
            let t = p.noiseLocation + this.time * 0.7;

            let theta = p.theta;
            let phi = p.phi;
            let distance = p.distance;

            let x = cos(phi) * cos(theta) * distance;
            let y = sin(phi) * distance;
            let z = cos(phi) * sin(theta) * distance;

            let flicker = noise(t + 90);
            let alpha = map(flicker, 0, 1, 45, 120);

            // Each particle samples Perlin colour from its own position,
            // so the dots change colour smoothly instead of all changing at once.
            let particleColour = this.getSurfaceColor(
                x / p.distance,
                y / p.distance,
                z / p.distance,
                0,
                alpha
            );

            // Perlin noise creates a star-like twinkle.
            // The dots stay small, but their brightness changes more obviously.
            let sparkleAmount = abs(this.emotionValue);

            // Higher speed makes the twinkle visible, while Perlin keeps it smooth.
            let twinkleNoise = noise(t * 8.0 + 120);

            // pow() makes the brightness peak sharper, closer to a star flicker.
            let twinkle = pow(twinkleNoise, 3);

            // Keep the particle small. The emotion slider controls how much it can sparkle.
            let starSize = lerp(p.size * 0.35, p.size * 0.9, twinkle * sparkleAmount);

            // Alpha changes more than size, so it feels like flashing instead of growing.
            let starAlpha = lerp(alpha * 0.35, 230, twinkle * sparkleAmount);

            let starColour = this.getSurfaceColor(
                x / p.distance,
                y / p.distance,
                z / p.distance,
                0,
                starAlpha
            );

            push();
            translate(x, y, z);

            // Draw a tiny glowing core.
            noStroke();
            fill(starColour);
            sphere(starSize, 5, 3);

            // Draw a small cross flare only when the twinkle is bright.
            // This makes the particle feel more like a star instead of a blob.
            if (twinkle * sparkleAmount > 0.45) {
                stroke(starColour);
                strokeWeight(1);

                let flare = starSize * 2.8;
                line(-flare, 0, 0, flare, 0, 0);
                line(0, -flare, 0, 0, flare, 0);
            }

            pop();

            // Keep the radial trace subtle.
            let traceColour = this.getSurfaceColor(
                x / p.distance,
                y / p.distance,
                z / p.distance,
                0,
                alpha * 0.18
            );

            stroke(traceColour);
            strokeWeight(1);
            line(x * 0.97, y * 0.97, z * 0.97, x, y, z);
        }

        pop();
    }
}
