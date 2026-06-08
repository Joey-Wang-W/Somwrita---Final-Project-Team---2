// =========================================================================
// AI acknowledgement: This file was updated with the help of Gemini, 
// based on the core structure and rotation accumulation concept provided by the user. 
// It coordinates the rendering loop and handles variable speed rotation mapping.
// =========================================================================

let myPlanet;

// Accumulates rotation angle to prevent phase-shift matrix snapping bugs during speed scaling
let hantao_rotationAngle = 0; 

function setup() {
  // Create WEBGL 3D rendering canvas
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Enable antialiasing for smooth line rendering edges
  setAttributes('antialias', true); 

    textFont(ying_font);
  
  // Instantiate the sphere object
  myPlanet = new OscilloscopeSphere();

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

  // Increment rotation angle based on current activity scalar
  hantao_rotationAngle += 0.001 * currentActivity;
  
  // Apply Y-axis rotation transformation
  rotateY(hantao_rotationAngle); 

  // Update the sphere's internal data state with current activity
  myPlanet.update(currentActivity);
  
  // Render the sphere geometry
  myPlanet.display();

  // Add UI
  push();
  camera(); 
  ortho();  
  translate(-width/2, -height/2); // ← 加这一行
  drawEmotionUI();
  pop();
  
}

let ying_font;

function preload() {
  preloadAudio();
  ying_font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
}

function mousePressed() {
  sliderMousePressed();
  triggerHeartbeatPulse();
}

function mouseDragged() {
  sliderMouseDragged();
}

function mouseReleased() {
  sliderMouseReleased();
}

function windowResized() {
  // Handle responsive canvas scaling on window resize
  resizeCanvas(windowWidth, windowHeight);
}