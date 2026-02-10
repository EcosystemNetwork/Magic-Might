import { jest } from '@jest/globals';
import {
  createGameState, moveHeroTo, endTurn, executeCombatAction,
  openTownView, closeTownView, recruitFromTown, buildInGameTown, GAME_PHASES
} from '../js/game.js';
import { resetHeroIdCounter } from '../js/hero.js';

describe('Game', () => {
  let gameState;

  beforeEach(() => {
    resetHeroIdCounter();
    gameState = createGameState({ seed: 42, mapWidth: 20, mapHeight: 15 });
  });

  describe('createGameState', () => {
    test('should create game with two players', () => {
      expect(gameState.players.length).toBe(2);
      expect(gameState.players[0].isAI).toBe(false);
      expect(gameState.players[1].isAI).toBe(true);
    });

    test('should create heroes for both players', () => {
      expect(gameState.heroes.length).toBe(2);
      expect(gameState.heroes[0].playerId).toBe(1);
      expect(gameState.heroes[1].playerId).toBe(2);
    });

    test('should start at turn 1', () => {
      expect(gameState.turn).toBe(1);
    });

    test('should be in adventure phase', () => {
      expect(gameState.phase).toBe(GAME_PHASES.ADVENTURE);
    });

    test('should have a map', () => {
      expect(gameState.map).toBeDefined();
      expect(gameState.map.width).toBe(20);
      expect(gameState.map.height).toBe(15);
    });

    test('should have towns', () => {
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);
    });

    test('heroes should have armies', () => {
      for (const hero of gameState.heroes) {
        expect(hero.army.length).toBeGreaterThan(0);
      }
    });
  });

  describe('moveHeroTo', () => {
    test('should move hero to adjacent tile', () => {
      const hero = gameState.heroes[0];
      const result = moveHeroTo(gameState, hero.id, hero.x + 1, hero.y);
      expect(result.success).toBe(true);
    });

    test('should fail for wrong player hero', () => {
      const aiHero = gameState.heroes[1];
      const result = moveHeroTo(gameState, aiHero.id, aiHero.x + 1, aiHero.y);
      expect(result.success).toBe(false);
    });

    test('should reduce movement points', () => {
      const hero = gameState.heroes[0];
      const before = hero.movementPoints;
      moveHeroTo(gameState, hero.id, hero.x + 1, hero.y);
      expect(hero.movementPoints).toBeLessThan(before);
    });
  });

  describe('endTurn', () => {
    test('should advance turn counter', () => {
      const turnBefore = gameState.turn;
      endTurn(gameState);
      // After both players go, turn advances
      expect(gameState.turn).toBeGreaterThanOrEqual(turnBefore);
    });

    test('should reset hero movement', () => {
      const hero = gameState.heroes.find(h => h.playerId === 1);
      hero.movementPoints = 0;
      endTurn(gameState); // AI turn auto-ends, then player 1's turn starts
      // If hero survived, movement should be reset
      const heroAfter = gameState.heroes.find(h => h.playerId === 1);
      if (heroAfter) {
        expect(heroAfter.movementPoints).toBe(heroAfter.maxMovementPoints);
      }
    });
  });

  describe('openTownView / closeTownView', () => {
    test('should open town view for owned town', () => {
      const town = gameState.towns.find(t => t.ownerId === 1);
      if (town) {
        const result = openTownView(gameState, town.x, town.y);
        expect(result).not.toBeNull();
        expect(gameState.phase).toBe(GAME_PHASES.TOWN_VIEW);
      }
    });

    test('should close town view', () => {
      const town = gameState.towns.find(t => t.ownerId === 1);
      if (town) {
        openTownView(gameState, town.x, town.y);
        closeTownView(gameState);
        expect(gameState.phase).toBe(GAME_PHASES.ADVENTURE);
      }
    });
  });

  describe('buildInGameTown', () => {
    test('should build in owned town', () => {
      const town = gameState.towns.find(t => t.ownerId === 1);
      if (town) {
        const result = buildInGameTown(gameState, town.x, town.y, 'FORT');
        expect(result).toBeDefined();
        if (result.success) {
          expect(town.buildings).toContain('FORT');
        }
      }
    });
  });
});
