/**
 * Browser safe random integer generator. Returns a random integer between min (inclusive) and max (exclusive).
 * @param {number} min 
 * @param {number} max 
 * @returns a random integer between min (inclusive) and max (exclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

const cards = {
    knight: {
        cost: 3,
        quantity: 1
    },
    minipekka: {
        cost: 5,
        quantity: 1
    },
    skeleton: {
        cost: 1,
        quantity: 3
    },
    flyingMachine: {
        cost: 4,
        quantity: 1
    },
    wizard: {
        cost: 4,
        quantity: 1
    },
    prince: {
        cost: 5,
        quantity: 1
    },
    archers: {
        cost: 2,
        quantity: 1
    },
    valkyrie: {
        cost: 3,
        quantity: 1
    }
}
const unitStats = {
    knight: {
        maxHP: 690,
        damage: 50,
		speed: 10,
		attackSpeed: 0.5,
		range: 20
    },
    minipekka: {
        maxHP: 817,
		damage: 200,
		speed: 10,
		attackSpeed: 0.8,
		range: 20
    },
    skeleton: {
        maxHP: 50,
        damage: 10,
		speed: 10,
		attackSpeed: 0.3,
		range: 20
    },
    flyingMachine: {
        maxHP: 400,
		damage: 90,
		speed: 10,
		attackSpeed: 0.7,
		range: 70
    },
    wizard: {
        maxHP: 300,
        damage: 60,
		speed: 10,
		attackSpeed: 0.5,
		range: 80,
        //[radius] (may need to add more)
        aoe: [10]
    },
    prince: {
        maxHP: 1000,
		damage: 100,
		speed: 10,
		attackSpeed: 0.7,
		range: 30,
        //[chargeTime, chargeDamageMult, chargeCooldown, chargeSpeedMult] (may need to add more)
        charge: [0,1.5,0,1.5]
    },
    archers: {
        maxHP: 200,
        damage: 50,
		speed: 10,
		attackSpeed: 0.5,
		range: 80
    },
    valkyrie: {
        maxHP: 800,
		damage: 50,
		speed: 10,
		attackSpeed: 0.8,
		range: 20,
        aoe: [10]
    }
}
let pos = {x: 0, y: 0}; // global mouse position
class Card{
    /**
     * Uses card type or card object to create a card instance. If given a card object, it will try to find the corresponding key in the cards object. If it can't find it, it will use 'unknown' as the type and 0 as the cost.
     * @param {object | string} type 
     * @param {string} team 
     */
    constructor(type,team){
        // Normalize type to a string key (accept either a key or the card object)
        if (typeof type === 'string') {
            this.type = type;
            this.stats = unitStats[type];
        } else {
            const key = Object.keys(cards).find(k => cards[k] === type);
            this.type = key || 'unknown';
            this.stats = unitStats[this.type] || {};
        }
        this.team = team;
        //deck, next, 1, 2, 3, 4
        this.pos = 'deck';
        this.cost = cards[this.type] ? cards[this.type].cost : (type.cost || 0);
        // initial x is just base; actual position will be set by rollDeck when drawn
        this.x = 20;
        this.y = undefined; // y will be determined by renderCards based on pos and hover state
        this.scale = 1; // default scale, can be modified for hover effect
        this.isDragging = false; // flag to indicate if the card is being dragged
    }
    renderCards() {
        const ctx = gameArea.canvas.getContext('2d');
        const BASE_X = 20;
        const CARD_WIDTH = 70;
        const CARD_HEIGHT = 100;
        const CARD_SPACING = 90;
        if (this.pos === 'deck') return;
        this.scale = typeof this.pos === 'number' ? 1 : 0.5;
        const w = CARD_WIDTH * this.scale;
        const h = CARD_HEIGHT * this.scale;
        if (selectedCard === this && this.isDragging) {
            this.x = pos.x - 35; // center card on cursor
            this.y = pos.y - 50;
        } else {
            if (this.pos === 'next') {
                this.x = BASE_X + 4 * CARD_SPACING;
            } else {
                this.x = BASE_X + (this.pos - 1) * CARD_SPACING;
            }
        }
        // Use this.y if set, otherwise default to 560
        const y = this.y !== undefined ? this.y : 560 + (CARD_HEIGHT - h);
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x, y, w, h);
        ctx.fillStyle = 'white';
        ctx.fillText(this.type, this.x + 5, y + h / 2 + 5);
        if (typeof this.pos === 'number') {
            ctx.fillText(`Cost: ${this.cost}`, this.x + 5, y + h / 2 + 20);
        }
    }
    onHover(){
        this.y = 540; // move card up on hover
    }
    onHoverExit(){
        this.y = undefined; // reset to default position
    }
    onClick(){
        if (selectedCard === null){
            // pos is set globally in click handler
            pos = getMousePos(gameArea.canvas, event);
            const scale = typeof this.pos === 'number' ? 1 : 0.5;
            const w = 70 * scale;
            const h = 100 * scale;
            const y = 560 + (100 - h); // Always use default y for click detection to prevent issues with hover state
            if (pos.x >= this.x && pos.x <= this.x + w &&
                pos.y >= y && pos.y <= y + h) {
                selectedCard = this;
                this.isDragging = false;
            }
        } else if (selectedCard === this){
            selectedCard = null;
            this.isDragging = false;
            if (checkCardRequirements(this,pos,bluePlayer)){
                bluePlayer.elixir -= this.cost;
                let card = blueDeck[this.pos-1]
                blueDeck.splice(this.pos-1, 1); // remove card from deck array
                blueDeck.push(card); // add card back to end of deck array
                this.pos = 'deck'; // remove card from hand
                this.x = 20; // reset to base x; actual position will be set by rollDeck when drawn
                this.y = undefined; // reset to default position
                gameArea.activeUnits.push(new Unit(this.stats,`${this.team}_${this.type}_${gameArea.activeUnits.length+1}`,pos.x,pos.y));
                updateDeckPositions('blue');
                renderDecks();
                drawDeckOnCanvas('blue');
            } else {
                // Card placement rejected - reset y position so it renders correctly
                this.y = undefined;
            }
        }
    }
}
function checkCardRequirements(card,pos,player){
    let canAfford = player.elixir >= card.cost
    let inPlayField = pos.x >= gameArea.playField.x && pos.x <= gameArea.playField.x + gameArea.playField.width &&
                      pos.y >= gameArea.playField.y && pos.y <= gameArea.playField.y + gameArea.playField.height
    if (!canAfford){
        alert('Not enough elixir!');
    } else if (!inPlayField){
        alert('Card must be played within the playfield!');
    }
    return canAfford && inPlayField;
}
function updateDeckPositions(team){
    const deck = team === 'blue' ? blueDeck : redDeck;
    for (let i = 0; i < deck.length; i++) {
        if (i < 4) {
            deck[i].pos = i + 1;
            deck[i].y = undefined; // reset y position when card enters hand
        } else if (i === 4) {
            deck[i].pos = 'next';
            deck[i].y = undefined; // reset y position when card becomes next
        } else {
            deck[i].pos = 'deck';
            deck[i].y = undefined; // reset y position when card goes to deck
        }
    }
}
class Unit{
    /**
     * Creates a unit instance with the given stats, id, and position. The id should be in the format 'team_type_number' (e.g. 'blue_knight_1'). The position is an array [x, y] internally, representing the unit's location on the canvas. The unit will be drawn as a colored square based on its type.
     * @param {object} stats 
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(stats,id,x,y){
        this.id = id
        this.type = id.split('_')[1]
        this.pos = [x,y]
        this.stats = stats
        this.active = true
        // Drawing will be handled by drawDeckOnCanvas
    }
    /**
     * Checks the color of the unit based on its type.
     * @param {string} type 
     * @returns {string} color to draw the unit based on its type (currently just checks if it's a knight or not, may need to be expanded in the future)
     */
    checkColor(type){
        let color = 'black';
        if (type == 'knight'){
            color = 'gray';
        } else if (type == 'minipekka'){
            color = 'purple';
        } else if (type == 'skeleton'){
            color = 'white';
        } else if (type == 'flyingMachine'){
            color = 'brown';
        } else if (type == 'wizard'){
            color = 'orange';
        } else if (type == 'prince'){
            color = 'gold';
        } else if (type == 'archers'){
            color = 'pink';
        } else if (type == 'valkyrie'){
            color = 'red';
        }
        return color;
    }
}
let blueDeck = []
let redDeck = []
const gameArea = {
    canvas : document.createElement("canvas"),
    playField : {
        x: 20,
        y: 20,
        width: 400,
        height: 500
    },
    activeUnits: [],
    start : function() {
        this.canvas.width = 440;
        this.canvas.height = 680;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);
    }
}
// will fill in more player things when needed
const redPlayer = {
    elixir: 0
}
const bluePlayer = {
    elixir: 1000
}
function startGame(){
    gameArea.start();
    blueDeck = [new Card(cards.knight,'blue'),new Card(cards.minipekka,'blue'),new Card(cards.skeleton,'blue'),new Card(cards.flyingMachine,'blue'),new Card(cards.wizard,'blue'),new Card(cards.prince,'blue'),new Card(cards.archers,'blue'),new Card(cards.valkyrie,'blue')];
    redDeck = [new Card(cards.knight,'red'),new Card(cards.minipekka,'red'),new Card(cards.skeleton,'red'),new Card(cards.flyingMachine,'red'),new Card(cards.wizard,'red'),new Card(cards.prince,'red'),new Card(cards.archers,'red'),new Card(cards.valkyrie,'red')];

    blueDeck = rollDeck('blue');
    drawDeckOnCanvas('blue');          // only draw the player deck for now

    redDeck = rollDeck('red');
    // drawDeckOnCanvas('red');        // uncomment if you want the enemy deck visible

    renderDecks();
}
let currentUnits = []

