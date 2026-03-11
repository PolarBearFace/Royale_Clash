/**
 * Browser safe random integer generator. Returns a random integer between min (inclusive) and max (exclusive).
 * @param {number} min 
 * @param {number} max 
 * @returns a random integer between min (inclusive) and max (exclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// Will only work if using the server.js infrastructure. Otherwise, it will fail. May change either instructions or change back later
// Will fail using file:// protocol due to CORS issues with fetch, so only use with server.js
import {cards, unitStats} from './cards.js';
const gameState = {
    lastTime: 0,
    maxElixir: 10,
    elixirRegenRate: 0.35, // elixir per second
}

let pos = {x: 0, y: 0}; // global mouse position
//Used to make rendering easier, since it's kinda difficult right now to manage the rendering of units and whatnot
class Shape{
    /**
     * Creates a shape instance with the given x and y coordinates, shape type, properties, and color. The shape will be drawn on the canvas based on its type and properties. The properties parameter is an object that can contain different keys depending on the shape type (e.g. radius for circles, width and height for rectangles, etc.). The color parameter is a string representing the color to draw the shape.
     * @param {number} x 
     * @param {number} y 
     * @param {string} shape 
     * @param {object} properties 
     * @param {string} color 
     */
    constructor(x,y,shape='circle',properties={},color='black'){
        this.x = x;
        this.y = y;
        this.shape = shape;
        //Properties that are shape dependent, like radius for circles, width and height for rectangles, etc. Should be passed in as an object with relevant keys (e.g. {radius: 10} for circles, {width: 20, height: 30} for rectangles)
        this.properties = properties;
        this.color = color;
        this.visible = true; // flag to control whether the shape should be rendered; can be used for things like hover effects without needing to remove the shape from the game state
    }
    render(ctx){
        if (!this.visible) return; // skip rendering if shape is not visible
        ctx.fillStyle = this.color;
        if (this.shape === 'circle'){
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.properties.radius || 10, 0, 2 * Math.PI);
            ctx.fill();
        } else if (this.shape === 'rectangle'){
            ctx.fillRect(this.x, this.y, this.properties.width || 20, this.properties.height || 10);
        } else if (this.shape === 'line'){
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.properties.x2 || this.x + 20, this.properties.y2 || this.y + 20);
            ctx.stroke();
        }else if (this.shape === 'text'){
            ctx.font = this.properties.font || '16px Arial';
            ctx.fillText(this.properties.text || '', this.x, this.y); 
        } else {
            // default to a small square if shape type is unrecognized
            ctx.fillRect(this.x, this.y, 10, 10);
        }
    }
}
// Card class is a card in that can be used by a player. It stores what card it represents, which team it belongs to, its position (deck, next, 1-4), and its x and y coordinates for rendering on the canvas. It has methods for rendering itself on the canvas, handling hover effects, and handling clicks.
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
        this.shape = new Shape(this.x, this.y, 'rectangle', {width: 70, height: 100}, 'gray'); // default shape for rendering; actual position and size will be set in renderCards
        this.textShape = new Shape(this.x + 5, this.y + 50, 'text', {text: this.type, font: '12px Arial'}, 'white'); // shape for rendering text; position will be set in renderCards
        this.costShape = new Shape(this.x + 5, this.y + 70, 'text', {text: `Cost: ${this.cost}`, font: '12px Arial'}, 'white'); // shape for rendering cost; position will be set in renderCards
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
        this.shape.x = this.x;
        this.shape.y = y;
        this.shape.properties.width = w;
        this.shape.properties.height = h;
        this.textShape.x = this.x + 5;
        this.textShape.y = y + h / 2 + 5;
        this.textShape.properties.text = this.type;
        this.textShape.properties.font = `${12 * this.scale}px Arial`;
        this.shape.render(ctx);
        this.textShape.render(ctx);
        if (typeof this.pos === 'number') {
            this.costShape.visible = true;
            this.costShape.properties.text = `Cost: ${this.cost}`;
            this.costShape.x = this.x + 5;
            this.costShape.y = y + h / 2 + 20;
            this.costShape.render(ctx);
        } else {
            this.costShape.visible = false;
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
                for (let i = 0; i<cards[this.type].quantity; i++){
                    gameArea.activeUnits.push(new Unit(this.stats,`${this.team}_${this.type}_${gameArea.activeUnits.length+1}`,pos.x + i * 15,pos.y));
                }
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
// Unit class is a unit on the play field. It has stats, an id for debugging purposes, a position, a size, whether it's alive, and a type.
class Unit{
    /**
     * Creates a unit instance with the given stats, id, and position. The id should be in the format 'team_type_number' (e.g. 'blue_knight_1'). The position is an array [x, y] internally, representing the unit's location on the canvas. The unit will be drawn as a colored square based on its type.
     * @param {object} stats // the stats of the unit, should correspond to the unitStats object imported from cards.js
     * @param {string} id // the id of the unit, should be in the format 'team_type_number' (e.g. 'blue_knight_1')
     * @param {number} x // the x coordinate of the unit's position on the canvas
     * @param {number} y // the y coordinate of the unit's position on the canvas
     */
    constructor(stats,id,x,y){
        this.id = id
        this.type = id.split('_')[1]
        this.team = id.split('_')[0]
        this.pos = [x,y]
        this.stats = stats
        this.ai = {
            targets: []
        }
        this.active = true
        this.radius = cards[this.type].size ? cards[this.type].size : 15; // default radius if size is undefined
        this.shape = new Shape(x,y,'circle',{radius: this.radius}, this.checkColor(this.type));
        //print(`Spawned unit ${this.id} of type ${this.type} at position (${this.pos[0]}, ${this.pos[1]}) with stats: ${JSON.stringify(this.stats)}`);
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
        height: 500,
        color: 'green',
        shape: new Shape(20,20,'rectangle',{width:400,height:500},'green'),
        top: {
            x: 20,
            y: 20,
            width: 400,
            height: 220
        },
        bottom: {
            x: 20,
            y: 300,
            width: 400,
            height: 220
        },
        river: {
            x: 20,
            y: 240,
            width: 400,
            height: 60,
            color: 'lightblue',
            shape: new Shape(20,240,'rectangle',{width:400,height:60},'lightblue')
        },
        bridges: {
            x1: 80,
            x2: 300,
            y: 230,
            width: 40,
            height: 80,
            color: 'saddlebrown',
            leftBridge: new Shape(80,230,'rectangle',{width:40,height:80},'saddlebrown'),
            rightBridge: new Shape(300,230,'rectangle',{width:40,height:80},'saddlebrown')
        }
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
    elixir: 0,
    crowns: 0,
    castles: [true,true,true], // left princess, king, right princess; true means standing, false means destroyed
    castleUnits: []
}
const bluePlayer = {
    elixir: 0,
    crowns: 0,
    castles: [true,true,true], // left princess, king, right princess; true means standing, false means destroyed
    castleUnits: []
}
function startGame(){
    gameArea.start();
    blueDeck = [new Card(cards.knight,'blue'),new Card(cards.minipekka,'blue'),new Card(cards.skeleton,'blue'),new Card(cards.flyingMachine,'blue'),new Card(cards.wizard,'blue'),new Card(cards.prince,'blue'),new Card(cards.archers,'blue'),new Card(cards.valkyrie,'blue')];
    redDeck = [new Card(cards.knight,'red'),new Card(cards.minipekka,'red'),new Card(cards.skeleton,'red'),new Card(cards.flyingMachine,'red'),new Card(cards.wizard,'red'),new Card(cards.prince,'red'),new Card(cards.archers,'red'),new Card(cards.valkyrie,'red')];

    blueDeck = rollDeck('blue');
    drawDeckOnCanvas('blue');

    redDeck = rollDeck('red');

    renderDecks();
    // Add castles here:
    
    requestAnimationFrame(gameLoop);
}
let currentUnits = []
function renderGame(){
    const ctx = gameArea.canvas.getContext('2d');
    ctx.clearRect(0, 0, gameArea.canvas.width, gameArea.canvas.height);
    drawDeckOnCanvas('blue');
}
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
    gameArea.playField.shape.render(ctx);
    // draw river
    gameArea.playField.river.shape.render(ctx);
    // draw bridges
    gameArea.playField.bridges.leftBridge.render(ctx);
    gameArea.playField.bridges.rightBridge.render(ctx);
    // Draw active units on top of the playfield
    gameArea.activeUnits.forEach(unit => {
        unit.shape.render(ctx);
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
function checkCardRequirements(card,pos,player){
    let canAfford = player.elixir >= card.cost
    let inPlayField = pos.x >= gameArea.playField.bottom.x && pos.x <= gameArea.playField.bottom.x + gameArea.playField.bottom.width &&
                      pos.y >= gameArea.playField.bottom.y && pos.y <= gameArea.playField.bottom.y + gameArea.playField.bottom.height
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
function gameLoop(timestamp) {
    let deltaTime = (timestamp - gameState.lastTime) / 1000; // convert to seconds
    gameState.lastTime = timestamp;
    if (deltaTime > 0.1) {deltaTime = 0.1;} // cap deltaTime to prevent big jumps
    updateLogic(deltaTime);
    renderGame();
    requestAnimationFrame(gameLoop);
}
function updateLogic(deltaTime) {
    if (bluePlayer.elixir < gameState.maxElixir) {
        bluePlayer.elixir += gameState.elixirRegenRate * deltaTime;
        if (bluePlayer.elixir > gameState.maxElixir) {
            bluePlayer.elixir = gameState.maxElixir;
        }
    }
    if (redPlayer.elixir < gameState.maxElixir) {
        redPlayer.elixir += gameState.elixirRegenRate * deltaTime;
        if (redPlayer.elixir > gameState.maxElixir) {
            redPlayer.elixir = gameState.maxElixir;
        }
    }
    gameArea.activeUnits.forEach(unit => {
        // Placeholder logic for unit movement - currently just moves units up the field
        if (unit.active) {
            let direction = unit.id.startsWith('blue') ? -1 : 1; // blue units move up, red units move down
            unit.pos[1] += direction * unit.stats.speed * deltaTime;
            unit.shape.x = unit.pos[0];
            unit.shape.y = unit.pos[1];
            chooseTargets(unit); // Update targets for the unit based on its new position
        }
    });
}

// AI logic for units
/**
 * Returns a list of targets for the given unit in order of where it is pathfinding to. It will have a tower or other unit at the end, and a the bridge ends before it if it is not a flying unit.
 * @param {object} unit 
 * @return {Array}
 */
function chooseTargets(unit){
    let targets = [];
    if (unitStats[unit.type].type.ground){
        // if it's a ground unit, add the bridge end as a target if it's not flying and not already past it
        if (unit.pos[1] > gameArea.playField.bridges.y && unit.id.startsWith('blue')){
            if (unit.pos[0] < gameArea.playField.width / 2){
                targets.push({type: 'bridgeLeftStart', x: gameArea.playField.bridges.x1 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y + gameArea.playField.bridges.height, passed: false});
                targets.push({type: 'bridgeLeftEnd', x: gameArea.playField.bridges.x1 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y, passed: false});
            } else {
                targets.push({type: 'bridgeRightStart', x: gameArea.playField.bridges.x2 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y + gameArea.playField.bridges.height, passed: false});
                targets.push({type: 'bridgeRightEnd', x: gameArea.playField.bridges.x2 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y, passed: false});
            }
        } else if (unit.pos[1] < gameArea.playField.bridges.y + gameArea.playField.bridges.height && unit.id.startsWith('red')){
            if (unit.pos[0] < gameArea.playField.width / 2){
                targets.push({type: 'bridgeLeftEnd', x: gameArea.playField.bridges.x1 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y, passed: false});
                targets.push({type: 'bridgeLeftStart', x: gameArea.playField.bridges.x1 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y + gameArea.playField.bridges.height, passed: false});
            } else {
                targets.push({type: 'bridgeRightEnd', x: gameArea.playField.bridges.x2 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y, passed: false});
                targets.push({type: 'bridgeRightStart', x: gameArea.playField.bridges.x2 + gameArea.playField.bridges.width/2, y: gameArea.playField.bridges.y + gameArea.playField.bridges.height, passed: false});
            }
        }
    }
    if (unit.id.startsWith('blue')){
        const currentX = unit.pos[0];
        if (currentX < gameArea.playField.x + gameArea.playField.width / 2){
            if (redPlayer.castles[0]){
                targets.push({type: 'redPrincessTowerLeft', x: gameArea.playField.x, y: gameArea.playField.y + gameArea.playField.height/2});
            }
        } else if (currentX > gameArea.playField.x + gameArea.playField.width / 2){
            if (redPlayer.castles[2]){
                targets.push({type: 'redPrincessTowerRight', x: gameArea.playField.x + gameArea.playField.width, y: gameArea.playField.y + gameArea.playField.height/2});
            }
        }
        if (redPlayer.castles[1]){
            targets.push({type: 'redKingTower', x: gameArea.playField.x + gameArea.playField.width/2, y: gameArea.playField.y + gameArea.playField.height/2});
        }
    } else {
        const currentX = unit.pos[0];
        if (currentX < gameArea.playField.x + gameArea.playField.width / 2){
            if (bluePlayer.castles[0]){
                targets.push({type: 'bluePrincessTowerLeft', x: gameArea.playField.x, y: gameArea.playField.y + gameArea.playField.height/2});
            }
        } else if (currentX > gameArea.playField.x + gameArea.playField.width / 2){
            if (bluePlayer.castles[2]){
                targets.push({type: 'bluePrincessTowerRight', x: gameArea.playField.x + gameArea.playField.width, y: gameArea.playField.y + gameArea.playField.height/2});
            }
        }
        if (bluePlayer.castles[1]){
            targets.push({type: 'blueKingTower', x: gameArea.playField.x + gameArea.playField.width/2, y: gameArea.playField.y + gameArea.playField.height/2});
        }
    }
    const closestUnit = getClosestUnit(unit);
    if (closestUnit){
        if (getDistance(unit.pos, closestUnit.pos) < getDistance(unit.pos, [targets[0].x, targets[0].y])){
            targets.unshift({type: 'unit', x: closestUnit.pos[0], y: closestUnit.pos[1]});
        }
    }
    return targets
}
/**
 * @param {object} unit 
 * @returns {Array} the closest enemy unit to the given unit, or null if there are no enemy units
 */
function getClosestUnit(unit){
    if (unit.team === 'blue'){
        const enemyUnits = gameArea.activeUnits.filter(u => u.team === 'red' && u.active);
        if (enemyUnits.length === 0) return null;
        let closest = enemyUnits[0];
        let closestDist = Math.hypot(unit.pos[0] - closest.pos[0], unit.pos[1] - closest.pos[1]);
        for (let i = 1; i < enemyUnits.length; i++){
            const dist = getDistance(unit.pos, enemyUnits[i].pos);
            if (dist < closestDist){
                closest = enemyUnits[i];
                closestDist = dist;
            }
        }
        return closest;
    } else {
        const enemyUnits = gameArea.activeUnits.filter(u => u.team === 'blue' && u.active);
        if (enemyUnits.length === 0) return null;
        let closest = enemyUnits[0];
        let closestDist = Math.hypot(unit.pos[0] - closest.pos[0], unit.pos[1] - closest.pos[1]);
        for (let i = 1; i < enemyUnits.length; i++){
            const dist = getDistance(unit.pos, enemyUnits[i].pos);
            if (dist < closestDist){
                closest = enemyUnits[i];
                closestDist = dist;
            }
        }
        return closest;
    }
}
/**
 * @param {Array} pos1 
 * @param {Array} pos2 
 * @returns {number} the distance between the two positions, where each position is an array [x, y]
 */
function getDistance(pos1, pos2){
    return Math.hypot(pos1[0] - pos2[0], pos1[1] - pos2[1]);
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

print('all code loaded');