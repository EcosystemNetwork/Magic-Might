// ============================================================
// AI System - Basic Computer Opponent
// ============================================================

import { findPath, getObjectsAt, MAP_OBJECT_TYPES, isPassable } from './map.js';
import { getAvailableBuildings, buildInTown, recruitUnits } from './town.js';
import { addUnitsToArmy } from './hero.js';

/**
 * Execute AI turn for a player.
 */
export function executeAiTurn(gameState, playerId) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.isAI) return;

  const actions = [];

  // 1. Manage towns - build and recruit
  manageTowns(gameState, player, actions);

  // 2. Move heroes
  moveHeroes(gameState, player, actions);

  return actions;
}

function manageTowns(gameState, player, actions) {
  const towns = gameState.towns.filter(t => t.ownerId === player.id);

  for (const town of towns) {
    // Try to build the most expensive affordable building
    const available = getAvailableBuildings(town);
    for (const building of available.sort((a, b) => (b.cost.gold || 0) - (a.cost.gold || 0))) {
      const result = buildInTown(town, building.id, player.resources);
      if (result) {
        player.resources = result;
        actions.push({ type: 'build', town: town.name, building: building.name });
        break; // One building per town per turn
      }
    }

    // Recruit units and assign to first hero at/near town
    const hero = gameState.heroes.find(h => h.playerId === player.id &&
      Math.abs(h.x - town.x) <= 1 && Math.abs(h.y - town.y) <= 1);

    if (hero) {
      for (const unitId of town.availableUnits) {
        const pool = town.unitPool[unitId] || 0;
        if (pool > 0) {
          const result = recruitUnits(town, unitId, pool, player.resources);
          if (result) {
            player.resources = result.resources;
            addUnitsToArmy(hero, unitId, result.recruited);
            actions.push({ type: 'recruit', unit: unitId, count: result.recruited });
          }
        }
      }
    }
  }
}

function moveHeroes(gameState, player, actions) {
  const heroes = gameState.heroes.filter(h => h.playerId === player.id);

  for (const hero of heroes) {
    if (hero.movementPoints <= 0) continue;

    // Find best target to move towards
    const target = findBestTarget(gameState, hero, player);
    if (!target) continue;

    const pathResult = findPath(gameState.map, hero.x, hero.y, target.x, target.y);
    if (!pathResult || pathResult.path.length === 0) continue;

    // Move along path as far as movement allows
    let moved = 0;
    for (const step of pathResult.path) {
      if (hero.movementPoints <= 0) break;

      // Check for blocking heroes/objects
      const enemyHero = gameState.heroes.find(h =>
        h.playerId !== player.id && h.x === step.x && h.y === step.y
      );

      if (enemyHero) {
        // Trigger combat
        actions.push({ type: 'combat', heroId: hero.id, targetHeroId: enemyHero.id, x: step.x, y: step.y });
        break;
      }

      hero.x = step.x;
      hero.y = step.y;
      hero.movementPoints -= 1;
      moved++;
    }

    if (moved > 0) {
      actions.push({ type: 'move', heroId: hero.id, x: hero.x, y: hero.y, steps: moved });
    }

    // Check for object interactions at new position
    const objects = getObjectsAt(gameState.map, hero.x, hero.y);
    for (const obj of objects) {
      actions.push({ type: 'interact', heroId: hero.id, object: obj.type, x: obj.x, y: obj.y });
    }
  }
}

function findBestTarget(gameState, hero, player) {
  const targets = [];

  // Enemy heroes
  for (const enemyHero of gameState.heroes.filter(h => h.playerId !== player.id)) {
    const dist = Math.abs(hero.x - enemyHero.x) + Math.abs(hero.y - enemyHero.y);
    targets.push({ x: enemyHero.x, y: enemyHero.y, priority: 100 - dist, type: 'enemy_hero' });
  }

  // Unowned towns
  for (const town of gameState.towns.filter(t => t.ownerId !== player.id)) {
    const dist = Math.abs(hero.x - town.x) + Math.abs(hero.y - town.y);
    targets.push({ x: town.x, y: town.y, priority: 80 - dist, type: 'town' });
  }

  // Uncollected resources
  for (const obj of gameState.map.objects) {
    if (obj.type === MAP_OBJECT_TYPES.RESOURCE_PILE && !obj.collected) {
      const dist = Math.abs(hero.x - obj.x) + Math.abs(hero.y - obj.y);
      targets.push({ x: obj.x, y: obj.y, priority: 50 - dist, type: 'resource' });
    }
    // Unowned mines
    if (obj.type && obj.type.startsWith('MINE_') && obj.ownerId !== player.id) {
      const dist = Math.abs(hero.x - obj.x) + Math.abs(hero.y - obj.y);
      targets.push({ x: obj.x, y: obj.y, priority: 60 - dist, type: 'mine' });
    }
  }

  // Own towns (to recruit units)
  const ownTowns = gameState.towns.filter(t => t.ownerId === player.id);
  for (const town of ownTowns) {
    const hasUnitsToRecruit = Object.values(town.unitPool).some(v => v > 0);
    if (hasUnitsToRecruit && hero.army.length < 7) {
      const dist = Math.abs(hero.x - town.x) + Math.abs(hero.y - town.y);
      targets.push({ x: town.x, y: town.y, priority: 40 - dist, type: 'own_town' });
    }
  }

  // Filter to passable targets and pick highest priority
  const passable = targets.filter(t => isPassable(gameState.map, t.x, t.y));
  passable.sort((a, b) => b.priority - a.priority);

  return passable[0] || null;
}
