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
    return -1;
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
    otherPlayerChoices[key].cardSelected = -1;
    otherPlayerChoices[key].cardPreview = -1;
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