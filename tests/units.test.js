import { jest } from '@jest/globals';
import {
  UNIT_TEMPLATES, createUnitStack, applyDamageToStack,
  calculateDamage, getStackTotalHp, FACTIONS
} from '../js/units.js';

describe('Units', () => {
  describe('UNIT_TEMPLATES', () => {
    test('should have units defined for each faction', () => {
      const castleUnits = Object.values(UNIT_TEMPLATES).filter(u => u.faction === FACTIONS.CASTLE);
      const infernoUnits = Object.values(UNIT_TEMPLATES).filter(u => u.faction === FACTIONS.INFERNO);
      const necropolisUnits = Object.values(UNIT_TEMPLATES).filter(u => u.faction === FACTIONS.NECROPOLIS);
      const neutralUnits = Object.values(UNIT_TEMPLATES).filter(u => u.faction === FACTIONS.NEUTRAL);

      expect(castleUnits.length).toBeGreaterThan(0);
      expect(infernoUnits.length).toBeGreaterThan(0);
      expect(necropolisUnits.length).toBeGreaterThan(0);
      expect(neutralUnits.length).toBeGreaterThan(0);
    });

    test('each unit should have required properties', () => {
      for (const unit of Object.values(UNIT_TEMPLATES)) {
        expect(unit.id).toBeDefined();
        expect(unit.name).toBeDefined();
        expect(unit.attack).toBeGreaterThanOrEqual(0);
        expect(unit.defense).toBeGreaterThanOrEqual(0);
        expect(unit.minDamage).toBeGreaterThan(0);
        expect(unit.maxDamage).toBeGreaterThanOrEqual(unit.minDamage);
        expect(unit.hp).toBeGreaterThan(0);
        expect(unit.speed).toBeGreaterThan(0);
        expect(unit.cost).toBeDefined();
        expect(unit.tier).toBeGreaterThanOrEqual(1);
        expect(unit.tier).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('createUnitStack', () => {
    test('should create a stack with correct count', () => {
      const stack = createUnitStack('PEASANT', 10);
      expect(stack.count).toBe(10);
      expect(stack.templateId).toBe('PEASANT');
      expect(stack.name).toBe('Peasant');
      expect(stack.currentHp).toBe(3); // Peasant HP
    });

    test('should throw for unknown template', () => {
      expect(() => createUnitStack('NONEXISTENT', 1)).toThrow();
    });

    test('should set ranged properties when applicable', () => {
      const archer = createUnitStack('ARCHER', 5);
      expect(archer.ranged).toBe(true);
      expect(archer.shotsLeft).toBe(12);

      const peasant = createUnitStack('PEASANT', 5);
      expect(peasant.ranged).toBeUndefined();
      expect(peasant.shotsLeft).toBe(0);
    });
  });

  describe('getStackTotalHp', () => {
    test('should calculate total HP correctly', () => {
      const stack = createUnitStack('PEASANT', 5); // 3 HP each
      expect(getStackTotalHp(stack)).toBe(15);
    });

    test('should account for current HP of top creature', () => {
      const stack = createUnitStack('PEASANT', 5);
      stack.currentHp = 1;
      expect(getStackTotalHp(stack)).toBe(13); // 4*3 + 1
    });

    test('should return 0 for dead stack', () => {
      const stack = createUnitStack('PEASANT', 0);
      stack.count = 0;
      expect(getStackTotalHp(stack)).toBe(0);
    });
  });

  describe('applyDamageToStack', () => {
    test('should reduce HP of top creature', () => {
      const stack = createUnitStack('SWORDSMAN', 3); // 35 HP each
      const result = applyDamageToStack(stack, 10);
      expect(result.count).toBe(3);
      expect(result.currentHp).toBe(25);
    });

    test('should kill creatures when enough damage', () => {
      const stack = createUnitStack('PEASANT', 5); // 3 HP each
      const result = applyDamageToStack(stack, 7); // Kills 2 peasants + 1 hp damage
      expect(result.count).toBe(3);
      expect(result.currentHp).toBe(2);
    });

    test('should kill all creatures with massive damage', () => {
      const stack = createUnitStack('PEASANT', 3); // 3 HP each, 9 total
      const result = applyDamageToStack(stack, 100);
      expect(result.count).toBe(0);
    });

    test('should handle exactly one kill', () => {
      const stack = createUnitStack('PEASANT', 3); // 3 HP each
      const result = applyDamageToStack(stack, 3);
      expect(result.count).toBe(2);
      expect(result.currentHp).toBe(3); // Fresh creature on top
    });
  });

  describe('calculateDamage', () => {
    test('should return positive damage', () => {
      const attacker = createUnitStack('SWORDSMAN', 5);
      const defender = createUnitStack('PEASANT', 10);
      const damage = calculateDamage(attacker, defender);
      expect(damage).toBeGreaterThan(0);
    });

    test('higher attack should deal more damage', () => {
      const weakAttacker = { ...createUnitStack('PEASANT', 10), attack: 1 };
      const strongAttacker = { ...createUnitStack('PEASANT', 10), attack: 20 };
      const defender = createUnitStack('PEASANT', 10);

      // Run multiple times to account for randomness
      let weakTotal = 0;
      let strongTotal = 0;
      for (let i = 0; i < 100; i++) {
        weakTotal += calculateDamage(weakAttacker, defender);
        strongTotal += calculateDamage(strongAttacker, defender);
      }
      expect(strongTotal).toBeGreaterThan(weakTotal);
    });

    test('should always deal at least 1 damage', () => {
      const attacker = createUnitStack('PEASANT', 1);
      const defender = { ...createUnitStack('ANGEL', 1), defense: 50 };
      const damage = calculateDamage(attacker, defender);
      expect(damage).toBeGreaterThanOrEqual(1);
    });
  });
});
