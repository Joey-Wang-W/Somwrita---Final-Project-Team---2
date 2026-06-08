// noprotect
// =========================================================================
// AI acknowledgement: This file was updated with the help of Gemini, 
// based on the modular rendering and optimization framework provided by the user. 
// It handles the 3D procedural rendering of the sphere under dynamic speed scaling.
// =========================================================================

class OscilloscopeSphere {
  constructor() {
    // Baseline radius
    this.radius = 150;       
    
    // Latitude resolution (number of horizontal rings)
    this.latitudes = 75;     
    
    // Longitude resolution (vertices per ring)
    this.longitudes = 160;   
    
    this.timeOffset = 0;
  }

  // Accept external activity to adjust time offset
  update(activity) {
    // Update time offset weighted by activity to control wave evolution speed
    this.timeOffset += 0.007 * activity;
  }

  display() {
    push();
    noFill(); // Disable surface geometry filling
    strokeWeight(1); // Set stroke weight to 1 pixel

    // Initialize noise height cache array
    let noiseCache = [];
    
    for (let i = 0; i <= this.latitudes; i++) {
      let lat = map(i, 0, this.latitudes, 0.01 * PI, 0.99 * PI);
      noiseCache[i] = [];
      
      for (let j = 0; j <= this.longitudes; j++) {
        let lon = map(j, 0, this.longitudes, 0, TWO_PI);

        // Compute baseline spherical direction vectors
        let xDir = sin(lat) * cos(lon);
        let yDir = cos(lat); 
        let zDir = sin(lat) * sin(lon);

        // Compute Perlin noise based on direction vectors and time offset
        let macroNoise = noise(
          xDir * 1.3 + this.timeOffset, 
          yDir * 1.3, 
          zDir * 1.3 + this.timeOffset
        );
        
        // Map noise to terrain displacement height range
        noiseCache[i][j] = map(macroNoise, 0, 1, -100, 200);
      }
    }

    // Render multi-layered shell structure
    for (let layer = 0; layer < 3; layer++) {
      
      // Calculate radial offset for the current shell layer
      let currentOffset = layer * 15; 

      for (let i = 1; i < this.latitudes; i++) {
        let lat = map(i, 0, this.latitudes, 0.01 * PI, 0.99 * PI);
        
        // Compute latitude-based alpha gradient (fading near poles)
        let baseAlpha = map(sin(lat), 0, 1, 15, 190); 
        
        // Compute alpha attenuation for outer shell layers
        let layerAlpha = baseAlpha * (1.0 - layer * 0.3); 
        
        // Apply stroke color and alpha
        stroke(50, 255, 130, layerAlpha);

        // Begin drawing horizontal vertex ring
        beginShape();
        for (let j = 0; j <= this.longitudes; j++) {
          let lon = map(j, 0, this.longitudes, 0, TWO_PI);

          let xDir = sin(lat) * cos(lon);
          let yDir = cos(lat); 
          let zDir = sin(lat) * sin(lon);

          // Combine baseline terrain data with current layer offset
          let bigWaves = noiseCache[i][j];
          let currentRadius = this.radius + bigWaves + currentOffset;

          // Enforce minimum radius guardrail to prevent inward inversion
          if (currentRadius < this.radius) {
            currentRadius = this.radius;
          }

          // Calculate final 3D projection coordinates
          let x = currentRadius * xDir;
          let y = currentRadius * yDir;
          let z = currentRadius * zDir;

          vertex(x, y, z);
        }
        endShape(CLOSE); // Close the vertex ring path smoothly
      }
    }
    pop();
  }
}