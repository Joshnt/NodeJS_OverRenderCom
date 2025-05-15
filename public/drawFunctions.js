

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
      if (drawPlayerCursors) {
        if (Object.keys(playerChoices).length > 0 && (!showHelp || (showHelp && helpState.selectPhase >= 2))) {
            for (const key of Object.keys(playerChoices)) {
            let playerChoice = playerChoices[key];
            let cursorImg;
            let indexOther;
            let cardRect;

            if (playerChoice.cardSelected != -1 || playerChoice.cardPreview != -1) {
                if (playerChoice.cardSelected != -1) {
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
      }
    //#endregion cursor
    imageMode(CORNER);
    if (!showHelp){
      tint(160);
    }
    image(imageLookUp["questionmark.png"], UIRects.help.x, UIRects.help.y, UIRects.help.scale, UIRects.help.scale);
    break;
    //#endregion SELECT PHASE
  }
  showTutorialMessages();
}
