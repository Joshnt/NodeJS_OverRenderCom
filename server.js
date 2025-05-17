const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(join(__dirname, 'public')));

let choices = {
  player: {} // Array to store player choices mit id = { type = index, color = customColorIndex}
}

class CardInfo {
  constructor(Health, Attack, Cost, Ability, Name, DisplayedName) {
    this.Health = Health;
    this.Attack = Attack;
    this.Cost = Cost;
    this.Ability = Ability;
    this.Name = Name;
    this.DisplayedName = DisplayedName;
    this.Image = null; 
  }
}

let availableCards = []; // objects
let nonPlayableCards = []; // indexes of cards that are not playable
let currentCardToPlay = null; // cardInfo
let allowPlayerCardSelection = 1; // number of cards that can be selected

const GamePhase = {
  wait: "wait",
  select: "select",
  sacrifice: "sacrifice",
  place: "place",
  attack: "attack",
  menu: "menu"
}

const customColors = [
    [61, 111, 165],   // coolBlue
    [119, 166, 95],   // poisonGreen
    [139, 46, 46],    // bloodRed
    [136, 193, 208],  // paleCyan
    [176, 176, 176],  // ashGray
    [119, 92, 148]    // violetShadow
  ]

let currentPhase = GamePhase.select; // Initialize the current phase
let lastColorIndex = -1;

//#region load data
// Function to recursively get all image paths
const getImagePaths = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        // Recursively go through subdirectories
        results = results.concat(getImagePaths(filePath));
      } else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
        // Check if the file is an image (you can add other extensions if needed)
        results.push(filePath.replace(path.join(__dirname, 'public'), '').replace(/\\/g, '/'));
      }
    });
    return results;
  };
  
  // Endpoint to get image paths
  app.get('/api/images', (req, res) => {
    const imagesDirectory = path.join(__dirname, 'public', 'assets', 'images');
    const imagePaths = getImagePaths(imagesDirectory);
    res.json(imagePaths); // Send the image paths as a JSON response
  });

  app.get('/api/colors', (req, res) => {
    res.json(customColors); // Send the image paths as a JSON response
  });
//#endregion load data



app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });


io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id); 
  
  
  //#region from player
  socket.on("joinPlayer", () => {
    socket.join("PlayerRoom");
    choices.player[socket.id] = {};
    lastColorIndex = (lastColorIndex+1) % customColors.length; // colorindex
    console.log("Last color index: " + lastColorIndex + " customColors.length: " + customColors.length);  
    choices.player[socket.id].colorIndex = lastColorIndex; // colorindex
    console.log(choices.player[socket.id] + choices.player[socket.id].colorindex);
    choices.player[socket.id].color = customColors[lastColorIndex]; // color
    console.log("Player color: " + choices.player[socket.id].color);
    choices.player[socket.id].positionOffset = {
      side: {},
      middle: {}
    };
    setPlayerCursorPostion(socket.id, "player");
  
    socket.emit("init", choices.player, socket.id);
    shareDataRoom("PlayerRoom"); // share data with all players
    shareDataRoom("unity"); // share data with unity
    setPhase(socket, currentPhase); // set phase for player
  });

  socket.on("informationPlayer", (informationPlayerObject) => {
    updateChoicesPlayer(socket.id, informationPlayerObject); // update player choices object
    setPlayerCursorPostion(socket.id, "player");
    shareDataRoom("PlayerRoom"); // share data with all players
    shareDataRoom("unity"); // share data with unity
    //checkSameSelection(); // Check if all players have selected the same card    
  });

  //#endregion from player

  //#region from unity
  socket.on("joinUnity", () => {
    socket.join("unity");
    socket.emit("joinedRoom", "unity"); 
  });

  socket.on("shareData", () => {
    shareDataPlayer(socket); // share data with socket
  });


  socket.on("setPhaseFromUnity", (phase) => {
    currentPhase = GamePhase[phase]; // Update the current phase
    resetCards(); // Reset selected cards for all players
    io.to("PlayerRoom").emit("setPhase", phase);
  });

  socket.on("cardInformationFromUnityForPlayer", (cards) => {
    const { AvailableCards, NonPlayableCards, CurrentCardToPlay } = cards;

    // Process AvailableCards
    if (Array.isArray(AvailableCards)) {
      availableCards = AvailableCards.map(card => new CardInfo(
        card.Health,
        card.Attack,
        card.Cost,
        card.Ability,
        card.Name,
        card.DisplayedName
      ));
    } else {
      console.error("Invalid AvailableCards data:", AvailableCards);
    }

    // Process NonPlayableCards
    if (Array.isArray(NonPlayableCards)) {
      nonPlayableCards = NonPlayableCards;
    } else {
      console.error("Invalid NonPlayableCards data:", NonPlayableCards);
    }

    // Process CurrentCardToPlay
    if (CurrentCardToPlay) {
      currentCardToPlay = new CardInfo(
        CurrentCardToPlay.Health,
        CurrentCardToPlay.Attack,
        CurrentCardToPlay.Cost,
        CurrentCardToPlay.Ability,
        CurrentCardToPlay.Name,
        CurrentCardToPlay.DisplayedName
      );
    } else {
      currentCardToPlay = null;
    }

    switch (currentPhase) {
      case GamePhase.select:
        allowPlayerCardSelection = 1;
        break;
      case GamePhase.place:
        allowPlayerCardSelection = 1;
        break;
      case GamePhase.sacrifice:
        if (currentCardToPlay) {
          allowPlayerCardSelection = currentCardToPlay.Cost;
        }
        else{allowPlayerCardSelection = 1;}
        break;
      default: // menu, attack, wait
        allowPlayerCardSelection = 0;
        break;
    }

    shareDataRoom("PlayerRoom"); // share data with all players
  });

  //#endregion from unity
  // logs to display in server console
  socket.on("log", (msg) => {
      console.log("Received log message" + socket.id + ": " + msg);
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete choices.player[socket.id];
    console.log("Client disconnected: " + socket.id);
    shareDataRoom("PlayerRoom"); // share data with all players
    shareDataRoom("unity"); // share data with unity
  });
});


