// ============================================================
// Main Game Engine
// ============================================================

import { createStartingResources, addResources } from './resources.js';
import { createHero, addUnitsToArmy, resetHeroForNewTurn, checkLevelUp } from './hero.js';
import { generateMap, findPath, getObjectsAt, updateVisibility, MAP_OBJECT_TYPES, isPassable, getMoveCost } from './map.js';
import { createTown, getTownIncome, refreshUnitPools, recruitUnits, buildInTown } from './town.js';
import { initCombat, attackAction, getCurrentStack, advanceCombatTurn, autoResolveCombat, COMBAT_RESULT, moveStack, waitAction, defendAction } from './combat.js';
import { executeAiTurn } from './ai.js';
import { SPELLS, castDamageSpell, castBuffSpell, castHealSpell, getAvailableSpells } from './spells.js';
import { createUnitStack, applyDamageToStack } from './units.js';

export const GAME_PHASES = {
  ADVENTURE: 'ADVENTURE',
  COMBAT: 'COMBAT',
  TOWN_VIEW: 'TOWN_VIEW',
  GAME_OVER: 'GAME_OVER',
};

/**
 * Create a new game state.
 */
export function createGameState(options = {}) {
  const mapWidth = options.mapWidth || 30;
  const mapHeight = options.mapHeight || 25;
  const seed = options.seed || Math.floor(Math.random() * 99999);

  const map = generateMap(mapWidth, mapHeight, seed);

  const gameState = {
    phase: GAME_PHASES.ADVENTURE,
    turn: 1,
    currentPlayerId: 1,
    map,
    players: [],
    heroes: [],
    towns: [],
    combat: null,
    selectedHero: null,
    gameLog: [],
    winner: null,
  };

  // Create Player 1 (human)
  const player1 = {
    id: 1,
    name: 'Player 1',
    color: '#4488ff',
    isAI: false,
    resources: createStartingResources(),
  };

  // Create Player 2 (AI)
  const player2 = {
    id: 2,
    name: 'Player 2 (AI)',
    color: '#ff4444',
    isAI: true,
    resources: createStartingResources(),
  };

  gameState.players.push(player1, player2);

  // Create towns from map objects
  for (const obj of map.objects.filter(o => o.type === MAP_OBJECT_TYPES.TOWN)) {
    const town = createTown(obj.name, obj.faction, obj.ownerId, obj.x, obj.y);
    gameState.towns.push(town);
  }

  // Create starting heroes
  const hero1 = createHero('KNIGHT', 1, 3, 3);
  addUnitsToArmy(hero1, 'PEASANT', 30);
  addUnitsToArmy(hero1, 'ARCHER', 10);
  addUnitsToArmy(hero1, 'GRIFFIN', 4);
  hero1.spellBook = ['MAGIC_ARROW', 'HASTE', 'CURE', 'SHIELD'];
  gameState.heroes.push(hero1);

  const hero2 = createHero('WARLOCK', 2, mapWidth - 4, mapHeight - 4);
  addUnitsToArmy(hero2, 'IMP', 40);
  addUnitsToArmy(hero2, 'DEMON', 8);
  addUnitsToArmy(hero2, 'PIT_FIEND', 3);
  hero2.spellBook = ['LIGHTNING_BOLT', 'SLOW', 'BLOODLUST', 'FIREBALL'];
  gameState.heroes.push(hero2);

  gameState.selectedHero = hero1;

  // Update initial visibility
  updateVisibility(map, hero1.x, hero1.y, 5, 1);
  updateVisibility(map, hero2.x, hero2.y, 5, 2);

  gameState.gameLog.push('Game started! Build your army and defeat the enemy!');

  return gameState;
}

/**
 * Move a hero on the adventure map.
 */
