let socket;
let isMobile = false;
let isPressed = false;

function setup() {
  // Create a canvas that fills the browser window.
  createCanvas(windowWidth, windowHeight);

  // Connect to your remote server on Render.
  // Change "your-app-name.onrender.com" to your actual Render domain.
  socket = io.connect("https://nodejs-unity.onrender.com");

  isMobile = isMobileDevice();
  console.log("Mobile device?", isMobile);
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function draw() {
  background(220);

  if (isPressed){
    fill(0, 120, 30);
    rectMode(CORNER);
    rect(0, 0, width, height);
  }
  
    
}

// Detect when the mouse is pressed and send an event.
function mousePressed() {
  if (!isMobile) press();
}

// Detect when the mouse is released and send an event.
function mouseReleased() {
  if (!isMobile) release();
}

function touchStarted(){
  if (isMobile && touches.length == 1) press();
  return false; // Prevent default behavior
}

function touchEnded(){
  if (isMobile && touches.length == 0) release();
  return false; // Prevent default behavior
}

function press(){
  isPressed = true;
  socket.emit("data", "jump");
}

function release(){
  isPressed = false;
  socket.emit("data", "jumpReleased");
}
