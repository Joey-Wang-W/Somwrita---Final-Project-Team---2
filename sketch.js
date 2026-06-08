// =========================================================================
// AI acknowledgement: This file was updated with the help of Gemini, 
// based on the core structure and rotation accumulation concept provided by the user. 
// It coordinates the rendering loop and handles variable speed rotation mapping.
// =========================================================================

let myPlanet;

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
}

function draw() {
  // Set background color
  background(5, 5, 8);
  
  // Enable mouse camera orbit control for dragging and zooming
  orbitControl(); 

  // Tilt camera on X-axis at a fixed angle for a perspective view
  rotateX(PI / 3.5);
  
  // Get the global activity coefficient from the interaction script
  let currentActivity = getHantaoInteraction();

  yidanPerlinMechanic.update(currentActivity);

  // Increment rotation angle based on current activity scalar
  hantao_rotationAngle += 0.001 * currentActivity;
  
  // Apply Y-axis rotation transformation
  rotateY(hantao_rotationAngle); 

  // Update the sphere's internal data state with current activity
  myPlanet.update(currentActivity);
  
  // Render the sphere geometry
  myPlanet.display();
}

function windowResized() {
  // Handle responsive canvas scaling on window resize
  resizeCanvas(windowWidth, windowHeight);
}