// draw every card belonging to the specified team onto the canvas; the deck area is cleared once
function drawDeckOnCanvas(team) {
    const ctx = gameArea.canvas.getContext('2d');
    // clear only the bottom portion (deck area) so we don't disturb other drawings;
    // the full-clear used to repaint the playfield each time which sometimes used
    // the wrong fillStyle and made the playfield blend with the canvas background.
    // the height of the deck region is roughly 160px at the bottom of a 680px canvas.
    ctx.clearRect(0, 520, gameArea.canvas.width, gameArea.canvas.height - 520);
    ctx.clearRect(0,0,gameArea.canvas.width,20);
    ctx.clearRect(0,20,20,500);
    ctx.clearRect(420,20,20,500);
    // draw the playfield with a fixed colour so it's always visible
    ctx.fillStyle = 'green';
    ctx.fillRect(gameArea.playField.x, gameArea.playField.y,
                 gameArea.playField.width, gameArea.playField.height);

    // Draw active units on top of the playfield
    gameArea.activeUnits.forEach(unit => {
        ctx.fillStyle = unit.checkColor(unit.type);
        ctx.fillRect(unit.pos[0], unit.pos[1], 30, 30);
    });

    // Draw elixir display
    ctx.fillStyle = 'black';
    ctx.font = '15px Arial';
    ctx.fillText(`Elixir: ${bluePlayer.elixir.toFixed(1)}`, 10, 15);

    const deck = team === 'blue' ? blueDeck : redDeck;
    deck.forEach(card => card.renderCards());
}

