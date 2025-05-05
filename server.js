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
  player: {} // Array to store player choices mit id, type, index
}

//#region load images
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
//#endregion load images

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
    socket.emit("getPlayerID", numClients, sendChoices) // send player id
    socket.broadcast.emit("updateNumPlayer", numClients, socket.id, "join"); // update number of players for other clients
    choices.player[socket.id] = {};
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
    
    // check if all players have selected the same card
    let sameCardSelected = true; 
    let selectedCard = null;

    for (const playerId in choices.player) {
      //get selected card
      const cardSelected = choices.player[playerId].cardSelected;
      if (cardSelected == null) {
        sameCardSelected = false; 
        break;
      }

      // Check if the cardSelected is the same for all players
      if (selectedCard == null) {
        selectedCard = cardSelected; // Set the first player's cardSelected as the reference
      } else if (cardSelected !== selectedCard) {
        sameCardSelected = false; // Found a mismatch
        break;
      }
    }

    if (sameCardSelected) {
      console.log("All players have selected the same card: " + selectedCard);
      io.to("unity").emit("selectedCard", selectedCard); // Notify Unity that all players have selected the same card
      io.to("PlayerRoom").emit("setPhase", "place"); 
      resetCards(); // Reset selected cards for all players
    } else {
      console.log("Not all players have selected the same card yet.");
    }
  });

  //#endregion from player

  //#region player to unity
  socket.on("selectCard", (cardIndex) => {
    console.log("Received selectCard from " + socket.id + ": " + cardIndex);
    io.to("unity").emit("selectCard", cardIndex);
  });

  //#endregion player to unity
  //#region from unity
  socket.on("joinUnity", () => {
    socket.join("unity");
  });


  socket.on("setPhase", (phase, values) => {
    // TODO für z.b. select phase von unity an client welche karten
    io.to("PlayerRoom").emit("setPhase", phase, values);
  });

  socket.on("setPhase", (phase) => {
    io.to("PlayerRoom").emit("setPhase", phase);
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
    const room = io.sockets.adapter.rooms.get(socket.data.room);
    const numClients = room ? room.size : 0;
    socket.broadcast.emit("updateNumPlayer", numClients, socket.id, "disconnect"); // update number of players for other clients
  });
});

function resetCards(){
  for (const playerId in choices.player) {
    choices.player[playerId].cardSelected = null; // Reset the selected card for each player
    choices.player[playerId].cardPreview = null; // Reset the placed card for each player
  }
  console.log("Reset selected cards for all players.");
}