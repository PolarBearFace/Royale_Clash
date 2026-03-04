// Browser-safe randomInt replacement
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

const cards = {
    knight: {
        cost: 3
    },
    minipekka: {
        cost: 5
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
    }
}
class Card{
    constructor(type,team){
        this.type = type;
        this.team = team;
        //deck, next, 1, 2, 3, 4
        this.pos = 'deck';
        this.cost = type.cost;
    }
}

class Unit{
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
    checkColor(type){
        let color = 'black';
        if (type == 'knight'){
            color = 'gray';
        }
        return color;
    }
}
let blueDeck = [new Card(cards.knight,'blue'),new Card(cards.minipekka,'blue')]
let redDeck = [new Card(cards.knight,'red'),new Card(cards.minipekka,'red')]
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
}
let currentUnits = []
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
startGame()
console.log('game started')
function print(string){
    console.log(string);
}