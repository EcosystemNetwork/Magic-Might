import { jest } from '@jest/globals';
import {
  createHero, addUnitsToArmy, resetHeroForNewTurn,
  experienceForLevel, checkLevelUp, HERO_CLASSES, resetHeroIdCounter
} from '../js/hero.js';

describe('Hero', () => {
  beforeEach(() => {
    resetHeroIdCounter();
  });

  describe('createHero', () => {
    test('should create a knight hero with correct stats', () => {
      const hero = createHero('KNIGHT', 1, 5, 5);
      expect(hero.heroClass).toBe('KNIGHT');
      expect(hero.playerId).toBe(1);
      expect(hero.x).toBe(5);
      expect(hero.y).toBe(5);
      expect(hero.attack).toBe(2);
      expect(hero.defense).toBe(2);
      expect(hero.level).toBe(1);
      expect(hero.army).toEqual([]);
      expect(hero.movementPoints).toBe(20);
    });

    test('should create a warlock hero with higher spell power', () => {
      const hero = createHero('WARLOCK', 2, 10, 10);
      expect(hero.spellPower).toBe(3);
      expect(hero.mana).toBe(30);
    });

    test('should assign unique IDs', () => {
      const hero1 = createHero('KNIGHT', 1, 0, 0);
      const hero2 = createHero('KNIGHT', 1, 0, 0);
      expect(hero1.id).not.toBe(hero2.id);
    });
  });

  describe('addUnitsToArmy', () => {
    test('should add new unit stack to army', () => {
      const hero = createHero('KNIGHT', 1, 0, 0);
      addUnitsToArmy(hero, 'PEASANT', 10);
      expect(hero.army.length).toBe(1);
      expect(hero.army[0].templateId).toBe('PEASANT');
      expect(hero.army[0].count).toBe(10);
    });

    test('should merge same unit types', () => {
      const hero = createHero('KNIGHT', 1, 0, 0);
      addUnitsToArmy(hero, 'PEASANT', 10);
      addUnitsToArmy(hero, 'PEASANT', 5);
      expect(hero.army.length).toBe(1);
      expect(hero.army[0].count).toBe(15);
    });

    test('should not exceed 7 army slots', () => {
      const hero = createHero('KNIGHT', 1, 0, 0);
      const units = ['PEASANT', 'ARCHER', 'GRIFFIN', 'SWORDSMAN', 'CAVALIER', 'ANGEL', 'IMP'];
      units.forEach(u => addUnitsToArmy(hero, u, 1));
      expect(hero.army.length).toBe(7);

      // 8th should not be added
      addUnitsToArmy(hero, 'DEMON', 1);
      expect(hero.army.length).toBe(7);
    });
  });

  describe('resetHeroForNewTurn', () => {
    test('should restore movement points', () => {
      const hero = createHero('KNIGHT', 1, 0, 0);
      hero.movementPoints = 0;
      resetHeroForNewTurn(hero);
      expect(hero.movementPoints).toBe(20);
    });
  });

  describe('experienceForLevel', () => {
    test('should scale with level', () => {
      expect(experienceForLevel(1)).toBe(1000);
      expect(experienceForLevel(2)).toBe(2000);
      expect(experienceForLevel(5)).toBe(5000);
    });
  });

  describe('checkLevelUp', () => {
    test('should level up hero with enough experience', () => {
      const hero = createHero('KNIGHT', 1, 0, 0);
      hero.experience = 1000;
      const leveled = checkLevelUp(hero);
      expect(leveled).toBe(true);
      expect(hero.level).toBe(2);
    });

    test('should not level up without enough experience', () => {
      const hero = createHero('KNIGHT', 1, 0, 0);
      hero.experience = 500;
      const leveled = checkLevelUp(hero);
      expect(leveled).toBe(false);
      expect(hero.level).toBe(1);
    });
  });
});