export function moveHeroTo(gameState, heroId, targetX, targetY) {
  const hero = gameState.heroes.find(h => h.id === heroId);
  if (!hero || hero.playerId !== gameState.currentPlayerId) return { success: false, message: 'Not your hero' };
  if (hero.movementPoints <= 0) return { success: false, message: 'No movement points remaining' };

  const pathResult = findPath(gameState.map, hero.x, hero.y, targetX, targetY);
  if (!pathResult) return { success: false, message: 'No path found' };

  let stepsToMove = [];
  let totalCost = 0;

  for (const step of pathResult.path) {
    const moveCost = getMoveCost(gameState.map, step.x, step.y);
    if (totalCost + moveCost > hero.movementPoints) break;
    totalCost += moveCost;
    stepsToMove.push(step);

    // Check for encounters along the way
    const enemyHero = gameState.heroes.find(h =>
      h.playerId !== hero.playerId && h.x === step.x && h.y === step.y && h.army.length > 0
    );
    if (enemyHero) {
      // Move to enemy position and trigger combat
      hero.x = step.x;
      hero.y = step.y;
      hero.movementPoints -= totalCost;
      updateVisibility(gameState.map, hero.x, hero.y, 5, hero.playerId);
      return startCombat(gameState, hero, enemyHero);
    }
  }

  if (stepsToMove.length === 0) return { success: false, message: 'Cannot move there' };

  const lastStep = stepsToMove[stepsToMove.length - 1];
  hero.x = lastStep.x;
  hero.y = lastStep.y;
  hero.movementPoints -= totalCost;

  // Update fog of war
  updateVisibility(gameState.map, hero.x, hero.y, 5, hero.playerId);

  // Check for interactions at destination
  const interactions = handleMapInteractions(gameState, hero);

  return {
    success: true,
    message: `Moved to (${hero.x}, ${hero.y}). ${hero.movementPoints.toFixed(1)} MP remaining.`,
    interactions,
    path: stepsToMove,
  };
}

/**
 * Handle interactions when a hero arrives at a map location.
 */
function handleMapInteractions(gameState, hero) {
  const objects = getObjectsAt(gameState.map, hero.x, hero.y);
  const results = [];

  for (const obj of objects) {
    switch (obj.type) {
      case MAP_OBJECT_TYPES.RESOURCE_PILE:
        if (!obj.collected) {
          const player = gameState.players.find(p => p.id === hero.playerId);
          player.resources[obj.resource] = (player.resources[obj.resource] || 0) + obj.amount;
          obj.collected = true;
          const msg = `Collected ${obj.amount} ${obj.resource}!`;
          gameState.gameLog.push(msg);
          results.push({ type: 'resource', message: msg });
        }
        break;

      case MAP_OBJECT_TYPES.TREASURE_CHEST:
        if (!obj.collected) {
          const player = gameState.players.find(p => p.id === hero.playerId);
          // Give gold by default
          player.resources.gold += obj.gold;
          hero.experience += obj.experience;
          obj.collected = true;
          checkLevelUp(hero);
          const msg = `Found treasure: ${obj.gold} gold and ${obj.experience} experience!`;
          gameState.gameLog.push(msg);
          results.push({ type: 'treasure', message: msg });
        }
        break;

      case MAP_OBJECT_TYPES.TOWN:
        if (obj.ownerId !== hero.playerId) {
          // Capture or interact with guarded neutral town
          const town = gameState.towns.find(t => t.x === obj.x && t.y === obj.y);
          if (town && obj.guardians && obj.guardians.length > 0) {
            // Must fight guardians
            return startCombatWithGuardians(gameState, hero, obj);
          }
          if (town) {
            town.ownerId = hero.playerId;
            obj.ownerId = hero.playerId;
            const msg = `Captured ${town.name}!`;
            gameState.gameLog.push(msg);
            results.push({ type: 'capture', message: msg });
          }
        }
        break;

      case MAP_OBJECT_TYPES.MINE_GOLD:
      case MAP_OBJECT_TYPES.MINE_WOOD:
      case MAP_OBJECT_TYPES.MINE_ORE:
      case MAP_OBJECT_TYPES.MINE_GEMS:
        if (obj.ownerId !== hero.playerId) {
          if (obj.guardians && obj.guardians.length > 0) {
            return startCombatWithGuardians(gameState, hero, obj);
          }
          obj.ownerId = hero.playerId;
          const msg = `Captured ${obj.name}!`;
          gameState.gameLog.push(msg);
          results.push({ type: 'capture', message: msg });
        }
        break;

      case MAP_OBJECT_TYPES.MONSTER_LAIR:
        if (obj.guardians && obj.guardians.length > 0) {
          return startCombatWithGuardians(gameState, hero, obj);
        }
        break;
    }
  }

  return results;
}

