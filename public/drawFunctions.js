

function draw() {
  imageMode(CORNER);
  tint(baseTint); // Reddish-brown, simulates dim warm lighting
  //#region cards & cursor
  image(imageLookUp["Table.jpg"], 0, 0, windowWidth, windowHeight); // Draw the table image as a background
    if (currentPhase === GamePhase.wait) {
      console.log("The game is currently in the 'wait' phase.");
    }
  // TODO: nur input und socket commands triggern redraw
  switch (currentPhase){
    case GamePhase.wait:
        waitingForCards(); // TODO Alternative visuell zu wait - 
        break;
    case GamePhase.select:
      //#region SELECT PHASE
      tint(baseTint); // Reddish-brown, simulates dim warm lighting
      //#region cards & cursor
      imageMode(CENTER);
      // draw righter card
      if (informationPlayer.previewCardIndex+2 < numCards) {
        drawCard("right2", informationPlayer.previewCardIndex+2);
      }
      // draw selected cursor hand
      if (informationPlayer.previewCardIndex+2 in informationPlayer.selectedCards) {
        push(); // Save the current transformation state
        translate(UIRects.cards.right2.x + UIRects.cards.right2.w / 2.5, UIRects.cards.right2.y - (UIRects.cards.right2.h * 0.48));
        scale(-1, 1); // Flip vertically
        image(imageLookUp["pickup_cursor_down.png"], 0, 0, UIRects.customCursors.w2 * cardPositions.cardOffset2.scale, UIRects.customCursors.h2 * cardPositions.cardOffset2.scale);
        pop(); // Restore the original transformation state
      }
      // draw right card
      if (informationPlayer.previewCardIndex+1 < numCards) {
        drawCard("right", informationPlayer.previewCardIndex+1);
      }
      // draw selected cursor hand
      if (informationPlayer.previewCardIndex+1 in informationPlayer.selectedCards) {
        push(); // Save the current transformation state
        translate(UIRects.cards.right.x + UIRects.cards.right.w / 2.6, UIRects.cards.right.y - (UIRects.cards.right.h * 0.48));
        scale(-1, 1); // Flip vertically
        image(imageLookUp["pickup_cursor_down.png"], 0, 0, UIRects.customCursors.w2 * cardPositions.cardOffset1.scale, UIRects.customCursors.h2 * cardPositions.cardOffset1.scale);
        pop(); // Restore the original transformation state
      }
      // draw lefter card
      if (informationPlayer.previewCardIndex > 1) {
        drawCard("left2", informationPlayer.previewCardIndex-2);
      }
      // draw selected cursor hand
      if (informationPlayer.previewCardIndex-2 in informationPlayer.selectedCards) {
        image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.left2.x - UIRects.cards.left2.w /2.75, UIRects.cards.left2.y - (UIRects.cards.left2.h *0.45), UIRects.customCursors.w2 * cardPositions.cardOffset2.scale, UIRects.customCursors.h2 * cardPositions.cardOffset2.scale); // oben rechts
      }
      // draw left card
      if (informationPlayer.previewCardIndex > 0) {
        drawCard("left", informationPlayer.previewCardIndex-1);
      }
      // draw selected cursor hand
      if (informationPlayer.previewCardIndex-1 in informationPlayer.selectedCards) {
        image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.left.x - UIRects.cards.left.w /2.75, UIRects.cards.left.y - (UIRects.cards.left.h *0.45), UIRects.customCursors.w2 * cardPositions.cardOffset1.scale, UIRects.customCursors.h2 * cardPositions.cardOffset1.scale); // oben links
      }
      // middle card
      if (numCards > 0) {
        drawCard("middle", informationPlayer.previewCardIndex);
      }

      //#endregion cards
      //#region arrows
      if (informationPlayer.previewCardIndex+1 < numCards) {
        let rightArrowRect = getArrowRect("right");
        image(imageLookUp["arrow_right.png"], rightArrowRect.x, rightArrowRect.y, rightArrowRect.w, rightArrowRect.h);
      }
      // draw left card
      if (informationPlayer.previewCardIndex > 0) {
        let leftArrowRect = getArrowRect("left");
        image(imageLookUp["arrow_left.png"], leftArrowRect.x, leftArrowRect.y, leftArrowRect.w, leftArrowRect.h);
      }
      //#endregion arrows
      //#region cursor
      // cursor middle card
      if (informationPlayer.previewCardIndex in informationPlayer.selectedCards) {
          image(imageLookUp["pickup_cursor_down.png"], UIRects.cards.middle.x - UIRects.cards.middle.w /2.75 , UIRects.cards.middle.y - (UIRects.cards.middle.h*0.45), UIRects.customCursors.w2, UIRects.customCursors.h2); // oben links
      }


      //#region buttons
      // draw buttons
      imageMode(CENTER);
      image(imageLookUp["button.png"], UIRects.buttons.middleLow.x, UIRects.buttons.middleLow.y, UIRects.buttons.middleLow.w, UIRects.buttons.middleLow.h);
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      textFont(cardFont);
      textSize(UIRects.buttons.middleLow.w * 0.25);
      switch (currentPhase) {
        case GamePhase.wait:
          break;
        case GamePhase.select:
          text("Fight", UIRects.buttons.middleLow.x, UIRects.buttons.middleLow.y);
          break;
      }
      //#endregion buttons

      if (informationPlayer.buttonPressed) {
        image(imageLookUp["pickup_cursor_down.png"], UIRects.buttons.middleLow.x - UIRects.buttons.middleLow.w /2.75 , UIRects.buttons.middleLow.y - (UIRects.buttons.middleLow.h*0.45), UIRects.customCursors.w2/2, UIRects.customCursors.h2/2); // oben links
      }

      // draw hover and select of other players
      //#region other players
      if (drawPlayerCursors) {
        if (Object.keys(playerChoices).length > 0 && (!showHelp || (showHelp && helpState.selectPhase >= 2))) {
            for (const key of Object.keys(playerChoices)) {
              let playerChoice = playerChoices[key];
              let cursorImg;
              let indexOtherArray = [];
              let cardRect;

              if (playerChoice.buttonPressed) {
                cursorImg = imageLookUp["default_cursor.png"];
                tint(playerChoice.color); // R, G, B, Alpha (0–255)
                let xPos = UIRects.buttons.middleLow.x;
                let xOffset = UIRects.buttons.middleLow.w * playerChoice.positionOffset.middle.x;
                let yPos = UIRects.buttons.middleLow.y;
                let yOffset = UIRects.buttons.middleLow.h * playerChoice.positionOffset.middle.x;
                image(cursorImg, xPos + xOffset, yPos + yOffset, UIRects.customCursors.w1, UIRects.customCursors.h1);
                console.log("xpos: " + (xPos + xOffset) + " ypos: " + (yPos + yOffset));
                console.log("yoffset: " + yOffset);
              }else if (Object.keys(playerChoice.selectedCards).length !== 0 || playerChoice.cardPreview != -1) {
                // print first selected card
                if (Object.keys(playerChoice.selectedCards).length !== 0) {
                  cursorImg = imageLookUp["default_cursor.png"];
                  indexOtherArray = Object.keys(playerChoice.selectedCards).map(Number);
                  tint(playerChoice.color); // R, G, B, Alpha (0–255)
                } else {
                  cursorImg = imageLookUp["default_cursor_small.png"];
                  indexOtherArray[0] = playerChoice.cardPreview;
                  tint(playerChoice.color[0], playerChoice.color[1], playerChoice.color[2], 150); // R, G, B, Alpha (0–255)
                }
                
                if (indexOtherArray.length == 0) {continue;}

                for (let i = 0; i < indexOtherArray.length; i++) {
                  const indexOther = indexOtherArray[i];
                  if (indexOther == informationPlayer.previewCardIndex) {
                  cardRect = UIRects.cards.middle;
                  image(cursorImg, cardRect.x + (cardRect.w * playerChoice.positionOffset.middle.x) , cardRect.y - (cardRect.h * playerChoice.positionOffset.middle.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
                  } else if (indexOther == informationPlayer.previewCardIndex+1) { 
                  cardRect = UIRects.cards.right;
                  let cardRectBefore = UIRects.cards.middle;
                  let xPosVisibleStart = Math.max(cardRectBefore.xRight,  cardRect.xLeft);
                  let xPos = cardRect.xRight - 20 - (playerChoice.positionOffset.side.x*(cardRect.xRight-xPosVisibleStart))
                  image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
                  } else if (indexOther == informationPlayer.previewCardIndex+2) { 
                  cardRect = UIRects.cards.right2;
                  let cardRectBefore = UIRects.cards.right;
                  let xPosVisibleStart = Math.max(cardRectBefore.xRight,  cardRect.xLeft);
                  let xPos = cardRect.xRight - 20 - (playerChoice.positionOffset.side.x*(cardRect.xRight-xPosVisibleStart))
                  image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
                  } else if (indexOther == informationPlayer.previewCardIndex-1) { 
                  cardRect = UIRects.cards.left;
                  let cardRectBefore = UIRects.cards.middle;
                  let xPosVisibleStart = Math.min(cardRectBefore.xLeft,  cardRect.xRight);
                  let xPos = cardRect.xLeft + 20 + (playerChoice.positionOffset.side.x*(xPosVisibleStart-cardRect.xLeft))
                  image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
                  } else if (indexOther == informationPlayer.previewCardIndex-2) { 
                  cardRect = UIRects.cards.left2;
                  let cardRectBefore = UIRects.cards.left;
                  let xPosVisibleStart = Math.min(cardRectBefore.xLeft,  cardRect.xRight);
                  let xPos = cardRect.xLeft + 20 + (playerChoice.positionOffset.side.x*(xPosVisibleStart-cardRect.xLeft))
                  image(cursorImg, xPos, cardRect.y - (cardRect.h * playerChoice.positionOffset.side.y), UIRects.customCursors.w1, UIRects.customCursors.h1);
                  }
                }
              }
              tint(baseTint); // Reset tint to base color
            }
        }
      }
    //#endregion cursor
    //#endregion other players
    imageMode(CORNER);
    if (!showHelp){
      tint(160);
    }
    image(imageLookUp["questionmark.png"], UIRects.help.x, UIRects.help.y, UIRects.help.scale, UIRects.help.scale);
    break;
    //#endregion SELECT PHASE
  }
  showTutorialMessages();

  //draw messages
  if (fade > 0){
    drawMessage();
  }
}

