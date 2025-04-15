let socket;

function setup() {
  // Create a canvas that fills the browser window.
  createCanvas(windowWidth, windowHeight);

  // Connect to your remote server on Render.
  // Change "your-app-name.onrender.com" to your actual Render domain.
  socket = io.connect("https://nodejs-unity.onrender.com");
}

function draw() {
  background(220);
  fill(100);
  rectMode(CORNER);
  rect(width/2, 0, width/2, height);

  // touch screen
  /* if(touches.length > 0){ 

    for (let touch of touches){
      if (touch.id > 0){
        fill(200,0,0,200);
        if (touch.x > width/2){
          socket.emit("unity", "right");
        } else {
          socket.emit("unity", "left");
        }
      }
      else{
        fill(200,0,0,50);
      }
      stroke(255);
      strokeWeight(5);
      
      ellipseMode(CENTER,CENTER);
      ellipse(touch.x, touch.y, 20, 20);
    
      // Send two "data" events—one for x and one for y.
    }
  } */

  // mouse
  if (mouseIsPressed) {
    fill(200, 0, 0, 200);
    ellipse(mouseX, mouseY, 20, 20);

    if (mouseX > width/2){
      socket.emit("data", "right");
    } else {
      socket.emit("data", "left");
    }
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
