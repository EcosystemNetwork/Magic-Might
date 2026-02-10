// ============================================================
// Units / Creatures Definition
// Heroes of Might and Magic style unit roster
// ============================================================

export const FACTIONS = {
  CASTLE: 'Castle',
  INFERNO: 'Inferno',
  NECROPOLIS: 'Necropolis',
  NEUTRAL: 'Neutral',
};

// Unit tier determines power level (1-7)
export const UNIT_TEMPLATES = {
  // Castle faction
  PEASANT: {
    id: 'PEASANT', name: 'Peasant', faction: FACTIONS.CASTLE, tier: 1,
    attack: 1, defense: 1, minDamage: 1, maxDamage: 1, hp: 3, speed: 3,
    cost: { gold: 10 }, symbol: 'P', color: '#aaaaaa',
    growth: 14, description: 'Weak but plentiful farmers.',
  },
  ARCHER: {
    id: 'ARCHER', name: 'Archer', faction: FACTIONS.CASTLE, tier: 2,
    attack: 6, defense: 3, minDamage: 2, maxDamage: 3, hp: 10, speed: 4,
    cost: { gold: 100 }, symbol: 'A', color: '#44aa44', ranged: true, shots: 12,
    growth: 9, description: 'Ranged unit that can shoot from afar.',
  },
  GRIFFIN: {
    id: 'GRIFFIN', name: 'Griffin', faction: FACTIONS.CASTLE, tier: 3,
    attack: 8, defense: 8, minDamage: 3, maxDamage: 6, hp: 25, speed: 6,
    cost: { gold: 200 }, symbol: 'G', color: '#ddaa33', flying: true,
    growth: 7, description: 'A flying creature with unlimited retaliations.',
    unlimitedRetaliation: true,
  },
  SWORDSMAN: {
    id: 'SWORDSMAN', name: 'Swordsman', faction: FACTIONS.CASTLE, tier: 4,
    attack: 10, defense: 12, minDamage: 6, maxDamage: 9, hp: 35, speed: 5,
    cost: { gold: 300 }, symbol: 'S', color: '#4488cc',
    growth: 4, description: 'Sturdy front-line fighters.',
  },
  CAVALIER: {
    id: 'CAVALIER', name: 'Cavalier', faction: FACTIONS.CASTLE, tier: 5,
    attack: 15, defense: 15, minDamage: 15, maxDamage: 25, hp: 100, speed: 7,
    cost: { gold: 1000 }, symbol: 'C', color: '#cc8844',
    growth: 2, description: 'Powerful mounted knights with a jousting bonus.',
    jousting: true,
  },
  ANGEL: {
    id: 'ANGEL', name: 'Angel', faction: FACTIONS.CASTLE, tier: 7,
    attack: 20, defense: 20, minDamage: 50, maxDamage: 50, hp: 200, speed: 12,
    cost: { gold: 3000, gems: 1 }, symbol: '☩', color: '#ffdd44', flying: true,
    growth: 1, description: 'Divine warrior of incredible power.',
    moraleBuff: true,
  },

  // Inferno faction
  IMP: {
    id: 'IMP', name: 'Imp', faction: FACTIONS.INFERNO, tier: 1,
    attack: 2, defense: 0, minDamage: 1, maxDamage: 2, hp: 4, speed: 5,
    cost: { gold: 50 }, symbol: 'i', color: '#ff4444',
    growth: 15, description: 'Small but fast demons.',
    flying: true,
  },
  DEMON: {
    id: 'DEMON', name: 'Demon', faction: FACTIONS.INFERNO, tier: 4,
    attack: 10, defense: 10, minDamage: 7, maxDamage: 9, hp: 35, speed: 5,
    cost: { gold: 250 }, symbol: 'D', color: '#cc2222',
    growth: 4, description: 'Standard demon soldiers.',
  },
  PIT_FIEND: {
    id: 'PIT_FIEND', name: 'Pit Fiend', faction: FACTIONS.INFERNO, tier: 5,
    attack: 13, defense: 13, minDamage: 13, maxDamage: 17, hp: 45, speed: 6,
    cost: { gold: 500 }, symbol: 'F', color: '#aa0000',
    growth: 3, description: 'Fearsome pit fiends from the depths.',
  },
  DEVIL: {
    id: 'DEVIL', name: 'Devil', faction: FACTIONS.INFERNO, tier: 7,
    attack: 19, defense: 21, minDamage: 30, maxDamage: 40, hp: 160, speed: 11,
    cost: { gold: 2700, gems: 1 }, symbol: '⛧', color: '#ff0000', flying: true,
    growth: 1, description: 'The most powerful demon, terrifying to behold.',
    fearEffect: true,
  },

  // Necropolis faction
  SKELETON: {
    id: 'SKELETON', name: 'Skeleton', faction: FACTIONS.NECROPOLIS, tier: 1,
    attack: 5, defense: 4, minDamage: 1, maxDamage: 3, hp: 6, speed: 4,
    cost: { gold: 60 }, symbol: '☠', color: '#bbbbaa',
    growth: 12, description: 'Reanimated warriors.',
  },
  ZOMBIE: {
    id: 'ZOMBIE', name: 'Zombie', faction: FACTIONS.NECROPOLIS, tier: 2,
    attack: 5, defense: 5, minDamage: 2, maxDamage: 3, hp: 20, speed: 3,
    cost: { gold: 100 }, symbol: 'Z', color: '#669966',
    growth: 8, description: 'Slow but tough undead.',
  },
  VAMPIRE: {
    id: 'VAMPIRE', name: 'Vampire', faction: FACTIONS.NECROPOLIS, tier: 4,
    attack: 10, defense: 9, minDamage: 5, maxDamage: 8, hp: 30, speed: 6,
    cost: { gold: 360 }, symbol: 'V', color: '#880044', flying: true,
    growth: 4, description: 'Life-draining undead lords.',
    lifeSteal: true, noRetaliation: true,
  },
  BONE_DRAGON: {
    id: 'BONE_DRAGON', name: 'Bone Dragon', faction: FACTIONS.NECROPOLIS, tier: 7,
    attack: 17, defense: 15, minDamage: 25, maxDamage: 50, hp: 150, speed: 9,
    cost: { gold: 1800 }, symbol: '🐉', color: '#aaaa88', flying: true,
    growth: 1, description: 'Undead dragon that lowers enemy morale.',
    moralePenalty: true,
  },

  // Neutral creatures (found on adventure map)
  WOLF: {
    id: 'WOLF', name: 'Wolf', faction: FACTIONS.NEUTRAL, tier: 1,
    attack: 4, defense: 2, minDamage: 1, maxDamage: 3, hp: 8, speed: 6,
    cost: { gold: 50 }, symbol: 'w', color: '#886644',
    growth: 0, description: 'Wild wolves.',
  },
  ORC: {
    id: 'ORC', name: 'Orc', faction: FACTIONS.NEUTRAL, tier: 2,
    attack: 6, defense: 4, minDamage: 2, maxDamage: 5, hp: 15, speed: 4,
    cost: { gold: 120 }, symbol: 'O', color: '#448844',
    growth: 0, description: 'Brutish orc warriors.',
  },
  OGRE: {
    id: 'OGRE', name: 'Ogre', faction: FACTIONS.NEUTRAL, tier: 4,
    attack: 13, defense: 7, minDamage: 8, maxDamage: 16, hp: 40, speed: 3,
    cost: { gold: 300 }, symbol: 'Ø', color: '#886622',
    growth: 0, description: 'Massive ogre brutes.',
  },
  DRAGON: {
    id: 'DRAGON', name: 'Red Dragon', faction: FACTIONS.NEUTRAL, tier: 7,
    attack: 19, defense: 19, minDamage: 40, maxDamage: 50, hp: 180, speed: 11,
    cost: { gold: 2500 }, symbol: '🐲', color: '#ff4400', flying: true,
    growth: 0, description: 'An ancient and terrible red dragon.',
    fireBreath: true,
  },
};

