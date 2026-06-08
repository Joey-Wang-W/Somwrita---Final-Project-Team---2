// =========================================================================
// AI acknowledgement: This file was generated with the help of Gemini, 
// based on the interactive concepts and logic framework provided by the user. 
// It implements a decay model to map mouse kinetic energy onto system activity.
// External references: Uses native p5.js lerp() for linear interpolation.
// =========================================================================

let hantao_energyPool = 0; 
let hantao_smoothedActivity = 0.02; // Initial baseline activity (2%)

function getHantaoInteraction() {
  // 1. Calculate mouse distance per frame and filter out anomalies
  let frameDistance = dist(mouseX, mouseY, pmouseX, pmouseY);
  if (frameDistance > 300) frameDistance = 0;

  // 2. Accumulate movement distance into the energy pool
  hantao_energyPool += frameDistance * 0.03;

  // 3. Core deceleration mechanism to slow down
  hantao_energyPool *= 0.95;

  // Constrain energy pool between 0.0 and 1.0
  hantao_energyPool = constrain(hantao_energyPool, 0, 1.0);

  // 4. Map energy to target velocity and activity range (0.02 to 3.0)
  let targetActivity = map(hantao_energyPool, 0, 1.0, 0.02, 3.0);
  
  // 5. Smooth transition using linear interpolation
  hantao_smoothedActivity = lerp(hantao_smoothedActivity, targetActivity, 0.1);
  
  return hantao_smoothedActivity;
}