/**
 * Start combat with map guardians.
 */
function startCombatWithGuardians(gameState, hero, obj) {
  const guardianArmy = obj.guardians.map(g => createUnitStack(g.templateId, g.count));

  const combat = initCombat(hero, null, guardianArmy);
  gameState.combat = combat;
  gameState.combat.mapObject = obj;
  gameState.phase = GAME_PHASES.COMBAT;

  const msg = `Engaging guardians at ${obj.name}!`;
  gameState.gameLog.push(msg);

  return [{ type: 'combat', message: msg }];
}

/**
 * Start combat between two heroes.
 */
function startCombat(gameState, attackerHero, defenderHero) {
  const combat = initCombat(attackerHero, defenderHero, null);
  gameState.combat = combat;
  gameState.phase = GAME_PHASES.COMBAT;

  const msg = `${attackerHero.name} attacks ${defenderHero.name}!`;
  gameState.gameLog.push(msg);

  return { success: true, message: msg, type: 'combat' };
}

/**
 * Execute a combat action (attack, move, wait, defend, spell).
 */
export function executeCombatAction(gameState, action) {
  if (gameState.phase !== GAME_PHASES.COMBAT || !gameState.combat) return null;

  const combat = gameState.combat;
  const currentStack = getCurrentStack(combat);
  if (!currentStack) {
    advanceCombatTurn(combat);
    return { nextStack: getCurrentStack(combat) };
  }

  let result;

  switch (action.type) {
    case 'attack': {
      const target = combat.stacks.find(s =>
        s.gridX === action.targetX && s.gridY === action.targetY && s.count > 0
      );
      if (!target) return { error: 'No valid target' };
      result = attackAction(combat, currentStack, target);
      break;
    }

    case 'move': {
      const moved = moveStack(combat, currentStack, action.targetX, action.targetY);
      if (!moved) return { error: 'Cannot move there' };
      currentStack.hasActed = true;
      result = { moved: true };
      break;
    }

    case 'wait':
      waitAction(combat, currentStack);
      result = { waited: true };
      break;

    case 'defend':
      defendAction(combat, currentStack);
      result = { defended: true };
      break;

    case 'spell': {
      const spell = SPELLS[action.spellId];
      if (!spell) return { error: 'Unknown spell' };

      const hero = currentStack.side === 'attacker' ? combat.attackerHero : combat.defenderHero;
      const target = action.targetStack || combat.stacks.find(s =>
        s.gridX === action.targetX && s.gridY === action.targetY && s.count > 0
      );

      if (spell.type === 'damage') {
        const spellResult = castDamageSpell(spell, hero, target);
        if (spellResult && target) {
          Object.assign(target, applyDamageToStack(target, spellResult.damage));
        }
        result = spellResult;
      } else if (spell.type === 'buff' || spell.type === 'debuff') {
        result = castBuffSpell(spell, hero, target);
      } else if (spell.type === 'heal') {
        result = castHealSpell(spell, hero, target);
      }
      currentStack.hasActed = true;
      break;
    }
  }

  // Check for combat end and advance turn
  advanceCombatTurn(combat);

  if (combat.result !== COMBAT_RESULT.IN_PROGRESS) {
    resolveCombatEnd(gameState);
  }

  return { ...result, combatResult: combat.result, nextStack: getCurrentStack(combat) };
}

