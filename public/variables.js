let debug = true;
let drawPlayerCursors = true;

let socket;
let isMobile = false;

// client information
let ownIdOnServer = null;
let playerChoices = {};
let allowCardSelection = 1;
let informationPlayer = { // this client as player
  previewCardIndex: -1,
  selectedCards: {}, 
  buttonPressed: false
};

// card/ game information
const GamePhase = {
  wait: "wait",
  select: "select",
  sacrifice: "sacrifice",
  place: "place",
  attack: "attack",
  menu: "menu"
};

let numCards = 0;
let availableCards = []; // objects
let nonPlayableCards = []; // indexes of cards that are not playable
let currentCardToPlay = null; // cardInfo
let currentPhase = GamePhase.wait;

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

// UI Stuff
const cardPositions = {
  middleCard: 
    {
      x: 0.5,
      y: 0.5,
      scale: 1.0
    },
  cardOffset1:
    {
      x: 0.15,
      y: 0,
      scale: 0.75
    },
  cardOffset2:
    {
      x: 0.25,
      y: 0,
      scale: 0.65
    }
}
const arrowPositions = {
  left: {
    x: 0.05,
    y: 0.9
  },
  right: {
    x: 0.95,
    y: 0.9
  }
}

const baseTint = [120, 70, 20]; // Reddish-brown, simulates dim warm lighting
const greyTint = [100, 100, 100]; // Greyish tint for disabled cards

let mainFont;
let cardFont;
let images = [];
let imageLookUp = {}; // Object to store loaded images with their filenames as keys
let customColors = [];
let smallerSide = null;
let cardWidth, cardHeight, arrowWidth, arrowHeight, cursorWidth, cursorHeight;
let UIRects = {
  arrows: {
    left: {},
    right: {}
  }, 
  cards: {
    left: {    },
    right: { },
    left2: {    },
    right2: {    },
    middle: {    }
  },
  images: {
    left: {    },
    right: { },
    left2: {    },
    right2: {    },
    middle: {    }
  },
  costs: {
    left: {    },
    right: { },
    left2: {    },
    right2: {    },
    middle: {    }
  },
  abilities: {
    left: {    },
    right: { },
    left2: {    },
    right2: {    },
    middle: {    }
  },
  buttons:{
    middleLow:{}
  },
  customCursors: {
  },
  help:{}
}