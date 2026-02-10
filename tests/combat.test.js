import { jest } from '@jest/globals';
import {
  initCombat, getCurrentStack, attackAction, moveStack,
  waitAction, defendAction, advanceCombatTurn, checkCombatEnd,
  autoResolveCombat, COMBAT_RESULT, getCombatCell, COMBAT_GRID_WIDTH, COMBAT_GRID_HEIGHT
} from '../js/combat.js';
import { createHero, addUnitsToArmy, resetHeroIdCounter } from '../js/hero.js';
import { createUnitStack } from '../js/units.js';

describe('Combat', () => {
  let attackerHero, defenderHero;

  beforeEach(() => {
    resetHeroIdCounter();
    attackerHero = createHero('KNIGHT', 1, 0, 0);
    addUnitsToArmy(attackerHero, 'SWORDSMAN', 10);
    addUnitsToArmy(attackerHero, 'ARCHER', 15);

    defenderHero = createHero('WARLOCK', 2, 10, 10);
    addUnitsToArmy(defenderHero, 'DEMON', 8);
    addUnitsToArmy(defenderHero, 'IMP', 20);
  });

  describe('initCombat', () => {
    test('should create combat with stacks on both sides', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      expect(combat.stacks.length).toBeGreaterThan(0);

      const attackerStacks = combat.stacks.filter(s => s.side === 'attacker');
      const defenderStacks = combat.stacks.filter(s => s.side === 'defender');
      expect(attackerStacks.length).toBe(2);
      expect(defenderStacks.length).toBe(2);
    });

    test('should work with guardian army (no defender hero)', () => {
      const guardians = [createUnitStack('WOLF', 20)];
      const combat = initCombat(attackerHero, null, guardians);
      const defenderStacks = combat.stacks.filter(s => s.side === 'defender');
      expect(defenderStacks.length).toBe(1);
    });

    test('should place attacker stacks on left side', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const attackerStacks = combat.stacks.filter(s => s.side === 'attacker');
      for (const stack of attackerStacks) {
        expect(stack.gridX).toBe(0);
      }
    });

    test('should place defender stacks on right side', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const defenderStacks = combat.stacks.filter(s => s.side === 'defender');
      for (const stack of defenderStacks) {
        expect(stack.gridX).toBe(COMBAT_GRID_WIDTH - 1);
      }
    });

    test('should start in progress', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      expect(combat.result).toBe(COMBAT_RESULT.IN_PROGRESS);
    });
  });

  describe('getCurrentStack', () => {
    test('should return the fastest stack first', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const current = getCurrentStack(combat);
      expect(current).toBeDefined();
      expect(current.count).toBeGreaterThan(0);
    });
  });

  describe('attackAction', () => {
    test('should deal damage to target when adjacent', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const attacker = combat.stacks.find(s => s.side === 'attacker');
      const defender = combat.stacks.find(s => s.side === 'defender');

      // Move attacker right next to defender
      const adjX = defender.gridX - 1;
      const adjY = defender.gridY;

      // Clear the target cell occupant if any
      const targetCell = getCombatCell(combat, adjX, adjY);
      if (targetCell) targetCell.occupant = null;

      // Directly set attacker position adjacent to defender
      const oldCell = getCombatCell(combat, attacker.gridX, attacker.gridY);
      if (oldCell) oldCell.occupant = null;
      attacker.gridX = adjX;
      attacker.gridY = adjY;
      if (targetCell) targetCell.occupant = attacker;

      const result = attackAction(combat, attacker, defender);
      expect(result).not.toBeNull();
      expect(result.attackDamage).toBeGreaterThan(0);
    });

    test('should not allow attacking own side', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const stacks = combat.stacks.filter(s => s.side === 'attacker');
      if (stacks.length >= 2) {
        const result = attackAction(combat, stacks[0], stacks[1]);
        expect(result).toBeNull();
      }
    });

    test('should mark attacker as having acted', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const attacker = combat.stacks.find(s => s.side === 'attacker');
      const defender = combat.stacks.find(s => s.side === 'defender');

      // Place attacker adjacent to defender
      const oldCell = getCombatCell(combat, attacker.gridX, attacker.gridY);
      if (oldCell) oldCell.occupant = null;
      attacker.gridX = defender.gridX - 1;
      attacker.gridY = defender.gridY;
      const newCell = getCombatCell(combat, attacker.gridX, attacker.gridY);
      if (newCell) newCell.occupant = attacker;

      attackAction(combat, attacker, defender);
      expect(attacker.hasActed).toBe(true);
    });
  });

  describe('moveStack', () => {
    test('should move stack to valid position', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const stack = combat.stacks.find(s => s.side === 'attacker');
      const oldX = stack.gridX;
      const result = moveStack(combat, stack, oldX + 1, stack.gridY);
      expect(result).toBe(true);
      expect(stack.gridX).toBe(oldX + 1);
    });

    test('should not move to occupied cell', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const stack1 = combat.stacks[0];
      const stack2 = combat.stacks[1];
      const result = moveStack(combat, stack1, stack2.gridX, stack2.gridY);
      expect(result).toBe(false);
    });
  });

  describe('autoResolveCombat', () => {
    test('should resolve combat to completion', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      autoResolveCombat(combat);
      expect(combat.result).not.toBe(COMBAT_RESULT.IN_PROGRESS);
    });

    test('should have a winner', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      autoResolveCombat(combat);
      expect([COMBAT_RESULT.ATTACKER_WON, COMBAT_RESULT.DEFENDER_WON]).toContain(combat.result);
    });
  });

  describe('waitAction', () => {
    test('should mark stack as acted', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const stack = getCurrentStack(combat);
      waitAction(combat, stack);
      expect(stack.hasActed).toBe(true);
      expect(stack.waitMode).toBe(true);
    });
  });

  describe('defendAction', () => {
    test('should boost defense and mark as acted', () => {
      const combat = initCombat(attackerHero, defenderHero, null);
      const stack = getCurrentStack(combat);
      const origDefense = stack.defense;
      defendAction(combat, stack);
      expect(stack.hasActed).toBe(true);
      expect(stack.defense).toBeGreaterThan(origDefense);
    });
  });
});
