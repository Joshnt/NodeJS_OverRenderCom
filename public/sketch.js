

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

  loadJSON('/api/colors', (data) => {
    customColors = data;
    //log the custom color array
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
  socket.on("init", (choices, socketid) => {
    ownIdOnServer = socketid;
    playerChoices = choices;
    removeSelfFromChoices();    
  });

  socket.on("allPlayerCards", (cards) => {
    availableCards = cards;
    for (i = 0; i < availableCards.length; i++) {
      const formattedName = `portrait_${availableCards[i].Name.toLowerCase().replace(/\s+/g, "_")}.png`;
      availableCards[i].Image = imageLookUp[formattedName];
    }
    numCards = availableCards.length;
  });

  socket.on("allPlayerNonPlayableCards", (cards) => {
    nonPlayableCards = cards;
  });

  socket.on("currentCardToPlay", (card) => {
    currentCardToPlay = card;
    if (currentCardToPlay) {
      const formattedName = `portrait_${currentCardToPlay.Name.toLowerCase().replace(/\s+/g, "_")}.png`;
      currentCardToPlay.Image = imageLookUp[formattedName];
    }
  });

  socket.on("allPlayerChoices", (choices) => {
    playerChoices = choices;
    removeSelfFromChoices();
  });

  // Phase from server
  socket.on("setPhase", (phase) => {
    resetSelection();
    setPhaseBehavior(phase);
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
  emitAllOwnChoices();
}
//#endregion setup

/**potentially buggy */
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


function previewCardWithIndex(index) {
  previewCardIndex = index;
  
  if (cardSelected == -1) {
    socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
  }
}

function setPhaseBehavior(phase) {
  switch (phase) {
    case "wait":
      currentPhase = GamePhase.wait;
      previewCardIndex = 0;
      selectedCard = null;
      socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
      break;
    case "select":
      currentPhase = GamePhase.select;
      //TODO
      break;
    case "place":
      currentPhase = GamePhase.place;
      //TODO
      break;
    case "sacrifice":
      currentPhase = GamePhase.sacrifice;
      //TODO
      break;
    case "attack":
      currentPhase = GamePhase.attack;
      //TODO
      break;
    case "menu":
      currentPhase = GamePhase.menu;
      //TODO
      break;
    default:
      console.error("Unknown phase: " + phase);
  }
  
}

function emitAllOwnChoices(){
  socket.emit("cardsPlayer", "cardSelected", selectedCard);
  socket.emit("cardsPlayer", "cardPreview", previewCardIndex);
}