/**
 * Creates a unit stack (group of identical units in an army slot).
 */
export function createUnitStack(templateId, count) {
  const template = UNIT_TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown unit template: ${templateId}`);
  return {
    templateId,
    ...template,
    count,
    currentHp: template.hp, // HP of the top creature
    totalHp: template.hp * count,
    hasRetaliated: false,
    hasActed: false,
    shotsLeft: template.shots || 0,
  };
}

/**
 * Calculate total HP of a stack.
 */
export function getStackTotalHp(stack) {
  if (stack.count <= 0) return 0;
  return (stack.count - 1) * stack.hp + stack.currentHp;
}

/**
 * Apply damage to a unit stack. Returns the updated stack.
 */
export function applyDamageToStack(stack, damage) {
  const updated = { ...stack };
  let remaining = damage;

  // First reduce current HP of top creature
  if (remaining >= updated.currentHp) {
    remaining -= updated.currentHp;
    updated.count--;
    updated.currentHp = updated.hp;
  } else {
    updated.currentHp -= remaining;
    remaining = 0;
  }

  // Then kill full creatures
  if (remaining > 0 && updated.count > 0) {
    const fullKills = Math.floor(remaining / updated.hp);
    const leftover = remaining % updated.hp;
    updated.count -= fullKills;

    if (updated.count > 0 && leftover > 0) {
      updated.currentHp = updated.hp - leftover;
    }
  }

  if (updated.count < 0) updated.count = 0;
  updated.totalHp = getStackTotalHp(updated);
  return updated;
}

/**
 * Calculate damage dealt by attacker stack to defender stack.
 */
export function calculateDamage(attacker, defender, isRanged = false) {
  const baseDamage = attacker.minDamage + Math.floor(Math.random() * (attacker.maxDamage - attacker.minDamage + 1));
  let totalDamage = baseDamage * attacker.count;

  // Attack vs defense modifier
  const diff = attacker.attack - defender.defense;
  if (diff > 0) {
    totalDamage = Math.floor(totalDamage * (1 + 0.05 * Math.min(diff, 20)));
  } else if (diff < 0) {
    totalDamage = Math.floor(totalDamage * (1 - 0.025 * Math.min(-diff, 28)));
  }

  // Ranged penalty at close range doesn't apply; melee penalty for ranged when forced melee
  if (attacker.ranged && !isRanged) {
    totalDamage = Math.floor(totalDamage * 0.5);
  }

  return Math.max(1, totalDamage);
}
