// ============================================================
// Hero System
// ============================================================

import { createUnitStack } from './units.js';

export const HERO_CLASSES = {
  KNIGHT: { name: 'Knight', primarySkill: 'attack', faction: 'Castle' },
  WARLOCK: { name: 'Warlock', primarySkill: 'spellPower', faction: 'Inferno' },
  NECROMANCER: { name: 'Necromancer', primarySkill: 'knowledge', faction: 'Necropolis' },
};

const HERO_NAMES = {
  KNIGHT: ['Sir Galahad', 'Lord Haart', 'Lady Catherine', 'Sir Christian'],
  WARLOCK: ['Rashka', 'Xarfax', 'Zydar', 'Alamar'],
  NECROMANCER: ['Sandro', 'Vidomina', 'Thant', 'Isra'],
};

let heroIdCounter = 0;

/**
 * Create a new hero.
 */
export function createHero(heroClass, playerId, x, y) {
  const cls = HERO_CLASSES[heroClass];
  const names = HERO_NAMES[heroClass] || HERO_NAMES.KNIGHT;
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    id: ++heroIdCounter,
    name,
    heroClass: heroClass,
    playerId,
    x,
    y,
    level: 1,
    experience: 0,

    // Primary skills
    attack: heroClass === 'KNIGHT' ? 2 : 1,
    defense: heroClass === 'KNIGHT' ? 2 : 1,
    spellPower: heroClass === 'WARLOCK' ? 3 : 1,
    knowledge: heroClass === 'NECROMANCER' ? 3 : 2,

    // Movement
    movementPoints: 20,
    maxMovementPoints: 20,

    // Army slots (up to 7)
    army: [],

    // Spells
    spellBook: [],
    mana: heroClass === 'WARLOCK' ? 30 : 20,
    maxMana: heroClass === 'WARLOCK' ? 30 : 20,

    // Visual
    symbol: heroClass === 'KNIGHT' ? '⚔' : heroClass === 'WARLOCK' ? '🔥' : '💀',
    color: heroClass === 'KNIGHT' ? '#4488ff' : heroClass === 'WARLOCK' ? '#ff4444' : '#884488',
  };
}

/**
 * Add units to a hero's army.
 */
export function addUnitsToArmy(hero, templateId, count) {
  // Check if hero already has this unit type
  const existing = hero.army.find(s => s.templateId === templateId);
  if (existing) {
    existing.count += count;
    existing.totalHp = existing.hp * existing.count;
    return hero;
  }

  // Add new stack if there's room (max 7 slots)
  if (hero.army.length < 7) {
    hero.army.push(createUnitStack(templateId, count));
  }
  return hero;
}

/**
 * Reset hero's movement points at start of turn.
 */
export function resetHeroForNewTurn(hero) {
  hero.movementPoints = hero.maxMovementPoints;
  hero.army.forEach(stack => {
    stack.hasActed = false;
    stack.hasRetaliated = false;
  });
  return hero;
}

/**
 * Calculate experience needed for next level.
 */
export function experienceForLevel(level) {
  return level * 1000;
}

/**
 * Check and apply level up if enough experience.
 */
export function checkLevelUp(hero) {
  const needed = experienceForLevel(hero.level);
  if (hero.experience >= needed) {
    hero.experience -= needed;
    hero.level++;

    // Improve primary stats based on class
    const cls = HERO_CLASSES[hero.heroClass];
    if (cls.primarySkill === 'attack') {
      hero.attack += 1;
      hero.defense += Math.random() > 0.5 ? 1 : 0;
    } else if (cls.primarySkill === 'spellPower') {
      hero.spellPower += 1;
      hero.knowledge += Math.random() > 0.5 ? 1 : 0;
    } else {
      hero.knowledge += 1;
      hero.spellPower += Math.random() > 0.5 ? 1 : 0;
    }

    hero.maxMana = hero.knowledge * 10;
    hero.mana = hero.maxMana;
    return true;
  }
  return false;
}

/**
 * Reset the hero ID counter (for testing).
 */
export function resetHeroIdCounter() {
  heroIdCounter = 0;
}
