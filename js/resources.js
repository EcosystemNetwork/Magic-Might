// ============================================================
// Resource System
// ============================================================

export const RESOURCE_TYPES = {
  GOLD: 'gold',
  WOOD: 'wood',
  ORE: 'ore',
  GEMS: 'gems',
  CRYSTAL: 'crystal',
  SULFUR: 'sulfur',
  MERCURY: 'mercury',
};

export const RESOURCE_NAMES = {
  gold: 'Gold',
  wood: 'Wood',
  ore: 'Ore',
  gems: 'Gems',
  crystal: 'Crystal',
  sulfur: 'Sulfur',
  mercury: 'Mercury',
};

export const RESOURCE_COLORS = {
  gold: '#ffd700',
  wood: '#8b4513',
  ore: '#808080',
  gems: '#ff69b4',
  crystal: '#87ceeb',
  sulfur: '#ffff00',
  mercury: '#c0c0c0',
};

/**
 * Create default starting resources for a player.
 */
export function createStartingResources() {
  return {
    gold: 5000,
    wood: 10,
    ore: 10,
    gems: 2,
    crystal: 2,
    sulfur: 2,
    mercury: 2,
  };
}

/**
 * Daily income from towns and mines.
 */
export function createBaseIncome() {
  return {
    gold: 500,
    wood: 0,
    ore: 0,
    gems: 0,
    crystal: 0,
    sulfur: 0,
    mercury: 0,
  };
}

/**
 * Check if a player can afford a cost.
 */
export function canAfford(resources, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    if ((resources[resource] || 0) < amount) return false;
  }
  return true;
}

/**
 * Deduct cost from resources. Returns new resources object.
 */
export function spendResources(resources, cost) {
  const updated = { ...resources };
  for (const [resource, amount] of Object.entries(cost)) {
    updated[resource] = (updated[resource] || 0) - amount;
  }
  return updated;
}

/**
 * Add income to resources. Returns new resources object.
 */
export function addResources(resources, income) {
  const updated = { ...resources };
  for (const [resource, amount] of Object.entries(income)) {
    updated[resource] = (updated[resource] || 0) + amount;
  }
  return updated;
}
