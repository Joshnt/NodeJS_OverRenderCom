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
          pressSelectPhase();
          helpState.selectPhase++;
          break;
        case 1:
          pressSelectPhase();
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
    if (informationPlayer.previewCardIndex+1 < numCards) {
      informationPlayer.previewCardIndex++;
      if (Object.keys(informationPlayer.selectedCards).length === 0) {
        socket.emit("informationPlayer",informationPlayer);
      }
    }
  }else if (isPressedOverCenteredImage(UIRects.arrows.left)){
    if (informationPlayer.previewCardIndex > 0) {
      informationPlayer.previewCardIndex--;
      if (Object.keys(informationPlayer.selectedCards).length === 0) {
        socket.emit("informationPlayer",informationPlayer);
      }
    }
  } else if (isPressedOverCenteredImage(UIRects.cards.middle)) {
    if (numCards == 0) {
      message = "We don't have any cards to play!";
      fade = 255;
      return;
    }
    if (informationPlayer.buttonPressed == true) {
      message = "Do you want to pick a card or fight?!";
      fade = 255;
      return;
    }

    if (!(informationPlayer.previewCardIndex in informationPlayer.selectedCards)) { // previewcard not selected
      if (Object.keys(informationPlayer.selectedCards).length < allowCardSelection) {
        informationPlayer.selectedCards[informationPlayer.previewCardIndex] = true;
      }
    } else{
      delete informationPlayer.selectedCards[informationPlayer.previewCardIndex];
    }
    socket.emit("informationPlayer",informationPlayer);
  } else if (isPressedOverCenteredImage(UIRects.buttons.middleLow)) {
    if (!informationPlayer.buttonPressed) {
      // init info = delete
      initInformationPlayer();
    }
    informationPlayer.buttonPressed = !informationPlayer.buttonPressed;
    console.log("button pressed: " + informationPlayer.buttonPressed);
    socket.emit("informationPlayer",informationPlayer);
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
      informationPlayer.previewCardIndex++;
    }
    if (key === 'n') {
      informationPlayer.previewCardIndex--;}
  }
}

function release(){
  
}