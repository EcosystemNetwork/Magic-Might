import { jest } from '@jest/globals';
import {
  generateMap, getTile, isPassable, findPath,
  getObjectsAt, hasObjectAt, getMoveCost, updateVisibility,
  TERRAIN_TYPES, MAP_OBJECT_TYPES
} from '../js/map.js';

describe('Map', () => {
  let map;

  beforeEach(() => {
    map = generateMap(20, 15, 42);
  });

  describe('generateMap', () => {
    test('should create map with correct dimensions', () => {
      expect(map.width).toBe(20);
      expect(map.height).toBe(15);
      expect(map.tiles.length).toBe(20 * 15);
    });

    test('should have border tiles as impassable', () => {
      // Check a border tile not in the cleared starting area
      const borderTile = getTile(map, 0, 10);
      expect(TERRAIN_TYPES[borderTile.terrain].passable).toBe(false);
    });

    test('should have map objects', () => {
      expect(map.objects.length).toBeGreaterThan(0);
    });

    test('should have towns', () => {
      const towns = map.objects.filter(o => o.type === MAP_OBJECT_TYPES.TOWN);
      expect(towns.length).toBeGreaterThanOrEqual(2);
    });

    test('should create passable starting areas', () => {
      expect(isPassable(map, 3, 3)).toBe(true);
      expect(isPassable(map, 16, 11)).toBe(true); // 20-4, 15-4
    });
  });

  describe('getTile', () => {
    test('should return tile at valid position', () => {
      const tile = getTile(map, 5, 5);
      expect(tile).toBeDefined();
      expect(tile.x).toBe(5);
      expect(tile.y).toBe(5);
    });

    test('should return null for out of bounds', () => {
      expect(getTile(map, -1, 0)).toBeNull();
      expect(getTile(map, 0, -1)).toBeNull();
      expect(getTile(map, 20, 0)).toBeNull();
      expect(getTile(map, 0, 15)).toBeNull();
    });
  });

  describe('isPassable', () => {
    test('should return false for water tiles', () => {
      // Check a border tile not in the cleared area
      expect(isPassable(map, 0, 10)).toBe(false);
    });

    test('should return false for out of bounds', () => {
      expect(isPassable(map, -1, -1)).toBe(false);
    });
  });

  describe('findPath', () => {
    test('should find path between two passable points', () => {
      const result = findPath(map, 3, 3, 5, 5);
      expect(result).not.toBeNull();
      expect(result.path.length).toBeGreaterThan(0);
      const lastStep = result.path[result.path.length - 1];
      expect(lastStep.x).toBe(5);
      expect(lastStep.y).toBe(5);
    });

    test('should return null for impassable destination', () => {
      // Use a tile that is guaranteed impassable (border not in cleared area)
      const result = findPath(map, 3, 3, 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('getMoveCost', () => {
    test('should return correct cost for grass', () => {
      // Make sure the tile is grass
      const tile = getTile(map, 3, 3);
      tile.terrain = 'GRASS';
      expect(getMoveCost(map, 3, 3)).toBe(1);
    });

    test('should return high cost for out of bounds', () => {
      expect(getMoveCost(map, -1, -1)).toBe(999);
    });
  });

  describe('updateVisibility', () => {
    test('should mark tiles as explored', () => {
      updateVisibility(map, 5, 5, 3, 1);
      const tile = getTile(map, 5, 5);
      expect(tile.explored).toBe(true);
      expect(tile.visible).toBe(true);
    });
  });
});
