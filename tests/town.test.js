import { jest } from '@jest/globals';
import {
  createTown, buildInTown, getTownIncome, recruitUnits,
  refreshUnitPools, getAvailableBuildings, BUILDING_TYPES, FACTION_UNITS
} from '../js/town.js';
import { FACTIONS } from '../js/units.js';

describe('Town', () => {
  let town;
  let resources;

  beforeEach(() => {
    town = createTown('Test Castle', FACTIONS.CASTLE, 1, 5, 5);
    resources = { gold: 20000, wood: 50, ore: 50, gems: 10, crystal: 10, sulfur: 10, mercury: 10 };
  });

  describe('createTown', () => {
    test('should create a town with basic properties', () => {
      expect(town.name).toBe('Test Castle');
      expect(town.faction).toBe(FACTIONS.CASTLE);
      expect(town.ownerId).toBe(1);
      expect(town.buildings).toContain('VILLAGE_HALL');
    });

    test('should initialize unit pools', () => {
      expect(town.unitPool).toBeDefined();
      expect(town.unitPool.PEASANT).toBeDefined();
      expect(town.unitPool.PEASANT).toBeGreaterThan(0);
    });
  });

  describe('buildInTown', () => {
    test('should build a fort successfully', () => {
      const result = buildInTown(town, 'FORT', resources);
      expect(result).not.toBeNull();
      expect(town.buildings).toContain('FORT');
    });

    test('should not build without meeting requirements', () => {
      const result = buildInTown(town, 'CITADEL', resources);
      expect(result).toBeNull();
    });

    test('should not build if already built', () => {
      buildInTown(town, 'FORT', resources);
      const result = buildInTown(town, 'FORT', resources);
      expect(result).toBeNull();
    });

    test('should deduct resources', () => {
      const before = resources.gold;
      const result = buildInTown(town, 'FORT', resources);
      expect(result.gold).toBeLessThan(before);
    });

    test('should unlock units when fort is built', () => {
      buildInTown(town, 'FORT', resources);
      expect(town.availableUnits.length).toBeGreaterThan(0);
    });
  });

  describe('getTownIncome', () => {
    test('should return base income from village hall', () => {
      const income = getTownIncome(town);
      expect(income.gold).toBe(500);
    });

    test('should increase after building town hall', () => {
      buildInTown(town, 'TOWN_HALL', resources);
      const income = getTownIncome(town);
      expect(income.gold).toBe(1500); // Village Hall + Town Hall
    });
  });

  describe('recruitUnits', () => {
    beforeEach(() => {
      buildInTown(town, 'FORT', resources);
    });

    test('should recruit available units', () => {
      const result = recruitUnits(town, 'PEASANT', 5, resources);
      expect(result).not.toBeNull();
      expect(result.recruited).toBe(5);
    });

    test('should not recruit unavailable units', () => {
      const result = recruitUnits(town, 'ANGEL', 1, resources);
      expect(result).toBeNull();
    });

    test('should not recruit more than available', () => {
      const pool = town.unitPool.PEASANT;
      const result = recruitUnits(town, 'PEASANT', pool + 10, resources);
      expect(result.recruited).toBe(pool);
    });
  });

  describe('refreshUnitPools', () => {
    test('should add growth to unit pools', () => {
      const before = town.unitPool.PEASANT;
      refreshUnitPools(town);
      expect(town.unitPool.PEASANT).toBeGreaterThan(before);
    });
  });

  describe('getAvailableBuildings', () => {
    test('should list buildings that can be built', () => {
      const available = getAvailableBuildings(town);
      expect(available.length).toBeGreaterThan(0);
      // Should include FORT (no requirements beyond village hall)
      const fortAvailable = available.find(b => b.id === 'FORT');
      expect(fortAvailable).toBeDefined();
    });

    test('should not list already built buildings', () => {
      const available = getAvailableBuildings(town);
      const villageHall = available.find(b => b.id === 'VILLAGE_HALL');
      expect(villageHall).toBeUndefined();
    });
  });
});
