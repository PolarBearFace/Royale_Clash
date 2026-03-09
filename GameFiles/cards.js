export const cards = {
    knight: {
        cost: 3,
        quantity: 1,
        size: undefined
    },
    minipekka: {
        cost: 5,
        quantity: 1,
        size: undefined
    },
    skeleton: {
        cost: 1,
        quantity: 3,
        size: 10
    },
    flyingMachine: {
        cost: 4,
        quantity: 1,
        size: undefined
    },
    wizard: {
        cost: 4,
        quantity: 1,
        size: undefined
    },
    prince: {
        cost: 5,
        quantity: 1,
        size: 18
    },
    archers: {
        cost: 2,
        quantity: 2,
        size: 13
    },
    valkyrie: {
        cost: 3,
        quantity: 1,
        size: undefined
    }
}

export const unitStats = {
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