/**
 * Randomizes the deck order for the given team and returns the new deck. Also sets the pos property of each card in the deck based on its position in the array (1-4 for the first 4 cards, 'next' for the 5th card, and 'deck' for the rest).
 * @param {string} team 
 * @returns the randomized deck for the given team, also sets the pos property of each card in the deck based on its position in the array (1-4 for the first 4 cards, 'next' for the 5th card, and 'deck' for the rest)
 */
function rollDeck(team){
    let newDeck = [];
    let oldDeck = team == 'blue' ? blueDeck : redDeck;
    const originalCount = oldDeck.length;
    for (let i = 0; i < originalCount; i++){
        const idx = randomInt(0, oldDeck.length);
        const randomCard = oldDeck.splice(idx, 1)[0];
        newDeck.push(randomCard);
    }

    // reset all positions first so we don't carry over stale values
    for (let card of newDeck) {
        card.pos = 'deck';
    }

    if (newDeck.length > 0){newDeck[0].pos = 1;}
    if (newDeck.length > 1){newDeck[1].pos = 2;}
    if (newDeck.length > 2){newDeck[2].pos = 3;}
    if (newDeck.length > 3){newDeck[3].pos = 4;}
    if (newDeck.length > 4){newDeck[4].pos = 'next';}

    // update global variable to the freshly shuffled deck
    if (team === 'blue') {
        blueDeck = newDeck;
    } else {
        redDeck = newDeck;
    }

    return newDeck;
}
function renderDecks() {
    const blueEl = document.getElementById('blue-deck-list');
    const redEl = document.getElementById('red-deck-list');
    if (!blueEl || !redEl) return;
    blueEl.innerHTML = '';
    redEl.innerHTML = '';
    blueDeck.forEach(card => {
        const li = document.createElement('li');
        li.innerText = `${card.type} (pos: ${card.pos})`;
        blueEl.appendChild(li);
    });
    redDeck.forEach(card => {
        const li = document.createElement('li');
        li.innerText = `${card.type} (pos: ${card.pos})`;
        redEl.appendChild(li);
    });
}

