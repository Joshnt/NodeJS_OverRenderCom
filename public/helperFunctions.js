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

function getImageRect(positionKey) {
  let xPos = UIRects.cards[positionKey].x;
  let yPos = UIRects.cards[positionKey].y - (UIRects.cards[positionKey].h * 0.1);
  let size = UIRects.cards[positionKey].w * 0.8;
  return {
    x: xPos,
    y: yPos,
    size: size,
  };
}

function getCostRect(positionKey) {
  let xPos = UIRects.cards[positionKey].x + (UIRects.cards[positionKey].w * 0.2);
  let yPos = UIRects.cards[positionKey].y - (UIRects.cards[positionKey].h * 0.25);
  let size = UIRects.cards[positionKey].w * 0.5;
  return {
    x: xPos,
    y: yPos,
    size: size,
  };
}

function getAbilityRect(positionKey) {
  let xPos = UIRects.cards[positionKey].x;
  let yPos = UIRects.cards[positionKey].y + (UIRects.cards[positionKey].h * 0.3);
  let size = UIRects.cards[positionKey].w * 0.3;
  return {
    x: xPos,
    y: yPos,
    size: size,
  };
}

function getButtonRect(positionKey) {
  switch (positionKey) {
    case "middleLow":
      let scale = Math.max(Math.min(windowHeight*0.2, 300), 100);
      return {
        x: windowWidth * 0.5,
        y: windowHeight * 0.93,
        w : scale ,
        h : scale / 2.75,
      };
      default:
        console.error("Invalid position key for get button:", positionKey);
        return -1;
  }
}

function getCursorRect() {
  let widthSmall = cardWidth * 0.25;
  let heightSmall = cardWidth * 0.25;
  let width = cardWidth * 0.5;
  let height = cardWidth * 0.5;
  return {
    w1: widthSmall, //für other player
    h1: heightSmall,
    w2: width,  //für main player
    h2: height
  };
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

  UIRects.images.left = getImageRect("left");
  UIRects.images.right = getImageRect("right");
  UIRects.images.left2 = getImageRect("left2");
  UIRects.images.right2 = getImageRect("right2");
  UIRects.images.middle = getImageRect("middle");

  UIRects.costs.left = getCostRect("left");
  UIRects.costs.right = getCostRect("right");
  UIRects.costs.left2 = getCostRect("left2");
  UIRects.costs.right2 = getCostRect("right2");
  UIRects.costs.middle = getCostRect("middle");

  UIRects.abilities.left = getAbilityRect("left");
  UIRects.abilities.right = getAbilityRect("right");  
  UIRects.abilities.left2 = getAbilityRect("left2");
  UIRects.abilities.right2 = getAbilityRect("right2");
  UIRects.abilities.middle = getAbilityRect("middle");

  UIRects.buttons.middleLow = getButtonRect("middleLow");

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

function removeSelfFromChoices(){
  if (playerChoices.hasOwnProperty(ownIdOnServer)) {
    console.log("color: " + playerChoices[ownIdOnServer].color);

    delete playerChoices[ownIdOnServer]; // Dynamically delete the key using the variable
  } else {
    console.warn(`Key '${ownIdOnServer}' does not exist in choices.`);
  }
}

function initInformationPlayer() {
  informationPlayer = { 
    previewCardIndex: -1,
    selectedCards: {}, 
    buttonPressed: false
  };

  if (numCards > 0) {
    informationPlayer.previewCardIndex = 0;
  }    
}