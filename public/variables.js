let debug = true;

let socket;
let isMobile = false;
let numCards = 0;
let previewCardIndex = 0;
let mainFont;
let images = [];
let imageLookUp = {}; // Object to store loaded images with their filenames as keys

let playerID; // ID of the player (num players), additionally to playerID
let activeOtherPlayer = 0; 
let otherPlayerChoices = {};

let cardWidth, cardHeight, arrowWidth, arrowHeight, cursorWidth, cursorHeight;

let selectedCard = null;

const GamePhase = {
  wait: "wait",
  select: "select",
  sacrifice: "sacrifice",
  place: "place",
  attack: "attack",
  menu: "menu"
};

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

let currentPhase = GamePhase.wait;

// TODO auslagern in anderes script
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
    y: 0.95
  },
  right: {
    x: 0.95,
    y: 0.95
  }
}

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
  customCursors: {
  },
  help:{}
}

const baseTint = [120, 70, 20]; // Reddish-brown, simulates dim warm lighting

let customColors = [];

let smallerSide = null;