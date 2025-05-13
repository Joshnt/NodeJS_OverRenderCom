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

let currentPhase = GamePhase.select; // Initialize the current phase
console.log("Current phase: " + currentPhase);
let lastColorIndex = -1;

const customColors = [
    [61, 111, 165],   // coolBlue
    [119, 166, 95],   // poisonGreen
    [139, 46, 46],    // bloodRed
    [136, 193, 208],  // paleCyan
    [176, 176, 176],  // ashGray
    [119, 92, 148]    // violetShadow
  ];

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

app.get('/api/customColors', (req, res) => {
  res.json(customColors);
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
    socket.data.room = "PlayerRoom";
    const room = io.sockets.adapter.rooms.get("PlayerRoom");
    const numClients = room ? room.size : 0;

    let sendChoices = choices.player;
    choices.player[socket.id] = {};
    lastColorIndex = lastColorIndex+1 % customColors.length; // colorindex
    choices.player[socket.id].colorIndex = lastColorIndex; // colorindex
    socket.emit("getPlayerID", numClients, sendChoices) // send player id
    socket.emit("allPlayerCards", availableCards); // send all player cards from server to clients
    socket.emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
    socket.emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
    socket.emit("setPhase", currentPhase); // send current phase to player
    socket.broadcast.emit("updateNumPlayer", {numClients: numClients, 
                                              socketID: socket.id, 
                                              action: "join",
                                              colorIndex: choices.player[socket.id].colorIndex}); // update number of players for other clients

    console.log(`Socket ${socket.id} joined room PlayerRoom with ID ${numClients}`);
  });

  // When this client sends a "data" event...
  socket.on("data", (msg) => {
      console.log("Received data from " + socket.id + ": " + msg);
      io.to("unity").emit("data", msg);
  });

  socket.on("cardsPlayer", (type, index) => {
    console.log("Received data from " + socket.id + ": " + type + " " + index);
    choices.player[socket.id][type] = index;
    socket.broadcast.emit("cardsPlayer_other", socket.id, type, index);
    io.to("unity").emit("cardsPlayer", {socketID: socket.id, 
                                        type:type, 
                                        index: index});
    
    // check if all players have selected the same card
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
  });

  //#endregion from player

  //#region from unity
  socket.on("joinUnity", () => {
    socket.join("unity");
    socket.emit("joinedRoom", "unity"); 
    socket.emit("sendColors", customColors); // send custom colors to unity
  });

  socket.on("shareData", () => {
    socket.emit("allPlayerChoices", choices.player); // send all player cards from server to clients
    socket.emit("allPlayerCards", availableCards); // send all player cards from server to clients
    socket.emit("allPlayerNonPlayableCards", nonPlayableCards); // send all player cards from server to clients
    socket.emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients

    socket.data.room = "PlayerRoom";
    const room = io.sockets.adapter.rooms.get("PlayerRoom");
    const numClients = room ? room.size : 0;
    socket.emit("updateNumPlayer", {numClients: numClients, 
                                          socketID: "", 
                                          action: "get",
                                          colorIndex: ""}); // update number of players for other clients
  });


  socket.on("setPhase", (phase) => {
    io.to("PlayerRoom").emit("setPhase", phase);
    currentPhase = GamePhase[phase]; // Update the current phase
    resetCards(); // Reset selected cards for all players
  });

  socket.on("cardInformationPlayer", (i, cardInfo) => {
    console.log("Received card information from Unity: " + i + " " + cardInfo);
    if (i >= 0){
      availableCards[i] = new CardInfo(cardInfo.Health, cardInfo.Attack, cardInfo.Cost, cardInfo.Ability, cardInfo.Name);
      io.to("PlayerRoom").emit("cardInformationPlayer", i, cardInfo); // Send the card information to all players
    } else if (i == -1){
      currentCardToPlay = new CardInfo(cardInfo.Health, cardInfo.Attack, cardInfo.Cost, cardInfo.Ability, cardInfo.Name);
      console.log("Current card to play: " + currentCardToPlay.Name);
      io.to("PlayerRoom").emit("currentCardToPlay", currentCardToPlay); // send all player cards from server to clients
    }
  });

  socket.on("nonPlayableCardsPlayer", (nonPlayableCardsTemp) => {
    console.log("Received non-playable cards from Unity: " + nonPlayableCardsTemp);
    nonPlayableCards = nonPlayableCardsTemp;
    io.to("PlayerRoom").emit("nonPlayableCardsPlayer", nonPlayableCards); // Send the non-playable cards to all players
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
    const room = io.sockets.adapter.rooms.get("PlayerRoom");
    const numClients = room ? room.size : 0;
    socket.broadcast.emit("updateNumPlayer", {numClients: numClients, 
                                          socketID: socket.id, 
                                          action: "disconnect",
                                          colorIndex: -1}); // update number of players for other clients
    let sendChoices = choices.player;
    socket.emit("allPlayerChoices", sendChoices); // send player choices to unity
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
