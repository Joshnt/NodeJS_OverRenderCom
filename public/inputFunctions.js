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
  console.log("pressed");
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
    case GamePhase.select:
      // turn right
      switch (helpState.selectPhase) {
        case 0:
          if (isPressedOverCenteredImage(UIRects.cards.middle)) {
            if (selectedCard != previewCardIndex) {
              socket.emit("cardsPlayer", "cardSelected", previewCardIndex);
              socket.emit("cardsPlayer", "cardPreview", -1);
              selectedCard = previewCardIndex;
              helpState.selectPhase++;
            }
            break;
          }
        case 1:
          if (isPressedOverCenteredImage(UIRects.cards.middle)) {
            if (selectedCard != previewCardIndex) {
              socket.emit("cardsPlayer", "cardSelected", previewCardIndex);
              socket.emit("cardsPlayer", "cardPreview", -1);
              selectedCard = previewCardIndex;
            } else{
              socket.emit("cardsPlayer", "cardSelected", -1);
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
      socket.emit("cardsPlayer", "cardPreview", -1);
      selectedCard = previewCardIndex;
    } else{
      socket.emit("cardsPlayer", "cardSelected", -1);
      socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
      selectedCard = null;
    }
  }
}

// TODO remove debugging here
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
      currentPhase = GamePhase.select;
      console.log("currentPhase: " + currentPhase);
      socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
    }
  }
}

function release(){
  
}