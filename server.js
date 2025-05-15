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
  constructor(Health, Attack, Cost, Ability, Name) {
    this.Health = Health;
    this.Attack = Attack;
    this.Cost = Cost;
    this.Ability = Ability;
    this.Name = Name;
    this.Image = null; 
  }
}

let availableCards = []; // objects
let nonPlayableCards = []; // indexes of cards that are not playable
let currentCardToPlay = null; // cardInfo

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
console.log("Current phase: " + currentPhase);
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
    lastColorIndex = lastColorIndex+1 % customColors.length; // colorindex
    choices.player[socket.id].colorIndex = lastColorIndex; // colorindex
    choices.player[socket.id].color = customColors[lastColorIndex]; // color
    choices.player[socket.id].positionOffset = {
      side: {},
      middle: {}
    };
    setPlayerCursorPostion(socket.id, "player");
  
    socket.emit("init", choices.player, socket.id);
    setPhase(socket, currentPhase); // set phase for player
    shareDataRoom("PlayerRoom"); // share data with all players
    shareDataRoom("unity"); // share data with unity
  });

  socket.on("cardsPlayer", (type, index) => {
    choices.player[socket.id][type] = index;
    setPlayerCursorPostion(socket.id, "player");
    shareDataRoom("PlayerRoom"); // share data with all players
    shareDataRoom("unity"); // share data with unity
    
    checkSameSelectedCard(); // Check if all players have selected the same card    
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
    io.to("PlayerRoom").emit("setPhase", phase);
    currentPhase = GamePhase[phase]; // Update the current phase
    resetCards(); // Reset selected cards for all players
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
        card.Name
      ));
      console.log("Available Cards:", availableCards);
    } else {
      console.error("Invalid AvailableCards data:", AvailableCards);
    }

    // Process NonPlayableCards
    if (Array.isArray(NonPlayableCards)) {
      nonPlayableCards = NonPlayableCards;
      console.log("Non-Playable Cards:", nonPlayableCards);
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
        CurrentCardToPlay.Name
      );
      console.log("Current Card to Play:", currentCardToPlay);
    } else {
      currentCardToPlay = null;
      console.log("No Current Card to Play.");
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

function resetCards(){
  for (const playerId in choices.player) {
    choices.player[playerId].cardSelected = -1; // Reset the selected card for each player
    choices.player[playerId].cardPreview = -1; // Reset the placed card for each player
  }
  currentCardToPlay = null; // Reset the current card to play
  availableCards = []; // Reset the available cards
  nonPlayableCards = []; // Reset the non-playable cards
  console.log("Reset selected cards for all players.");
}


function shareDataRoom(room) {
  io.to(room).emit("allPlayerChoices", choices.player); // send all player cards from server to clients
  io.to(room).emit("allPlayerCards", availableCards); // send all player cards from server to clients
  io.to(room).emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
  io.to(room).emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
}

function shareDataPlayer(socket) {
  socket.emit("allPlayerChoices", choices.player); // send all player cards from server to clients
  socket.emit("allPlayerCards", availableCards); // send all player cards from server to clients
  socket.emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
  socket.emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
}

function setPhase(socket, phase) {
  socket.emit("setPhase", phase);
}

function checkSameSelectedCard() {
  let sameCardSelected = true; 
  let selectedCard = -1;

  for (const playerId in choices.player) {
    //get selected card
    const cardSelected = choices.player[playerId].cardSelected;
    if (cardSelected == -1) {
      sameCardSelected = false; 
      break;
    }

    // Check if the cardSelected is the same for all players
    if (selectedCard == -1) {
      selectedCard = cardSelected; // Set the first player's cardSelected as the reference
    } else if (cardSelected != selectedCard) {
      sameCardSelected = false; // Found a mismatch
      break;
    }
  }

  if (sameCardSelected != false && selectedCard != -1 && selectedCard != null) {
    console.log("All players have selected the same card: " + selectedCard);
    io.to("unity").emit("selectedCard", selectedCard); // Notify Unity that all players have selected the same card
  } else {
    console.log("Not all players have selected the same card yet.");
  }
}

function setPlayerCursorPostion(socketID, clientType) {
  choices[clientType][socketID].positionOffset.side.x = Math.random();
  choices[clientType][socketID].positionOffset.side.y = Math.random() * 0.45;
  choices[clientType][socketID].positionOffset.middle.x = (Math.random() * (0.4 - 0.25) + 0.25) * (Math.random() < 0.5 ? -1 : 1); // Random float between -0.4 and -0.25 or 0.25 and 0.4
  choices[clientType][socketID].positionOffset.middle.y = Math.random() * 0.45;
}

function demandPhase(phase) {
  io.to("unity").emit("demandPhase", phase);
}