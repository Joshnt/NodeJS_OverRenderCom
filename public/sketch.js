let debug = true;

let socket;
let isMobile = false;
let numCards = 0;
let previewCardIndex = 0;
let mainFont;
let images = [];
let imageLookUp = {}; // Object to store loaded images with their filenames as keys

let activeOtherPlayer = null; 
let allPlayerChoices = [];

let cardWidth, cardHeight, arrowWidth, arrowHeight, cursorWidth, cursorHeight;

let selectedCard = null;

const playPhase = {
  wait: 0,
  select: 1,
  place: 2,
  attack: 3,
};
let currentPhase = playPhase.wait;

// TODO auslagern in anderes script
const cardPositions = {
  middleCard: 
    {
      x: 0.5,
      y: 0.5,
      scale: 1.0
    },
  cardOffset1:
    {
      x: 0.15,
      y: 0,
      scale: 0.75
    },
  cardOffset2:
    {
      x: 0.25,
      y: 0,
      scale: 0.65
    }
}
const arrowPositions = {
  left: {
    x: 0.05,
    y: 0.95
  },
  right: {
    x: 0.95,
    y: 0.95
  }
}

let UIRects = {
  arrows: {
    left: {},
    right: {}
  }, 
  cards: {
    left: {    },
    right: { },
    left2: {    },
    right2: {    },
    middle: {    }
  },
  customCursors: {
  }
}

const baseTint = [120, 70, 20]; // Reddish-brown, simulates dim warm lighting

let customColors = {};

function preload() {
  mainFont = loadFont('/assets/ElderGodsBB.ttf');
  // load images - full chatGPT
  loadJSON('/api/images', (imageList) => {
    if (!imageList || !Array.isArray(imageList)) {
      console.error("Invalid image list:", imageList);
      return;
    }

    for (let i = 0; i < imageList.length; i++) {
      let imagePath = imageList[i];
      let img = loadImage(imagePath);
      const filename = imagePath.split('/').pop();
      images.push({ path: imagePath, image: img });
      imageLookUp[filename] = img;
    }
  });
}

//#region setup
function setup() {
  // Create a canvas that fills the browser window.
  createCanvas(windowWidth, windowHeight);

  // Connect to your remote server on Render.
  if (debug) {
    socket = io.connect("http://localhost:3000");
  } else {
    socket = io.connect("https://nodejs-unity.onrender.com");
  }

  //#region SOCKET IO
  socket.on("playerNumInfo", (numPlayers) => {
    console.log("player ID: " + socket.id);
    activeOtherPlayer = numPlayers - 1;
  });

  socket.on("cardsPlayer_other", (key, type, index) => {
    otherPlayerChoices.key.type.index = choices;
    console.log(Object.keys(choices).length);
  });
  //#endregion SOCKET IO

  isMobile = isMobileDevice();
  console.log("isMobile: " + isMobile);
  socket.emit("log", isMobile ? "Mobile device detected" : "Desktop device detected");


  if (mainFont) {
    textFont(mainFont);
  }else{
    console.error("Font not loaded");
    socket.emit("log", "Font not loaded");
  }
  

  calculateUISize();
  customColors = {
    coolBlue: color('#3D6FA5'),
    poisonGreen: color('#77A65F'),
    bloodRed: color('#8B2E2E'),
    paleCyan: color('#88C1D0'),
    ashGray: color('#B0B0B0'),
    violetShadow: color('#775C94')
  };

  socket.emit("joinRoom", "PlayerRoom");
}
//#endregion setup

/**potentially buggy */
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


