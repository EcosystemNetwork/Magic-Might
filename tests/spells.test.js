import { jest } from '@jest/globals';
import {
  SPELLS, castDamageSpell, castBuffSpell, castHealSpell, getAvailableSpells
} from '../js/spells.js';
import { createUnitStack } from '../js/units.js';

describe('Spells', () => {
  describe('SPELLS', () => {
    test('should have spells defined', () => {
      expect(Object.keys(SPELLS).length).toBeGreaterThan(0);
    });

    test('each spell should have required properties', () => {
      for (const spell of Object.values(SPELLS)) {
        expect(spell.id).toBeDefined();
        expect(spell.name).toBeDefined();
        expect(spell.manaCost).toBeGreaterThan(0);
        expect(spell.type).toBeDefined();
      }
    });
  });

  describe('castDamageSpell', () => {
    test('should deal damage based on spell power', () => {
      const hero = { spellPower: 5, mana: 50 };
      const spell = SPELLS.MAGIC_ARROW;
      const target = createUnitStack('PEASANT', 10);

      const result = castDamageSpell(spell, hero, target);
      expect(result).not.toBeNull();
      expect(result.damage).toBe(50); // 10 base × 5 spell power
    });

    test('should deduct mana', () => {
      const hero = { spellPower: 3, mana: 20 };
      const spell = SPELLS.MAGIC_ARROW;
      castDamageSpell(spell, hero, createUnitStack('PEASANT', 5));
      expect(hero.mana).toBe(15);
    });

    test('should fail with insufficient mana', () => {
      const hero = { spellPower: 1, mana: 1 };
      const result = castDamageSpell(SPELLS.MAGIC_ARROW, hero, createUnitStack('PEASANT', 5));
      expect(result).toBeNull();
    });
  });

  describe('castBuffSpell', () => {
    test('should apply buff to target', () => {
      const hero = { spellPower: 3, mana: 20 };
      const target = createUnitStack('SWORDSMAN', 5);
      const origSpeed = target.speed;

      const result = castBuffSpell(SPELLS.HASTE, hero, target);
      expect(result).not.toBeNull();
      expect(target.speed).toBe(origSpeed + 3);
    });
  });

  describe('castHealSpell', () => {
    test('should heal target stack', () => {
      const hero = { spellPower: 3, mana: 20 };
      const target = createUnitStack('SWORDSMAN', 5);
      target.currentHp = 10;

      const result = castHealSpell(SPELLS.CURE, hero, target);
      expect(result).not.toBeNull();
      expect(target.currentHp).toBeGreaterThan(10);
    });

    test('should not exceed max HP', () => {
      const hero = { spellPower: 10, mana: 50 };
      const target = createUnitStack('PEASANT', 5);
      target.currentHp = 2;

      castHealSpell(SPELLS.CURE, hero, target);
      expect(target.currentHp).toBeLessThanOrEqual(target.hp);
    });
  });

  describe('getAvailableSpells', () => {
    test('should return spells hero can cast', () => {
      const hero = {
        spellBook: ['MAGIC_ARROW', 'LIGHTNING_BOLT'],
        mana: 10,
      };
      const available = getAvailableSpells(hero);
      expect(available.length).toBe(2); // Both should be affordable
    });

    test('should filter by mana cost', () => {
      const hero = {
        spellBook: ['MAGIC_ARROW', 'LIGHTNING_BOLT'],
        mana: 7,
      };
      const available = getAvailableSpells(hero);
      expect(available.length).toBe(1); // Only Magic Arrow (5 mana)
    });

    test('should return empty for no spells', () => {
      const hero = { spellBook: [], mana: 100 };
      expect(getAvailableSpells(hero).length).toBe(0);
    });
  });
});
