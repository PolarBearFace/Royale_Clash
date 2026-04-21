// Note that these lines are only for refrence so you can see how cards should be formatted, the actual code is never refrenced
const cardType = {
    name: {
        cost: Number,
        // How many of the unit should spawn when the card is placed
        quantity: Number,
        // If size is undefined, it defaults to 15
        size: Number | undefined
    }
}
const unitStatsType = {
    name: {
        // Max HP is the amount of health that the unit has
        maxHP: Number,
        // Damage is the amount of damage that the unit does per attack
        damage: Number,
        // Speed is the distance that the unit moves per second (in pixels)
		speed: Number,
        // How long it should wait between attacks (in seconds)
		attackSpeed: Number,
        // Range is the distance that the unit can attack from (in pixels). Melee units have a range.
		range: Number,
        // AOE is optional, currently the only piece is the radius of the AOE attack (in pixels), but I may add a damage mult based on distance from origin.
        aoe: Array[Number],
        // Type is an object that contains it's melee and ground types
        type: {
            melee: Boolean,
            ground: Boolean
        }
    }
}

const projectileStatsType = {
    name: {
        // Damage is the amount of damage that the projectile does on hit
        damage: Number,
        // Speed is the distance that the projectile moves per second (in pixels)
        speed: Number,
        // Range is the distance that the projectile can travel before disappearing (in pixels)
        range: Number,
        // AOE is the same data as for units, and a unit without an aoe should not have a projectileStats entry at all 
        aoe: Array[Number],
        // Should be undefined in cards.js, but it is set to a Unit when the projectile is spawned, so it is included here for reference
        source: Unit | undefined
    }
}