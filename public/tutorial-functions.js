let helpState = {
    selectPhase: 0,
    placePhase: 0
  };

let showHelp = true;

let cantPlayTest = [
    //TODO
]

function showTutorialMessages() {
    fill(255);
    textSize(50);
    textAlign(CENTER, TOP);
    stroke(0);
    strokeWeight(5);
    if (!showHelp) return;
    switch (currentPhase) {
        case GamePhase.select:
            switch (helpState.selectPhase){
                case 0:
                    text("Click on the card in the middle to select it...", windowWidth/10 , 0+windowHeight/10, windowWidth * 0.8, windowHeight-windowHeight/10);
                    break;
                case 1:
                    text("Click again on that card to unselect it...", windowWidth/10 , 0+windowHeight/10, windowWidth * 0.8, windowHeight-windowHeight/10);
                    break;
                case 2:
                    text("Other Players can see, which card you selected as large colorful dots.\nPress anywhere to continue...", windowWidth/10 , 0+windowHeight/10, windowWidth * 0.8, windowHeight-windowHeight/10);
                    break;
                case 3:
                    text("Without any selected card, other plays see your current middle card.\nPress anywhere to continue...", windowWidth/10 , 0+windowHeight/10, windowWidth * 0.8, windowHeight-windowHeight/10);
                    break;
                default:
                    break;
        }
            break;
        case GamePhase.place:
            switch (helpState.placePhase){
                case 0:
                    text("Now Select a slot to place the card on...", windowWidth/10 , 0+windowHeight/10, windowWidth * 0.8, windowHeight-windowHeight/10);
                    break;
                default:
                    break;
        }
            break;
    }
    noStroke();
}

function waitingForCards(){
    textAlign(CENTER, CENTER);
    textSize(windowWidth / 10);
    fill(255);
    text("Waiting for cards...", width / 2, height / 2);
  }
  

function resetTutorialMessages() {
    for (let key in helpState) {
        helpState[key] = 0;
    }
}

function toggleTutorialMessagesOff() {
    for (let key in helpState) {
        helpState[key] = -1;
    }
}