// =========================================================================
// AI acknowledgement: This file was updated with the help of Gemini, 
// based on the core structure and rotation accumulation concept provided by the user. 
// It coordinates the rendering loop and handles variable speed rotation mapping.
// =========================================================================

let myPlanet;

// Shared emotion value for the whole project.
// -1 = unpleasant, 0 = neutral/calm, 1 = pleasant.
// Other mechanics can read this same value to stay conceptually connected.
let emotionValue = 0;

// DOM references for the shared emotion slider UI.
let emotionSlider;
let emotionLabel;

// Accumulates rotation angle to prevent phase-shift matrix snapping bugs during speed scaling
let hantao_rotationAngle = 0; 

let yidanPerlinMechanic;

function setup() {
  // Create WEBGL 3D rendering canvas
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Enable antialiasing for smooth line rendering edges
  setAttributes('antialias', true); 
  
  // Instantiate the sphere object
  myPlanet = new OscilloscopeSphere();

  yidanPerlinMechanic = new PerlinRandomMechanic();
  myPlanet.setDeformationProvider(yidanPerlinMechanic);

  // Connect the HTML slider to the shared emotionValue.
  // This keeps the UI separate from the p5.js canvas while still driving the artwork.
  emotionSlider = document.getElementById('emotion-slider');
  emotionLabel = document.getElementById('emotion-label');

  if (emotionSlider) {
    emotionValue = Number(emotionSlider.value);
    emotionSlider.addEventListener('input', updateEmotionFromSlider);
    updateEmotionFromSlider();
  }

  setupAudio();
}

function draw() {
  // Set background color
  background(5, 5, 8);
  
  // Enable mouse camera orbit control for dragging and zooming
  orbitControl(); 

  // Tilt camera on X-axis at a fixed angle for a perspective view
  rotateX(PI / 3.5);

  // Merge activity levels from both sources
  let currentActivity = max(getHantaoInteraction(), getYingAudio());

  yidanPerlinMechanic.update(currentActivity, emotionValue);

  // Increment rotation angle based on current activity scalar
  hantao_rotationAngle += 0.001 * currentActivity;
  
  // Apply Y-axis rotation transformation
  rotateY(hantao_rotationAngle); 

  // Update the sphere's internal data state with current activity
  myPlanet.update(currentActivity);
  
  // Render the sphere geometry
  myPlanet.display();

  
}


function mousePressed() {
  triggerHeartbeatPulse();
}


function windowResized() {
  // Handle responsive canvas scaling on window resize
  resizeCanvas(windowWidth, windowHeight);
}

function updateEmotionFromSlider() {
  // Convert the slider string value into a number between -1 and 1.
  emotionValue = Number(emotionSlider.value);

  if (!emotionLabel) return;

  // Keep the label simple so it describes a range, not a fixed emotion category.
  if (emotionValue < -0.35) {
    emotionLabel.textContent = 'Unpleasant';
  } else if (emotionValue > 0.35) {
    emotionLabel.textContent = 'Pleasant';
  } else {
    emotionLabel.textContent = 'Neutral';
  }
}