// ============================================================
// Town / Castle System
// ============================================================

import { FACTIONS, UNIT_TEMPLATES } from './units.js';
import { canAfford, spendResources } from './resources.js';

export const BUILDING_TYPES = {
  VILLAGE_HALL: {
    id: 'VILLAGE_HALL', name: 'Village Hall', cost: { gold: 0 },
    description: 'Basic income building. +500 gold/day.',
    income: { gold: 500 },
  },
  TOWN_HALL: {
    id: 'TOWN_HALL', name: 'Town Hall', cost: { gold: 2500 },
    description: 'Upgraded hall. +1000 gold/day.',
    income: { gold: 1000 },
    requires: ['VILLAGE_HALL'],
  },
  FORT: {
    id: 'FORT', name: 'Fort', cost: { gold: 2000, wood: 5, ore: 5 },
    description: 'Allows recruitment of tier 1-2 creatures and provides basic walls.',
    provides: ['tier1', 'tier2'],
  },
  CITADEL: {
    id: 'CITADEL', name: 'Citadel', cost: { gold: 5000, wood: 10, ore: 10 },
    description: 'Allows tier 3-4 creatures and stronger walls. +50% creature growth.',
    provides: ['tier3', 'tier4'],
    requires: ['FORT'],
    growthBonus: 0.5,
  },
  CASTLE_UPGRADE: {
    id: 'CASTLE_UPGRADE', name: 'Castle', cost: { gold: 10000, wood: 20, ore: 20 },
    description: 'Allows tier 5-7 creatures and full fortifications. +100% creature growth.',
    provides: ['tier5', 'tier6', 'tier7'],
    requires: ['CITADEL'],
    growthBonus: 1.0,
  },
  MAGE_GUILD: {
    id: 'MAGE_GUILD', name: 'Mage Guild', cost: { gold: 3000, wood: 5, ore: 5 },
    description: 'Provides spells to visiting heroes.',
    providesSpells: true,
  },
  MARKETPLACE: {
    id: 'MARKETPLACE', name: 'Marketplace', cost: { gold: 500, wood: 5 },
    description: 'Allows resource trading.',
    allowsTrading: true,
  },
  TAVERN: {
    id: 'TAVERN', name: 'Tavern', cost: { gold: 500, wood: 5 },
    description: 'Hire additional heroes.',
    allowsHeroHiring: true,
  },
};

/**
 * Creature dwellings available per faction.
 */
export const FACTION_UNITS = {
  [FACTIONS.CASTLE]: ['PEASANT', 'ARCHER', 'GRIFFIN', 'SWORDSMAN', 'CAVALIER', 'ANGEL'],
  [FACTIONS.INFERNO]: ['IMP', 'DEMON', 'PIT_FIEND', 'DEVIL'],
  [FACTIONS.NECROPOLIS]: ['SKELETON', 'ZOMBIE', 'VAMPIRE', 'BONE_DRAGON'],
};

/**
 * Create a town.
 */
export function createTown(name, faction, ownerId, x, y) {
  const units = FACTION_UNITS[faction] || FACTION_UNITS[FACTIONS.CASTLE];

  return {
    name,
    faction,
    ownerId,
    x, y,
    buildings: ['VILLAGE_HALL'],
    availableUnits: computeAvailableUnits(units, ['VILLAGE_HALL']),
    unitPool: initializeUnitPool(units),
    garrisonArmy: [],
  };
}

function computeAvailableUnits(factionUnits, buildings) {
  const available = [];
  const hasFort = buildings.includes('FORT');
  const hasCitadel = buildings.includes('CITADEL');
  const hasCastle = buildings.includes('CASTLE_UPGRADE');

  for (const unitId of factionUnits) {
    const unit = UNIT_TEMPLATES[unitId];
    if (!unit) continue;

    if (unit.tier <= 2 && hasFort) available.push(unitId);
    else if (unit.tier <= 4 && hasCitadel) available.push(unitId);
    else if (unit.tier <= 7 && hasCastle) available.push(unitId);
  }
  return available;
}

function initializeUnitPool(factionUnits) {
  const pool = {};
  for (const unitId of factionUnits) {
    const unit = UNIT_TEMPLATES[unitId];
    if (unit) {
      pool[unitId] = unit.growth;
    }
  }
  return pool;
}

/**
 * Build a building in a town. Returns updated resources or null if can't afford.
 */
export function buildInTown(town, buildingId, resources) {
  const building = BUILDING_TYPES[buildingId];
  if (!building) return null;
  if (town.buildings.includes(buildingId)) return null;

  // Check requirements
  if (building.requires) {
    for (const req of building.requires) {
      if (!town.buildings.includes(req)) return null;
    }
  }

  if (!canAfford(resources, building.cost)) return null;

  const newResources = spendResources(resources, building.cost);
  town.buildings.push(buildingId);

  // Recalculate available units
  const factionUnits = FACTION_UNITS[town.faction] || [];
  town.availableUnits = computeAvailableUnits(factionUnits, town.buildings);

  return newResources;
}

/**
 * Get the daily income from a town.
 */
export function getTownIncome(town) {
  const income = { gold: 0, wood: 0, ore: 0, gems: 0, crystal: 0, sulfur: 0, mercury: 0 };
  for (const buildingId of town.buildings) {
    const building = BUILDING_TYPES[buildingId];
    if (building && building.income) {
      for (const [res, amount] of Object.entries(building.income)) {
        income[res] = (income[res] || 0) + amount;
      }
    }
  }
  return income;
}

/**
 * Recruit units from a town. Returns updated resources or null if can't afford.
 */
export function recruitUnits(town, unitId, count, resources) {
  if (!town.availableUnits.includes(unitId)) return null;

  const template = UNIT_TEMPLATES[unitId];
  if (!template) return null;

  const available = town.unitPool[unitId] || 0;
  const toRecruit = Math.min(count, available);
  if (toRecruit <= 0) return null;

  const totalCost = {};
  for (const [res, amount] of Object.entries(template.cost)) {
    totalCost[res] = amount * toRecruit;
  }

  if (!canAfford(resources, totalCost)) return null;

  const newResources = spendResources(resources, totalCost);
  town.unitPool[unitId] -= toRecruit;

  return { resources: newResources, recruited: toRecruit };
}

/**
 * Refresh unit pools at the start of each week (every 7 turns).
 */
export function refreshUnitPools(town) {
  const factionUnits = FACTION_UNITS[town.faction] || [];
  let growthBonus = 0;

  for (const buildingId of town.buildings) {
    const building = BUILDING_TYPES[buildingId];
    if (building && building.growthBonus) {
      growthBonus += building.growthBonus;
    }
  }

  for (const unitId of factionUnits) {
    const unit = UNIT_TEMPLATES[unitId];
    if (unit) {
      const growth = Math.floor(unit.growth * (1 + growthBonus));
      town.unitPool[unitId] = (town.unitPool[unitId] || 0) + growth;
    }
  }
}

/**
 * Get list of buildings that can be built in a town.
 */
export function getAvailableBuildings(town) {
  const available = [];
  for (const [id, building] of Object.entries(BUILDING_TYPES)) {
    if (town.buildings.includes(id)) continue;
    if (building.requires) {
      const meetsReqs = building.requires.every(req => town.buildings.includes(req));
      if (!meetsReqs) continue;
    }
    available.push({ id, ...building });
  }
  return available;
}