/**
 * Resolve the end of combat.
 */
function resolveCombatEnd(gameState) {
  const combat = gameState.combat;
  if (!combat) return;

  if (combat.result === COMBAT_RESULT.ATTACKER_WON) {
    // Update attacker hero's army with surviving units
    if (combat.attackerHero) {
      combat.attackerHero.army = combat.stacks
        .filter(s => s.side === 'attacker' && s.count > 0)
        .map(s => ({ ...s }));

      // Grant experience
      const expGained = combat.stacks
        .filter(s => s.side === 'defender')
        .reduce((sum, s) => sum + (s.tier || 1) * 100, 0);
      combat.attackerHero.experience += expGained;
      checkLevelUp(combat.attackerHero);
    }

    // Handle map object capture
    if (combat.mapObject) {
      combat.mapObject.guardians = null;
      if (combat.mapObject.ownerId !== undefined) {
        combat.mapObject.ownerId = combat.attackerHero?.playerId || null;
      }
      if (combat.mapObject.reward) {
        const player = gameState.players.find(p => p.id === combat.attackerHero?.playerId);
        if (player && combat.mapObject.reward.gold) {
          player.resources.gold += combat.mapObject.reward.gold;
          gameState.gameLog.push(`Earned ${combat.mapObject.reward.gold} gold!`);
        }
      }
      // Handle town capture
      const town = gameState.towns.find(t =>
        t.x === combat.mapObject.x && t.y === combat.mapObject.y
      );
      if (town && combat.attackerHero) {
        town.ownerId = combat.attackerHero.playerId;
        gameState.gameLog.push(`Captured ${town.name}!`);
      }
    }

    // Remove defeated hero
    if (combat.defenderHero) {
      const idx = gameState.heroes.indexOf(combat.defenderHero);
      if (idx >= 0) gameState.heroes.splice(idx, 1);
      gameState.gameLog.push(`${combat.defenderHero.name} has been defeated!`);
    }
  } else if (combat.result === COMBAT_RESULT.DEFENDER_WON) {
    // Update defender's army
    if (combat.defenderHero) {
      combat.defenderHero.army = combat.stacks
        .filter(s => s.side === 'defender' && s.count > 0)
        .map(s => ({ ...s }));
    }

    // Remove defeated attacker hero
    if (combat.attackerHero) {
      const idx = gameState.heroes.indexOf(combat.attackerHero);
      if (idx >= 0) gameState.heroes.splice(idx, 1);
      gameState.gameLog.push(`${combat.attackerHero.name} has been defeated!`);
    }
  }

  // Check win conditions
  checkWinCondition(gameState);

  gameState.combat = null;
  gameState.phase = gameState.winner ? GAME_PHASES.GAME_OVER : GAME_PHASES.ADVENTURE;
}

/**
 * Check if any player has won.
 */
function checkWinCondition(gameState) {
  for (const player of gameState.players) {
    const hasHeroes = gameState.heroes.some(h => h.playerId === player.id);
    const hasTowns = gameState.towns.some(t => t.ownerId === player.id);

    if (!hasHeroes && !hasTowns) {
      const winner = gameState.players.find(p => p.id !== player.id);
      gameState.winner = winner;
      gameState.gameLog.push(`${winner.name} wins the game!`);
      return;
    }
  }
}

/**
 * End the current player's turn.
 */
