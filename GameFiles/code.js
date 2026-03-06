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
        } else {
            const key = Object.keys(cards).find(k => cards[k] === type);
            this.type = key || 'unknown';
        }
        this.team = team;
        //deck, next, 1, 2, 3, 4
        this.pos = 'deck';
        this.cost = cards[this.type] ? cards[this.type].cost : (type.cost || 0);
        // initial x is just base; actual position will be set by rollDeck when drawn
        this.x = 20;
    }
    renderCards(){
        const ctx = gameArea.canvas.getContext('2d');
        const BASE_X = 20;
        const CARD_WIDTH = 70;
        const CARD_HEIGHT = 100;
        const CARD_SPACING = 90; // horizontal gap between card origins
        if (this.pos === 'deck') return; // only draw visible positions
        // determine scale: numeric positions are full size, others (e.g. 'next') half size
        const scale = typeof this.pos === 'number' ? 1 : 0.5;
        const w = CARD_WIDTH * scale;
        const h = CARD_HEIGHT * scale;
        // compute x position; place 'next' after the four active cards
        if (this.pos === 'next') {
            this.x = BASE_X + 4 * CARD_SPACING;
        } else {
            this.x = BASE_X + (this.pos - 1) * CARD_SPACING;
        }
        // bottom-align smaller cards to the row
        const y = 560 + (CARD_HEIGHT - h);
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x, y, w, h);
        ctx.fillStyle = 'white';
        ctx.fillText(this.type, this.x + 5, y + h / 2 + 5);
        if (typeof this.pos === 'number') {
            ctx.fillText(`Cost: ${this.cost}`, this.x + 5, y + h / 2 + 20);
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
        const ctx = gameArea.canvas.getContext('2d');
        ctx.fillStyle = this.checkColor(this.type);
        ctx.fillRect(this.pos[0],this.pos[1],40,40)
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
        }
        return color;
    }
}
let blueDeck = []
let redDeck = []
const gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 440;
        this.canvas.height = 680;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);
    }
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
    ctx.clearRect(0, 600, gameArea.canvas.width, 80);
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