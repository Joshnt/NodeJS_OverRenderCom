let debug = true;

let socket;
let isMobile = false;
let numCards = 0;
let previewCardIndex = 0;
let mainFont;
let images = [];
let imageLookUp = {}; // Object to store loaded images with their filenames as keys

let playerID; // ID of the player (num players), additionally to playerID
let activeOtherPlayer = 0; 
let otherPlayerChoices = {};

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
  },
  help:{}
}

const baseTint = [120, 70, 20]; // Reddish-brown, simulates dim warm lighting

let customColors = {};

let smallerSide = null;

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
  customColors = [
    [61, 111, 165],   // coolBlue
    [119, 166, 95],   // poisonGreen
    [139, 46, 46],    // bloodRed
    [136, 193, 208],  // paleCyan
    [176, 176, 176],  // ashGray
    [119, 92, 148]    // violetShadow
  ];

  // Create a canvas that fills the browser window.
  createCanvas(windowWidth, windowHeight);

  // Connect to your remote server on Render.
  if (debug) {
    socket = io.connect("http://localhost:3000");
  } else {
    socket = io.connect("https://nodejs-unity.onrender.com");
  }

  //#region SOCKET IO
  socket.on("getPlayerID", (numPlayers, choices) => {
    playerID = numPlayers;
    console.log("Player ID: " + playerID + " & socket ID: " + socket.id);
    otherPlayerChoices = choices;
    console.log("otherPlayerChoices: " + Object.keys(choices).length);
    let i = 0;
    for (const key of Object.keys(choices)) {
      otherPlayerChoices[key].color = customColors[i % customColors.length];
      otherPlayerChoices[key].positionOffset = {
        side: {},
        middle: {}
      };
      getOtherPlayerCursorPostion(key);
      i++;
    }
  });

  socket.on("updateNumPlayer", (numPlayers, key, action) => { //when new player joins room
    activeOtherPlayer = numPlayers - 1; // subtract 1 for the current player
    if (action === "join") {
      otherPlayerChoices[key] = {};
      otherPlayerChoices[key].color = customColors[activeOtherPlayer % customColors.length];
      otherPlayerChoices[key].positionOffset = {
        side: {},
        middle: {}
      };
    } else if (action === "disconnect") {
      console.log("Player disconnected: " + key);
      delete otherPlayerChoices[key];
    }
  });

  socket.on("cardsPlayer_other", (key, type, index) => {
    if (!otherPlayerChoices[key]) {
      otherPlayerChoices[key] = {};
      otherPlayerChoices[key].color = customColors[activeOtherPlayer % customColors.length];
      otherPlayerChoices[key].positionOffset = {
        side: {},
        middle: {}
      };
    }
    if (!otherPlayerChoices[key][type]) {
      otherPlayerChoices[key][type] = {};
    }
    otherPlayerChoices[key][type] = index;
    console.log("otherPlayerChoices: " + key + " " + type + " " + index);

    // position offsets for cursor (limited to upper half of card)
    getOtherPlayerCursorPostion(key);
  });

  // Phase from server; additionalInfo in selectphase is array with cards
  socket.on("setPhase", (phase, additionalInfo) => {
    resetSelection();
    switch (phase) {
      case "wait":
        currentPhase = playPhase.wait;
        numCards = additionalInfo.length; // TODO get from server
        previewCardIndex = 0;
        selectedCard = null;
        socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
        break;
      case "select":
        currentPhase = playPhase.select;
        //TODO
        break;
      case "place":
        currentPhase = playPhase.place;
        //TODO
        break;
      case "attack":
        currentPhase = playPhase.attack;
        //TODO
        break;
      default:
        console.error("Unknown phase: " + phase);
    }
  });

  socket.on("resetSelection", () => {
    resetSelection();
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

  socket.emit("joinPlayer");
}
//#endregion setup

/**potentially buggy */
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


function draw() {
  background(10);
  
  // TODO: background draw aus main draw funktion rausnehmen (muss nich durchgehend berechnet werden)
  if (currentPhase == playPhase.wait) {
    waitingForCards();
  }else if (currentPhase == playPhase.select) {

    //#region SELECT PHASE
    imageMode(CORNER);
    tint(baseTint); // Reddish-brown, simulates dim warm lighting
    //#region cards & cursor
    image(imageLookUp["Table.jpg"], 0, 0, windowWidth, windowHeight); // Draw the table image as a background
    imageMode(CENTER);
    // draw righter card
    if (previewCardIndex+2 < numCards) {
      let cardRect = getCardRect("right2");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw selected cursor hand
    if (selectedCard == previewCardIndex+2) {
      push(); // Save the current transformation state
      translate(UIRects.cards.right2.x + UIRects.cards.right2.w / 2.5, UIRects.cards.right2.y - (UIRects.cards.right2.h * 0.48));
      scale(-1, 1); // Flip vertically
      image(imageLookUp["pickup_cursor_down.png"], 0, 0, UIRects.customCursors.w2 * cardPositions.cardOffset2.scale, UIRects.customCursors.h2 * cardPositions.cardOffset2.scale);
      pop(); // Restore the original transformation state
    }
    // draw right card
    if (previewCardIndex+1 < numCards) {
      let cardRect = getCardRect("right");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw selected cursor hand
    if (selectedCard == previewCardIndex+1) {
      push(); // Save the current transformation state
      translate(UIRects.cards.right.x + UIRects.cards.right.w / 2.6, UIRects.cards.right.y - (UIRects.cards.right.h * 0.48));
      scale(-1, 1); // Flip vertically
      image(imageLookUp["pickup_cursor_down.png"], 0, 0, UIRects.customCursors.w2 * cardPositions.cardOffset1.scale, UIRects.customCursors.h2 * cardPositions.cardOffset1.scale);
      pop(); // Restore the original transformation state
    }
    // draw lefter card
    if (previewCardIndex > 1) {
      let cardRect = getCardRect("left2");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw selected cursor hand
    if (selectedCard == previewCardIndex-2) {
      image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.left2.x - UIRects.cards.left2.w /2.75, UIRects.cards.left2.y - (UIRects.cards.left2.h *0.45), UIRects.customCursors.w2 * cardPositions.cardOffset2.scale, UIRects.customCursors.h2 * cardPositions.cardOffset2.scale); // oben rechts
    }
    // draw left card
    if (previewCardIndex > 0) {
      let cardRect = getCardRect("left");
      image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
    }
    // draw selected cursor hand
    if (selectedCard == previewCardIndex-1) {
      image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.left.x - UIRects.cards.left.w /2.75, UIRects.cards.left.y - (UIRects.cards.left.h *0.45), UIRects.customCursors.w2 * cardPositions.cardOffset1.scale, UIRects.customCursors.h2 * cardPositions.cardOffset1.scale); // oben links
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
    //#region cursor
    // cursor middle card
    if (selectedCard == previewCardIndex) {
        image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.middle.x - UIRects.cards.middle.w /2.75 , UIRects.cards.middle.y - (UIRects.cards.middle.h*0.45), UIRects.customCursors.w2, UIRects.customCursors.h2); // oben links
    }

    // draw hover and select of other players
    if (Object.keys(otherPlayerChoices).length > 0 && (!showHelp || (showHelp && helpState.selectPhase >= 2))) {
      for (const key of Object.keys(otherPlayerChoices)) {
        let playerChoice = otherPlayerChoices[key];
        let cursorImg;
        let indexOther;
        let cardRect;

        if (playerChoice.cardSelected != null || playerChoice.cardPreview != null) {
          if (playerChoice.cardSelected != null) {
            cursorImg = imageLookUp["default_cursor.png"];
            indexOther = playerChoice.cardSelected;
            tint(playerChoice.color); // R, G, B, Alpha (0–255)
          } else {
            cursorImg = imageLookUp["default_cursor_small.png"];
            indexOther = playerChoice.cardPreview;
            tint(playerChoice.color[0], playerChoice.color[1], playerChoice.color[2], 150); // R, G, B, Alpha (0–255)
          }
          // TODO statt getCardRect die UIRects.cards benutzen
          if (indexOther == previewCardIndex) {
            cardRect = getCardRect("middle");
            image(cursorImg, cardRect.x + (cardRect.w * playerChoice.positionOffset.middle.x) , cardRect.y - (cardRect.h * playerChoice.positionOffset.middle.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
          } else if (indexOther == previewCardIndex+1) { 
            cardRect = getCardRect("right");
            let cardRectBefore = getCardRect("middle");
            let xPosVisibleStart = Math.max(cardRectBefore.xRight,  cardRect.xLeft);
            let xPos = cardRect.xRight - 20 - (playerChoice.positionOffset.side.x*(cardRect.xRight-xPosVisibleStart))
            image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
          } else if (indexOther == previewCardIndex+2) { 
            cardRect = getCardRect("right2");
            let cardRectBefore = getCardRect("right");
            let xPosVisibleStart = Math.max(cardRectBefore.xRight,  cardRect.xLeft);
            let xPos = cardRect.xRight - 20 - (playerChoice.positionOffset.side.x*(cardRect.xRight-xPosVisibleStart))
            image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
          } else if (indexOther == previewCardIndex-1) { 
            cardRect = getCardRect("left");
            let cardRectBefore = getCardRect("middle");
            let xPosVisibleStart = Math.min(cardRectBefore.xLeft,  cardRect.xRight);
            let xPos = cardRect.xLeft + 20 + (playerChoice.positionOffset.side.x*(xPosVisibleStart-cardRect.xLeft))
            image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
          } else if (indexOther == previewCardIndex-2) { 
            cardRect = getCardRect("left2");
            let cardRectBefore = getCardRect("left");
            let xPosVisibleStart = Math.min(cardRectBefore.xLeft,  cardRect.xRight);
            let xPos = cardRect.xLeft + 20 + (playerChoice.positionOffset.side.x*(xPosVisibleStart-cardRect.xLeft))
            image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
          }
        }
        tint(baseTint); // Reset tint to base color
      }
    }
    //#endregion cursor
    imageMode(CORNER);
    if (!showHelp){
      tint(160);
    }
    image(imageLookUp["questionmark.png"], UIRects.help.x, UIRects.help.y, UIRects.help.scale, UIRects.help.scale);

    //#endregion SELECT PHASE
  }
  showTutorialMessages();
}


function previewCardWithIndex(index) {
  previewCardIndex = index;
  
  if (cardSelected == null) {
    socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateUISize();
}

function calculateUISize(resize = 1.25) {
  smallerSide = Math.min(windowWidth, windowHeight);
  cardHeight = windowHeight / resize;
  let img = imageLookUp["card_empty.png"];
  let arrow = imageLookUp["arrow_right.png"];
  let cursorImg = imageLookUp["pickup_cursor.png"]; 
  let questionmarkImg = imageLookUp["questionmark.png"];
  
  if (!img || !arrow || !cursorImg || !questionmarkImg) {
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

  scale = Math.max(smallerSide*0.1, 100);
  UIRects.help.x = windowWidth-(scale*1.2);
  UIRects.help.y = windowHeight*0.02;
  UIRects.help.scale = scale;
  UIRects.help.w = scale;
  UIRects.help.h = scale;
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
  if (isPressedOverCornerImage(UIRects.help)) {
    if (showHelp) {
      showHelp = false;
      toggleTutorialMessagesOff();
    } else {
      showHelp = true;
      resetTutorialMessages();
    }
    return;
  }

  switch (currentPhase) {
    case playPhase.select:
      // turn right
      switch (helpState.selectPhase) {
        case 0:
          if (isPressedOverCenteredImage(UIRects.cards.middle)) {
            if (selectedCard != previewCardIndex) {
              socket.emit("cardsPlayer", "cardSelected", previewCardIndex);
              socket.emit("cardsPlayer", "cardPreview", null);
              selectedCard = previewCardIndex;
              helpState.selectPhase++;
            }
            break;
          }
        case 1:
          if (isPressedOverCenteredImage(UIRects.cards.middle)) {
            if (selectedCard != previewCardIndex) {
              socket.emit("cardsPlayer", "cardSelected", previewCardIndex);
              socket.emit("cardsPlayer", "cardPreview", null);
              selectedCard = previewCardIndex;
            } else{
              socket.emit("cardsPlayer", "cardSelected", null);
              socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
              selectedCard = null;
            }
          }
          helpState.selectPhase++;
          break;
        case 2:
          pressSelectPhase();
          helpState.selectPhase++;
          break;
        case 3:
          pressSelectPhase();
          helpState.selectPhase++;
          break;
        default:
          pressSelectPhase();
          break;
      }

  }

  
}

function release(){
  
}

function pressSelectPhase(){
  if (isPressedOverCenteredImage(UIRects.arrows.right)){
    if (previewCardIndex+1 < numCards) {
      previewCardIndex++;
      console.log("previewCardIndex: " + previewCardIndex);
      if (selectedCard == null) {
        socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
      }
    }
  }else if (isPressedOverCenteredImage(UIRects.arrows.left)){
    if (previewCardIndex > 0) {
      previewCardIndex--;
      console.log("previewCardIndex: " + previewCardIndex);
      if (selectedCard == null) {
        console.log("switched previewCardIndex: " + previewCardIndex);
        socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
      }
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
  }
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
      socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
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

function isPressedOverCornerImage(imgRect){
  let xInput = isMobile ? touches[0].x : mouseX;
  let yInput = isMobile ? touches[0].y : mouseY;
  return  xInput > imgRect.x && 
          xInput < imgRect.x + imgRect.w &&
          yInput > imgRect.y && 
          yInput < imgRect.y + imgRect.h;
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
    xLeft: xPos - width / 2,
    xRight: xPos + width / 2,
    yTop: yPos - height / 2,
    yBottom: yPos + height / 2,
    w: width,
    h: height
  };
}

function getCursorRect() {
  let widthSmall = cardWidth * 0.25;
  let heightSmall = cardWidth * 0.25;
  let width = cardWidth * 0.5;
  let height = cardWidth * 0.5;
  return {
    w1: widthSmall, //für other player
    h1: heightSmall,
    w2: width,  //für player
    h2: height
  };
}


function getOtherPlayerCursorPostion(socketID) {
  otherPlayerChoices[socketID].positionOffset.side.x = random(); // procentual value of visible area for side cards
  otherPlayerChoices[socketID].positionOffset.side.y = random(0, 0.45);
  otherPlayerChoices[socketID].positionOffset.middle.x = random(0.25, 0.4) * random([-1, 1]);
  otherPlayerChoices[socketID].positionOffset.middle.y = random(0, 0.45);
}

function resetSelection() {
  console.log("resetSelection");
  numCards = 0;
  previewCardIndex = 0;
  selectedCard = null;
  for (const key of Object.keys(otherPlayerChoices)) {
    otherPlayerChoices[key].cardSelected = null;
    otherPlayerChoices[key].cardPreview = null;
  }
}