export function endTurn(gameState) {
  if (gameState.phase === GAME_PHASES.GAME_OVER) return;

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  // Advance to next player
  const currentIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayerId);
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  gameState.currentPlayerId = gameState.players[nextIndex].id;

  // If we've gone through all players, advance the turn
  if (nextIndex === 0) {
    gameState.turn++;
    gameState.gameLog.push(`--- Turn ${gameState.turn} ---`);

    // Weekly refresh (every 7 turns)
    if (gameState.turn % 7 === 0) {
      gameState.towns.forEach(town => refreshUnitPools(town));
      gameState.gameLog.push('New week! Creature dwellings have been refreshed.');
    }
  }

  // Apply income for new player
  const newPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  // Town income
  const playerTowns = gameState.towns.filter(t => t.ownerId === newPlayer.id);
  for (const town of playerTowns) {
    const income = getTownIncome(town);
    newPlayer.resources = addResources(newPlayer.resources, income);
  }

  // Mine income
  for (const obj of gameState.map.objects) {
    if (obj.ownerId === newPlayer.id) {
      if (obj.resource && obj.amount) {
        newPlayer.resources[obj.resource] = (newPlayer.resources[obj.resource] || 0) + obj.amount;
      }
    }
  }

  // Reset hero movement
  gameState.heroes
    .filter(h => h.playerId === newPlayer.id)
    .forEach(h => resetHeroForNewTurn(h));

  // Select first hero
  gameState.selectedHero = gameState.heroes.find(h => h.playerId === newPlayer.id) || null;

  // AI turn
  if (newPlayer.isAI) {
    const actions = executeAiTurn(gameState, newPlayer.id);
    if (actions) {
      for (const action of actions) {
        if (action.type === 'combat') {
          const attacker = gameState.heroes.find(h => h.id === action.heroId);
          const defender = gameState.heroes.find(h => h.id === action.targetHeroId);
          if (attacker && defender) {
            const combat = initCombat(attacker, defender, null);
            autoResolveCombat(combat);
            gameState.combat = combat;
            resolveCombatEnd(gameState);
          }
        }
      }
    }
    gameState.gameLog.push(`${newPlayer.name} completed their turn.`);

    // Auto-end AI turn and proceed back to human
    endTurn(gameState);
  }

  return gameState;
}

/**
 * Open town view for a town at the hero's location.
 */
export function openTownView(gameState, townX, townY) {
  const town = gameState.towns.find(t => t.x === townX && t.y === townY);
  if (!town) return null;
  if (town.ownerId !== gameState.currentPlayerId) return null;
  gameState.phase = GAME_PHASES.TOWN_VIEW;
  gameState.activeTown = town;
  return town;
}

/**
 * Close town view.
 */
export function closeTownView(gameState) {
  gameState.phase = GAME_PHASES.ADVENTURE;
  gameState.activeTown = null;
}

/**
 * Recruit units from town into hero.
 */
export function recruitFromTown(gameState, townX, townY, unitId, count) {
  const town = gameState.towns.find(t => t.x === townX && t.y === townY);
  if (!town || town.ownerId !== gameState.currentPlayerId) return null;

  const hero = gameState.heroes.find(h =>
    h.playerId === gameState.currentPlayerId &&
    Math.abs(h.x - townX) <= 1 && Math.abs(h.y - townY) <= 1
  );
  if (!hero) return { error: 'No hero at this town' };

  const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const result = recruitUnits(town, unitId, count, player.resources);
  if (!result) return { error: 'Cannot recruit' };

  player.resources = result.resources;
  addUnitsToArmy(hero, unitId, result.recruited);
  gameState.gameLog.push(`Recruited ${result.recruited} ${unitId}!`);

  return { success: true, recruited: result.recruited };
}

/**
 * Build in a town.
 */
export function buildInGameTown(gameState, townX, townY, buildingId) {
  const town = gameState.towns.find(t => t.x === townX && t.y === townY);
  if (!town || town.ownerId !== gameState.currentPlayerId) return null;

  const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const result = buildInTown(town, buildingId, player.resources);
  if (!result) return { error: 'Cannot build' };

  player.resources = result;
  gameState.gameLog.push(`Built ${buildingId} in ${town.name}!`);

  return { success: true };
}
