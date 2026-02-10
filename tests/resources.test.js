import { jest } from '@jest/globals';
import {
  createStartingResources, canAfford, spendResources, addResources, createBaseIncome
} from '../js/resources.js';

describe('Resources', () => {
  describe('createStartingResources', () => {
    test('should create resources with gold', () => {
      const res = createStartingResources();
      expect(res.gold).toBe(5000);
      expect(res.wood).toBe(10);
      expect(res.ore).toBe(10);
      expect(res.gems).toBe(2);
    });
  });

  describe('canAfford', () => {
    test('should return true when resources are sufficient', () => {
      const resources = { gold: 1000, wood: 10 };
      expect(canAfford(resources, { gold: 500, wood: 5 })).toBe(true);
    });

    test('should return false when resources are insufficient', () => {
      const resources = { gold: 100, wood: 10 };
      expect(canAfford(resources, { gold: 500 })).toBe(false);
    });

    test('should return true for empty cost', () => {
      const resources = { gold: 0 };
      expect(canAfford(resources, {})).toBe(true);
    });
  });

  describe('spendResources', () => {
    test('should deduct cost from resources', () => {
      const resources = { gold: 1000, wood: 10 };
      const result = spendResources(resources, { gold: 300, wood: 5 });
      expect(result.gold).toBe(700);
      expect(result.wood).toBe(5);
    });

    test('should not mutate original resources', () => {
      const resources = { gold: 1000 };
      spendResources(resources, { gold: 300 });
      expect(resources.gold).toBe(1000);
    });
  });

  describe('addResources', () => {
    test('should add income to resources', () => {
      const resources = { gold: 1000, wood: 5 };
      const result = addResources(resources, { gold: 500, wood: 2 });
      expect(result.gold).toBe(1500);
      expect(result.wood).toBe(7);
    });
  });

  describe('createBaseIncome', () => {
    test('should return base income with gold', () => {
      const income = createBaseIncome();
      expect(income.gold).toBe(500);
    });
  });
});
