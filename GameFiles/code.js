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
        this.cost = cards.type.cost;
    }
}

class Unit{
    constructor(stats,id,x,y){
        this.id = id
        this.pos = [x,y]
        this.stats = stats
        this.active = true
        ctx = gameArea.context;
        alert('going to color')
        ctx.fillStyle = this.checkColor();
        alert('color gotten')
        ctx.fillRect(this.pos[0],this.pos[1],40,60)
    }
    checkColor(){
        alert('at color')
        let color = 'black';
        if (this.type == 'knight'){
            color = 'gray';
        }
        alert('returning color')
        return color;
    }
}

const gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 440;
        this.canvas.height = 680;
        this.context = this.canvas.getContext("2d");
        alert('context gotten')
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    }
}
function startGame(){
    gameArea.start();
    currentUnits.append(new Unit(unitStats.knight,'blue_knight_1',50,50))
    alert("done!");
}
let currentUnits = []


startGame()