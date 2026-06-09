// =========================================================================
// AI acknowledgement: This file was updated with the help of Gemini, 
// based on the user's concept to centralize slider-driven velocity control.
// It reads the HTML slider, maps it to a speed coefficient, and applies 
// a linear interpolation (lerp) filter to ensure smooth speed transitions.
// =========================================================================

// Cache the smoothed multiplier to create kinetic inertia when dragging the slider
let hantao_smoothedMultiplier = 1.0; 

function getHantaoSliderMultiplier() {
  // 1. Safely read the global HTML slider value from index.html (fallback to 0)
  let rawSliderVal = emotionSlider ? Number(emotionSlider.value) : 0;
  
  // 2. Map the emotion range (-1 to 1) to the sphere's speed limits (0.3 to 3.0)
  let targetMultiplier = map(rawSliderVal, -1, 1, 0.3, 3.0);
  
  // 3. Apply a damping filter so the sphere changes speed smoothly instead of snapping abruptly
  hantao_smoothedMultiplier = lerp(hantao_smoothedMultiplier, targetMultiplier, 0.05);
  
  return hantao_smoothedMultiplier;
}

// Retained to ensure backward compatibility with teammates' code referencing this function
function getHantaoInteraction() {
  return 0; 
}