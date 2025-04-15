let socket;

function setup() {
  // Create a canvas that fills the browser window.
  createCanvas(windowWidth, windowHeight);

  // Connect to your remote server on Render.
  // Change "your-app-name.onrender.com" to your actual Render domain.
  socket = io.connect("localhost:3000");
}

function draw() {
  background(220);

  // When the mouse is pressed, draw a rectangle and send data to the server.
  if (mouseIsPressed) {
    stroke(255);
    strokeWeight(20);
    fill(255, map(mouseY, 0, height, 0, 200));
    rectMode(CENTER);
    rect(
      width / 2 + random(map(mouseX, 0, width, 0, 20)),
      height / 2,
      map(mouseX, 0, width, width * 0.1, width * 0.8),
      map(mouseX, 0, width, height * 0.1, height * 0.8)
    );

    // Send two "data" events—one for x and one for y.
    socket.emit("data", "x " + map(mouseX, 0, width, 0, 1));
    socket.emit("data", "y " + map(mouseY, 0, height, 0, 1));
  }
}

// Detect when the mouse is pressed and send an event.
function mousePressed() {
  socket.emit("data", "pressed");
}

// Detect when the mouse is released and send an event.
function mouseReleased() {
  socket.emit("data", "released");
}