function draw() {
  background(10);
  
  
  // TODO: background draw aus main draw funktion rausnehmen (muss nich durchgehend berechnet werden)
  if (numCards <= 0 || currentPhase == playPhase.wait) {
    waitingForCards();
  }else if (currentPhase == playPhase.select) {

    //#region SELECT PHASE
    imageMode(CORNER);
    tint(baseTint); // Reddish-brown, simulates dim warm lighting
    //#region cards
    image(imageLookUp["Table.jpg"], 0, 0, windowWidth, windowHeight); // Draw the table image as a background
    imageMode(CENTER);
    // draw righter card
    if (previewCardIndex+2 < numCards) {
      let cardRect = getCardRect("right2");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw right card
    if (previewCardIndex+1 < numCards) {
      let cardRect = getCardRect("right");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw lefter card
    if (previewCardIndex > 1) {
      let cardRect = getCardRect("left2");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw selected cursor hand
    if (selectedCard == previewCardIndex-2) {
      tint(100); // R, G, B, Alpha (0–255)
      image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.left2.x - UIRects.cards.left2.w /2.75, UIRects.cards.left2.y - UIRects.cards.left2.h /2.5, UIRects.customCursors.w * cardPositions.cardOffset2.scale, UIRects.customCursors.h * cardPositions.cardOffset2.scale); // oben rechts
      tint(baseTint);
    }
    // draw left card
    if (previewCardIndex > 0) {
      let cardRect = getCardRect("left");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw selected cursor hand
    if (selectedCard == previewCardIndex-1) {
      tint(200); // R, G, B, Alpha (0–255)
      image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.left.x - UIRects.cards.left.w /2.75, UIRects.cards.left.y - UIRects.cards.left.h /2.5, UIRects.customCursors.w * cardPositions.cardOffset1.scale, UIRects.customCursors.h * cardPositions.cardOffset1.scale); // oben links
      tint(baseTint);
    }
    // middle card
    let cardRect = getCardRect("middle");
    image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);

    //#endregion cards
    //#region arrows
    if (previewCardIndex+1 < numCards) {
      let rightArrowRect = getArrowRect("right");
      image(imageLookUp["arrow_right.png"], rightArrowRect.x, rightArrowRect.y, rightArrowRect.w, rightArrowRect.h);
    }
    // draw left card
    if (previewCardIndex > 0) {
      let leftArrowRect = getArrowRect("left");
      image(imageLookUp["arrow_left.png"], leftArrowRect.x, leftArrowRect.y, leftArrowRect.w, leftArrowRect.h);
    }
    //#endregion arrows

    // cursor middle card
    if (selectedCard == previewCardIndex) {
        image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.middle.x - UIRects.cards.middle.w /2.75 , UIRects.cards.middle.y - UIRects.cards.middle.h /2.5, UIRects.customCursors.w, UIRects.customCursors.h); // oben links
    }

    // draw hover and select of other players
/*     console.log("allPlayerChoices length: " + Object.keys(allPlayerChoices).length);
    if (allPlayerChoices.length > 0) {
      for (let i = 0; i < allPlayerChoices.length; i++) {
        let playerChoice = allPlayerChoices[i];
        if (playerChoice.id != socket.id) {
          let cardRect = getCardRect("middle");
          if (playerChoice.cardPreview.index == previewCardIndex) {
            image(imageLookUp["default_cursor_small.png"], cardRect.x - UIRects.cards.middle.w /2.75 , cardRect.y - UIRects.cards.middle.h /2.5, UIRects.customCursors.w, UIRects.customCursors.h); // oben links
          }
        }
      }
    } */

    //#endregion SELECT PHASE
  }
  
}

function previewCardWithIndex(index) {
  previewCardIndex = index;
  
  if (cardSelected == null) {
    socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
  }
}

function waitingForCards(){
  textAlign(CENTER, CENTER);
  textSize(windowWidth / 10);
  fill(255);
  text("Waiting for cards...", width / 2, height / 2);
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateUISize();
}

function calculateUISize(resize = 1.25) {
  cardHeight = windowHeight / resize;
  let img = imageLookUp["card_empty.png"];
  let arrow = imageLookUp["arrow_right.png"];
  let cursorImg = imageLookUp["pickup_cursor.png"]; 
  
  if (!img || !arrow || !cursorImg) {
    console.error("at least one image not loaded yet");
    return;
  }


  let arrowScale = windowWidth/3/arrow.width; // Proportional size
  arrowScale = Math.min(arrowScale,3);
  arrowWidth  = arrow.width * arrowScale;
  arrowHeight = arrow.height * arrowScale;

  if (arrowWidth *3 > windowWidth) {
    arrowScale = windowWidth/ 2.5 / arrow.width;
    Math.min(arrowScale,1);
    arrowWidth = arrow.width * arrowScale;
    arrowHeight = arrow.height * arrowScale;
  }
  UIRects.arrows.left = getArrowRect("left");
  UIRects.arrows.right = getArrowRect("right");


  let scale = cardHeight / img.height;
  cardWidth = img.width * scale;
  cardHeight = img.height * scale;

  if (cardWidth *1.2 > windowWidth) {
    scale = windowWidth/ resize / img.width;
    cardWidth = img.width * scale;
    cardHeight = img.height * scale;
  }
  UIRects.cards.left = getCardRect("left");
  UIRects.cards.right = getCardRect("right");
  UIRects.cards.left2 = getCardRect("left2");
  UIRects.cards.right2 = getCardRect("right2");
  UIRects.cards.middle = getCardRect("middle");


  scale = windowWidth/3/cursorImg.width;
  scale = Math.min(scale,3);
  cursorWidth = cursorImg.width * scale;
  cursorHeight = cursorImg.height * scale;

  if (cursorWidth *4 > windowWidth) {
    scale = windowWidth/ 2.5 / cursorImg.width;
    cursorWidth = cursorImg.width * scale;
    cursorHeight = cursorImg.height * scale;
  }

  UIRects.customCursors = getCursorRect();
}

