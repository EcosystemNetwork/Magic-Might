// ============================================================
// Spell System
// ============================================================

export const SPELLS = {
  // Damage spells
  MAGIC_ARROW: {
    id: 'MAGIC_ARROW', name: 'Magic Arrow', manaCost: 5, level: 1,
    type: 'damage', baseDamage: 10,
    description: 'Deals 10 × spell power damage to target.',
  },
  LIGHTNING_BOLT: {
    id: 'LIGHTNING_BOLT', name: 'Lightning Bolt', manaCost: 10, level: 2,
    type: 'damage', baseDamage: 25,
    description: 'Deals 25 × spell power damage to target.',
  },
  FIREBALL: {
    id: 'FIREBALL', name: 'Fireball', manaCost: 15, level: 3,
    type: 'damage', baseDamage: 15, areaEffect: true,
    description: 'Deals 15 × spell power damage to all units in area.',
  },
  CHAIN_LIGHTNING: {
    id: 'CHAIN_LIGHTNING', name: 'Chain Lightning', manaCost: 24, level: 4,
    type: 'damage', baseDamage: 25, chainTargets: 4,
    description: 'Hits target then chains to 3 more units with decreasing damage.',
  },

  // Buff spells
  HASTE: {
    id: 'HASTE', name: 'Haste', manaCost: 6, level: 1,
    type: 'buff', stat: 'speed', bonus: 3, duration: 3,
    description: 'Increases target speed by 3 for combat.',
  },
  SHIELD: {
    id: 'SHIELD', name: 'Shield', manaCost: 5, level: 1,
    type: 'buff', stat: 'defense', bonus: 3, duration: 3,
    description: 'Increases target defense by 3 for combat.',
  },
  BLESS: {
    id: 'BLESS', name: 'Bless', manaCost: 5, level: 1,
    type: 'buff', stat: 'maxDamage', bonus: 0, duration: 3,
    description: 'Target always does maximum damage.',
    effect: 'max_damage',
  },
  BLOODLUST: {
    id: 'BLOODLUST', name: 'Bloodlust', manaCost: 5, level: 1,
    type: 'buff', stat: 'attack', bonus: 3, duration: 3,
    description: 'Increases target attack by 3 for combat.',
  },

  // Debuff spells
  SLOW: {
    id: 'SLOW', name: 'Slow', manaCost: 6, level: 1,
    type: 'debuff', stat: 'speed', penalty: 3, duration: 3,
    description: 'Decreases target speed by 3.',
  },
  CURSE: {
    id: 'CURSE', name: 'Curse', manaCost: 6, level: 1,
    type: 'debuff', stat: 'minDamage', penalty: 0, duration: 3,
    description: 'Target always does minimum damage.',
    effect: 'min_damage',
  },
  BLIND: {
    id: 'BLIND', name: 'Blind', manaCost: 10, level: 2,
    type: 'debuff', stat: 'speed', penalty: 999, duration: 1,
    description: 'Target cannot act for 1 round.',
    effect: 'blind',
  },

  // Healing spells
  CURE: {
    id: 'CURE', name: 'Cure', manaCost: 6, level: 1,
    type: 'heal', baseHeal: 10,
    description: 'Heals 10 × spell power HP to target friendly stack.',
  },
  RESURRECT: {
    id: 'RESURRECT', name: 'Resurrect', manaCost: 20, level: 4,
    type: 'resurrect', baseHeal: 40,
    description: 'Resurrects dead units in target friendly stack.',
  },

  // Summon spells
  SUMMON_ELEMENTAL: {
    id: 'SUMMON_ELEMENTAL', name: 'Summon Elemental', manaCost: 25, level: 5,
    type: 'summon', unitId: 'OGRE', baseCount: 2,
    description: 'Summons powerful elementals to fight.',
  },

  // Adventure map spells
  VIEW_MAP: {
    id: 'VIEW_MAP', name: 'View Map', manaCost: 2, level: 1,
    type: 'adventure', effect: 'reveal_map',
    description: 'Reveals nearby area of the adventure map.',
    combatOnly: false,
  },
  TOWN_PORTAL: {
    id: 'TOWN_PORTAL', name: 'Town Portal', manaCost: 15, level: 3,
    type: 'adventure', effect: 'teleport_town',
    description: 'Instantly teleport to a friendly town.',
    combatOnly: false,
  },
};

/**
 * Cast a damage spell in combat.
 */
export function castDamageSpell(spell, casterHero, targetStack) {
  if (!casterHero || casterHero.mana < spell.manaCost) return null;

  const damage = spell.baseDamage * casterHero.spellPower;
  casterHero.mana -= spell.manaCost;

  return { damage, spellId: spell.id };
}

/**
 * Cast a buff spell in combat.
 */
export function castBuffSpell(spell, casterHero, targetStack) {
  if (!casterHero || casterHero.mana < spell.manaCost) return null;

  casterHero.mana -= spell.manaCost;

  if (!targetStack.buffs) targetStack.buffs = [];
  targetStack.buffs.push({
    spellId: spell.id,
    stat: spell.stat,
    bonus: spell.bonus,
    duration: spell.duration,
    effect: spell.effect || null,
  });

  // Apply immediate stat change
  if (spell.bonus > 0) {
    targetStack[spell.stat] = (targetStack[spell.stat] || 0) + spell.bonus;
  }

  return { buffApplied: spell.id, stat: spell.stat, bonus: spell.bonus };
}

/**
 * Cast a healing spell in combat.
 */
export function castHealSpell(spell, casterHero, targetStack) {
  if (!casterHero || casterHero.mana < spell.manaCost) return null;

  const healAmount = spell.baseHeal * casterHero.spellPower;
  casterHero.mana -= spell.manaCost;

  // Heal the current top creature first
  targetStack.currentHp = Math.min(targetStack.hp, targetStack.currentHp + healAmount);

  return { healed: healAmount, spellId: spell.id };
}

/**
 * Get available spells for a hero.
 */
export function getAvailableSpells(hero, combatOnly = true) {
  if (!hero || !hero.spellBook) return [];

  return hero.spellBook
    .map(spellId => SPELLS[spellId])
    .filter(spell => spell && (combatOnly ? spell.combatOnly !== false : true))
    .filter(spell => hero.mana >= spell.manaCost);
}
