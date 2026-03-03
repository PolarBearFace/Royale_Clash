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
    constructor(type,id,x,y){
        this.type = type
        this.id = id
        this.pos = [x,y]
        this.stats = unitStats.type
    }
}