//#region functions
function resetCards(){
  for (const playerId in choices.player) {
    choices.player[playerId].selectedCards = {}; // Reset selected cards for each player
    choices.player[playerId].buttonPressed = false; // Reset button pressed state for each player
    choices.player[playerId].cardPreview = -1; // Reset card preview index for each player
  }
  currentCardToPlay = null; // Reset the current card to play
  availableCards = []; // Reset the available cards
  nonPlayableCards = []; // Reset the non-playable cards
  console.log("Reset selected cards for all players.");
  shareDataAll(); // Share the updated data with all players
}

function shareDataAll(){
  io.emit("allPlayerChoices", choices.player); // send all player cards from server to clients
  io.emit("allPlayerCards", availableCards); // send all player cards from server to clients
  io.emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
  io.emit("allowPlayerCardSelection", allowPlayerCardSelection); // send all player cards from server to clients
  io.emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
}

function shareDataRoom(room) {
  io.to(room).emit("allPlayerChoices", choices.player); // send all player cards from server to clients
  io.to(room).emit("allPlayerCards", availableCards); // send all player cards from server to clients
  io.to(room).emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
  io.to(room).emit("allowPlayerCardSelection", allowPlayerCardSelection); // send all player cards from server to clients
  io.to(room).emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
}

function shareDataPlayer(socket) {
  socket.emit("allPlayerChoices", choices.player); // send all player cards from server to clients
  socket.emit("allPlayerCards", availableCards); // send all player cards from server to clients
  socket.emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
  socket.emit("allowPlayerCardSelection", allowPlayerCardSelection); // send all player cards from server to clients
  socket.emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
}

function setPhase(socket, phase) {
  socket.emit("setPhase", phase);
}

function checkSameSelection() {
  let sameCardSelected = true; 
  let buttonPressed = true;
  let selectedCards = {};

  for (const playerId in choices.player) {
    //get button pressed
    const buttonPress = choices.player[playerId].buttonPressed;

    if (!buttonPress) {
      buttonPressed = false; // Not all players have selected the same card
      break;
    }
  }

  if (buttonPressed != false) {
    io.to("unity").emit("buttonPressed"); // Notify Unity that all players have selected the same card
    console.log("All players pressed the button.");
    return;
  }

  for (const playerId in choices.player) {
    //get selected card
    const cardSelected = choices.player[playerId].selectedCards;
    if (Object.keys(cardSelected).length != allowPlayerCardSelection) {
      sameCardSelected = false; // Not all players have selected the same card
      break;
    }

    for (const selCard in cardSelected) {
      selectedCards[selCard] = true;
    }

    if (Object.keys(selectedCards).length > allowPlayerCardSelection) {
      sameCardSelected = false; // Not all players have selected the same card
      break;
    }
  }


  if (sameCardSelected != false && selectedCards != null) {
    for (const selCard in selectedCards) {
      if (selCard != "-1") {
        io.to("unity").emit("selectedCard", selCard); // Notify Unity that all players have selected the same card
      }
    }
  }
}

function setPlayerCursorPostion(socketID, clientType) {
  choices[clientType][socketID].positionOffset.side.x = Math.random();
  choices[clientType][socketID].positionOffset.side.y = Math.random() * 0.35;
  choices[clientType][socketID].positionOffset.middle.x = (Math.random() * (0.35 - 0.25) + 0.25) * (Math.random() < 0.5 ? -1 : 1); // Random float between -0.4 and -0.25 or 0.25 and 0.4
  choices[clientType][socketID].positionOffset.middle.y = Math.random() * 0.35;
}

function demandPhase(phase) {
  io.to("unity").emit("demandPhase", phase);
}

function updateChoicesPlayer(socketID, informationPlayerObject) {
  choices.player[socketID].selectedCards = informationPlayerObject.selectedCards;
  choices.player[socketID].cardPreview = informationPlayerObject.previewCardIndex;
  choices.player[socketID].buttonPressed = informationPlayerObject.buttonPressed;
}