//#region functions

function drawCard(cardPosition, cardIndex) {
  let cardRect = UIRects.cards[cardPosition];
  let imageRect = UIRects.images[cardPosition];
  let card = availableCards[cardIndex];
  if (card == null) {console.warn("Card is null "+ cardIndex); return;}
  //base
  image(imageLookUp["card_empty.png"], cardRect.x, cardRect.y, cardRect.w, cardRect.h);
  
  // image
  image(card.Image, imageRect.x, imageRect.y, imageRect.size, imageRect.size);

  // Cost
  if (card.Cost > 0) {
    const costImageKey = `cost_${card.Cost}blood.png`;
    image(imageLookUp[costImageKey], UIRects.costs[cardPosition].x, UIRects.costs[cardPosition].y, UIRects.costs[cardPosition].size, UIRects.costs[cardPosition].size);
  }

  // Ability
  if (card.Ability != null && card.Ability != "") {
    const formattedName = `ability_${card.Ability.toLowerCase()}.png`;
    image(imageLookUp[formattedName], UIRects.abilities[cardPosition].x, UIRects.abilities[cardPosition].y, UIRects.abilities[cardPosition].size, UIRects.abilities[cardPosition].size);
  }

  // name
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textFont(cardFont);
  textSize(cardRect.w * 0.2);
  text(card.Name, cardRect.x, cardRect.y - cardRect.h * 0.47);

  // Health
  textSize(cardRect.w * 0.25);
  text(card.Health, cardRect.x + cardRect.w * 0.26, cardRect.y + cardRect.h * 0.29);

  // Attack
  text(card.Attack, cardRect.x - cardRect.w * 0.26, cardRect.y + cardRect.h * 0.225);
}

