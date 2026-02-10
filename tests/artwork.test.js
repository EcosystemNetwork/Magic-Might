import { jest } from '@jest/globals';
import { SpriteCache, shadeColor } from '../js/artwork.js';

describe('Artwork Generation', () => {
  describe('SpriteCache', () => {
    let cache;

    beforeEach(() => {
      cache = new SpriteCache();
    });

    test('should initialize without being generated', () => {
      expect(cache.generated).toBe(false);
      expect(cache.cache.size).toBe(0);
    });

    test('should generate all sprites without errors', () => {
      expect(() => cache.generateAll(32, 48)).not.toThrow();
      expect(cache.generated).toBe(true);
    });

    test('should generate terrain sprites for all terrain types', () => {
      cache.generateAll(32, 48);
      const terrains = ['GRASS', 'FOREST', 'MOUNTAIN', 'WATER', 'SAND', 'ROAD', 'SWAMP', 'SNOW'];
      for (const terrain of terrains) {
        expect(cache.get(`terrain_${terrain}`)).toBeDefined();
      }
    });

    test('should generate map object sprites', () => {
      cache.generateAll(32, 48);
      expect(cache.get('obj_TOWN_neutral')).toBeDefined();
      expect(cache.get('obj_TOWN_player1')).toBeDefined();
      expect(cache.get('obj_TOWN_player2')).toBeDefined();
      expect(cache.get('obj_MINE_GOLD')).toBeDefined();
      expect(cache.get('obj_MINE_WOOD')).toBeDefined();
      expect(cache.get('obj_MINE_ORE')).toBeDefined();
      expect(cache.get('obj_MINE_GEMS')).toBeDefined();
      expect(cache.get('obj_RESOURCE_PILE')).toBeDefined();
      expect(cache.get('obj_TREASURE_CHEST')).toBeDefined();
      expect(cache.get('obj_MONSTER_LAIR')).toBeDefined();
    });

    test('should generate hero sprites for all classes', () => {
      cache.generateAll(32, 48);
      expect(cache.get('hero_KNIGHT')).toBeDefined();
      expect(cache.get('hero_WARLOCK')).toBeDefined();
      expect(cache.get('hero_NECROMANCER')).toBeDefined();
    });

    test('should generate unit sprites for all unit types', () => {
      cache.generateAll(32, 48);
      const units = [
        'PEASANT', 'ARCHER', 'GRIFFIN', 'SWORDSMAN', 'CAVALIER', 'ANGEL',
        'IMP', 'DEMON', 'PIT_FIEND', 'DEVIL',
        'SKELETON', 'ZOMBIE', 'VAMPIRE', 'BONE_DRAGON',
        'WOLF', 'ORC', 'OGRE', 'DRAGON',
      ];
      for (const unit of units) {
        expect(cache.get(`unit_${unit}`)).toBeDefined();
      }
    });

    test('should return undefined for non-existent sprites', () => {
      cache.generateAll(32, 48);
      expect(cache.get('nonexistent_sprite')).toBeUndefined();
    });

    test('createSprite should store and return a canvas', () => {
      const result = cache.createSprite('test_sprite', 32, 32, (ctx, w, h) => {
        // Drawing operations would happen here
      });
      expect(result).toBeDefined();
      expect(cache.get('test_sprite')).toBe(result);
    });

    test('should work with different tile and cell sizes', () => {
      expect(() => cache.generateAll(16, 24)).not.toThrow();
      expect(cache.generated).toBe(true);
      expect(cache.tileSize).toBe(16);
      expect(cache.combatCellSize).toBe(24);
    });
  });

  describe('shadeColor', () => {
    test('should lighten a color with positive percent', () => {
      const result = shadeColor('#000000', 50);
      // Should produce a lighter color than black
      expect(result).not.toBe('#000000');
      expect(result.startsWith('#')).toBe(true);
      expect(result.length).toBe(7);
    });

    test('should darken a color with negative percent', () => {
      const result = shadeColor('#ffffff', -50);
      expect(result).not.toBe('#ffffff');
      expect(result.startsWith('#')).toBe(true);
      expect(result.length).toBe(7);
    });

    test('should return valid hex color format', () => {
      const result = shadeColor('#4488cc', 20);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should clamp values to valid range', () => {
      const lightResult = shadeColor('#ffffff', 100);
      expect(lightResult).toMatch(/^#[0-9a-f]{6}$/);

      const darkResult = shadeColor('#000000', -100);
      expect(darkResult).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should not change color with zero percent', () => {
      const result = shadeColor('#4488cc', 0);
      expect(result).toBe('#4488cc');
    });
  });
});