//#region INPUT
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
  switch (currentPhase) {
    case playPhase.select:
      // turn right
      if (isPressedOverCenteredImage(UIRects.arrows.right)){
        if (previewCardIndex+1 < numCards) {
          previewCardIndex++;
          console.log("previewCardIndex: " + previewCardIndex);
        break;
        }
      }else if (isPressedOverCenteredImage(UIRects.arrows.left)){
        if (previewCardIndex > 0) {
          previewCardIndex--;
          console.log("previewCardIndex: " + previewCardIndex);
        break;
        }
      } else if (isPressedOverCenteredImage(UIRects.cards.middle)) {
        if (selectedCard != previewCardIndex) {
          socket.emit("cardsPlayer", "cardSelected", previewCardIndex);
          socket.emit("cardsPlayer", "cardPreview", null);
          selectedCard = previewCardIndex;
        } else{
          socket.emit("cardsPlayer", "cardSelected", null);
          socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
          selectedCard = null;
        }
        break;
      }
  }

  
}

function release(){
  
}

function keyPressed() {
  if (debug) {
    if (key === 'c') {
      numCards++;
      console.log("numCards: " + numCards);
    }
    if (key === 'v') {
      numCards--;
      console.log("numCards: " + numCards);
    }
    if (key === 'm') {
      previewCardIndex++;
      console.log("previewCardIndex: " + previewCardIndex);
    }
    if (key === 'n') {
      previewCardIndex--;
      console.log("previewCardIndex: " + previewCardIndex);
    }
    if (key === 's') {
      currentPhase = playPhase.select;
      console.log("currentPhase: " + currentPhase);
    }
  }
}

//**check if input press is on image*/
function isPressedOverCenteredImage(imgRect){
  let xInput = isMobile ? touches[0].x : mouseX;
  let yInput = isMobile ? touches[0].y : mouseY;
  return  xInput > imgRect.x - imgRect.w/2 && 
          xInput < imgRect.x + imgRect.w/2 &&
          yInput > imgRect.y - imgRect.h/2 && 
          yInput < imgRect.y + imgRect.h/2;
}
//#endregion INPUT
//#region UI Elements functions

function getArrowRect(positionKey) {
  let xPos;
  if (positionKey == "left") {
    xPos = windowWidth * arrowPositions.left.x + arrowWidth / 2;
  }
  else if (positionKey == "right") {
    xPos = windowWidth * arrowPositions.right.x - arrowWidth / 2;
  } else {
    console.error("Invalid position key:", positionKey);
    return null;
  }
  return {
    x: xPos,
    y: windowHeight * arrowPositions[positionKey].y - arrowHeight * 0.2,
    w: arrowWidth,
    h: arrowHeight
  };
}
function getCardRect(positionKey) {
  let xPos, width, height, yPos;
  switch (positionKey) {
    case "left":
      xPos = windowWidth*(cardPositions.middleCard.x - cardPositions.cardOffset1.x);
      yPos = windowHeight*(cardPositions.middleCard.y - cardPositions.cardOffset1.y);
      width = cardWidth * cardPositions.cardOffset1.scale;
      height = cardHeight * cardPositions.cardOffset1.scale;
      break;
    case "left2":
      xPos = windowWidth*(cardPositions.middleCard.x - cardPositions.cardOffset2.x);
      yPos = windowHeight*(cardPositions.middleCard.y - cardPositions.cardOffset2.y);
      width = cardWidth * cardPositions.cardOffset2.scale;
      height = cardHeight * cardPositions.cardOffset2.scale;
      break;
    case "right":
      xPos = windowWidth*(cardPositions.middleCard.x + cardPositions.cardOffset1.x);
      yPos = windowHeight*(cardPositions.middleCard.y - cardPositions.cardOffset1.y);
      width = cardWidth * cardPositions.cardOffset1.scale;
      height = cardHeight * cardPositions.cardOffset1.scale;
      break;
    case "right2":
      xPos = windowWidth*(cardPositions.middleCard.x + cardPositions.cardOffset2.x);
      yPos = windowHeight*(cardPositions.middleCard.y - cardPositions.cardOffset2.y);
      width = cardWidth * cardPositions.cardOffset2.scale;
      height = cardHeight * cardPositions.cardOffset2.scale;
      break;
    case "middle":
      xPos = windowWidth * cardPositions.middleCard.x;
      yPos = windowHeight * cardPositions.middleCard.y;
      width = cardWidth * cardPositions.middleCard.scale;
      height = cardHeight * cardPositions.middleCard.scale;
      break;
  }
  return {
    x: xPos,
    y: yPos,
    w: width,
    h: height
  };
}

function getCursorRect() {
  let xPos = 0;
  let yPos = 0;
  let width = cardWidth * 0.5;
  let height = cardHeight * 0.5;
  return {
    x: xPos,
    y: yPos,
    w: width,
    h: height
  };
}