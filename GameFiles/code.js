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
		damage: 90,
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
		damage: 200,
		speed: 10,
		attackSpeed: 0.7,
		range: 20,
        //[chargeTime, chargeDamageMult, chargeCooldown, chargeSpeedMult] (may need to add more)
        charge: [0,1.5,0,1.5]
    },
    archers: {
        maxHP: 200,
        damage: 50,
		speed: 10,
		attackSpeed: 0.5,
		range: 20
    },
    valkyrie: {
        maxHP: 600,
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
    }
})
class Unit{
    /**
     * Creates a unit instance with the given stats, id, and position. The id should be in the format 'team_type_number' (e.g. 'blue_knight_1'). The position is an array [x, y] representing the unit's location on the canvas. The unit will be drawn as a colored square based on its type.
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
let blueDeck = [new Card(cards.knight,'blue'),new Card(cards.minipekka,'blue'),new Card(cards.skeleton,'blue'),new Card(cards.flyingMachine,'blue'),new Card(cards.wizard,'blue'),new Card(cards.prince,'blue'),new Card(cards.archers,'blue'),new Card(cards.valkyrie,'blue')]
let redDeck = [new Card(cards.knight,'red'),new Card(cards.minipekka,'red'),new Card(cards.skeleton,'red'),new Card(cards.flyingMachine,'red'),new Card(cards.wizard,'red'),new Card(cards.prince,'red'),new Card(cards.archers,'red'),new Card(cards.valkyrie,'red')]
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
    currentUnits.push(new Unit(unitStats.knight,'blue_knight_1',50,50));
    blueDeck = rollDeck('blue');
    redDeck = rollDeck('red');
    renderDecks();
}
let currentUnits = []
/**
 * Randomizes the deck order for the given team and returns the new deck. Also sets the pos property of each card in the deck based on its position in the array (1-4 for the first 4 cards, 'next' for the 5th card, and 'deck' for the rest).
 * @param {string} team 
 * @returns the randomized deck for the given team, also sets the pos property of each card in the deck based on its position in the array (1-4 for the first 4 cards, 'next' for the 5th card, and 'deck' for the rest)
 */
function rollDeck(team){
    let newDeck = []
    let oldDeck = team == 'blue' ? blueDeck : redDeck;
    const originalCount = oldDeck.length;
    for (let i = 0; i < originalCount; i++){
        const idx = randomInt(0, oldDeck.length);
        const randomCard = oldDeck.splice(idx, 1)[0];
        newDeck.push(randomCard);
    }
    if (newDeck.length > 0){newDeck[0].pos = 1;}
    if (newDeck.length > 1){newDeck[1].pos = 2;}
    if (newDeck.length > 2){newDeck[2].pos = 3;}
    if (newDeck.length > 3){newDeck[3].pos = 4;}
    if (newDeck.length > 4){newDeck[4].pos = 'next';}
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