let hoveredCard = null; // Track the currently hovered card
let selectedCard = null; // Track the currently selected card

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

gameArea.canvas.addEventListener('mousemove', function(evt) {
    const mousePos = getMousePos(gameArea.canvas, evt);
    pos = mousePos;
    let newHoveredCard = null;

    // Check hover for blue deck cards (adjust for red deck if needed)
    blueDeck.forEach(card => {
        if (card.pos !== 'deck' && card.pos !== 'next') {
            const scale = typeof card.pos === 'number' ? 1 : 0.5;
            const w = 70 * scale;
            const h = 100 * scale;
            const y = 560 + (100 - h); // Always use default y for hover detection to prevent flashing
            if (mousePos.x >= card.x && mousePos.x <= card.x + w &&
                mousePos.y >= y && mousePos.y <= y + h) {
                newHoveredCard = card;
            }
        }
    });

    // Update hover state
    if (hoveredCard !== newHoveredCard) {
        if (hoveredCard) {
            hoveredCard.onHoverExit();
        }
        if (newHoveredCard) {
            newHoveredCard.onHover();
        }
        hoveredCard = newHoveredCard;
        // Re-render to show changes
        drawDeckOnCanvas('blue');
    }
    if (selectedCard) {
        selectedCard.x = mousePos.x - 35; // center card on cursor
        selectedCard.y = mousePos.y - 50;
        selectedCard.isDragging = true;
        drawDeckOnCanvas('blue');
    }
});

gameArea.canvas.addEventListener('click', function(evt) {
    const mousePos = getMousePos(gameArea.canvas, evt);
    pos = mousePos;
    // Check click for blue deck cards (adjust for red deck if needed)
    blueDeck.forEach(card => {
        if (card.pos !== 'deck' && card.pos !== 'next') {
            card.onClick();
        }
    });
    drawDeckOnCanvas('blue');
});

// Optional: Reset hover on mouse leave
gameArea.canvas.addEventListener('mouseleave', function() {
    if (hoveredCard) {
        hoveredCard.onHoverExit();
        hoveredCard = null;
        drawDeckOnCanvas('blue');
    }
});

// render initial decks
startGame()
console.log('game started')
renderDecks();
/**
 * Prints a message to the console and sends it to the server for logging. Used since I'm used to Python. (console.log still has normal functionality)
 * @param {string} string 
 */
function print(string){
    console.log(string);
}

print('all code loaded')