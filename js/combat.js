// ============================================================
// Tactical Combat System
// ============================================================

import { calculateDamage, applyDamageToStack, createUnitStack } from './units.js';

export const COMBAT_GRID_WIDTH = 15;
export const COMBAT_GRID_HEIGHT = 11;

export const COMBAT_RESULT = {
  ATTACKER_WON: 'ATTACKER_WON',
  DEFENDER_WON: 'DEFENDER_WON',
  IN_PROGRESS: 'IN_PROGRESS',
};

/**
 * Initialize a combat encounter.
 */
export function initCombat(attackerHero, defenderHero, defenderArmy) {
  const combat = {
    grid: createCombatGrid(),
    attackerHero,
    defenderHero,
    stacks: [],
    turnOrder: [],
    currentTurnIndex: 0,
    round: 1,
    result: COMBAT_RESULT.IN_PROGRESS,
    log: [],
  };

  // Place attacker stacks on left side
  const attackerArmy = attackerHero ? attackerHero.army : [];
  placeStacks(combat, attackerArmy, 'attacker', 0);

  // Place defender stacks on right side
  const defArmy = defenderHero ? defenderHero.army : (defenderArmy || []);
  placeStacks(combat, defArmy, 'defender', COMBAT_GRID_WIDTH - 1);

  // Calculate turn order based on speed
  calculateTurnOrder(combat);

  return combat;
}

function createCombatGrid() {
  const grid = [];
  for (let y = 0; y < COMBAT_GRID_HEIGHT; y++) {
    for (let x = 0; x < COMBAT_GRID_WIDTH; x++) {
      grid.push({ x, y, occupant: null, obstacle: false });
    }
  }
  return grid;
}

function placeStacks(combat, army, side, col) {
  const spacing = Math.max(1, Math.floor(COMBAT_GRID_HEIGHT / (army.length + 1)));

  army.forEach((stack, i) => {
    if (stack.count <= 0) return;

    const combatStack = {
      ...stack,
      side,
      gridX: col,
      gridY: Math.min(COMBAT_GRID_HEIGHT - 1, spacing * (i + 1)),
      hasActed: false,
      hasRetaliated: false,
      waitMode: false,
      defendMode: false,
    };

    combat.stacks.push(combatStack);
    const cell = getCombatCell(combat, combatStack.gridX, combatStack.gridY);
    if (cell) cell.occupant = combatStack;
  });
}

function calculateTurnOrder(combat) {
  const aliveStacks = combat.stacks.filter(s => s.count > 0);
  combat.turnOrder = aliveStacks.sort((a, b) => b.speed - a.speed);
  combat.currentTurnIndex = 0;

  // Reset acted flags
  for (const stack of combat.turnOrder) {
    stack.hasActed = false;
    stack.hasRetaliated = false;
  }
}

/**
 * Get a cell from the combat grid.
 */
export function getCombatCell(combat, x, y) {
  if (x < 0 || y < 0 || x >= COMBAT_GRID_WIDTH || y >= COMBAT_GRID_HEIGHT) return null;
  return combat.grid[y * COMBAT_GRID_WIDTH + x];
}

/**
 * Get the currently active stack.
 */
export function getCurrentStack(combat) {
  if (combat.result !== COMBAT_RESULT.IN_PROGRESS) return null;
  const alive = combat.turnOrder.filter(s => s.count > 0 && !s.hasActed);
  if (alive.length === 0) return null;
  return alive[0];
}

/**
 * Move a stack to a new position in combat.
 */
export function moveStack(combat, stack, targetX, targetY) {
  const cell = getCombatCell(combat, targetX, targetY);
  if (!cell || cell.occupant || cell.obstacle) return false;

  // Check distance (simplified - speed = max tiles)
  const dist = Math.abs(targetX - stack.gridX) + Math.abs(targetY - stack.gridY);
  const maxDist = stack.flying ? stack.speed * 2 : stack.speed;
  if (dist > maxDist) return false;

  // Clear old position
  const oldCell = getCombatCell(combat, stack.gridX, stack.gridY);
  if (oldCell) oldCell.occupant = null;

  stack.gridX = targetX;
  stack.gridY = targetY;
  cell.occupant = stack;

  return true;
}

/**
 * Execute an attack action.
 */
export function attackAction(combat, attackerStack, targetStack) {
  if (attackerStack.count <= 0 || targetStack.count <= 0) return null;
  if (attackerStack.side === targetStack.side) return null;

  const result = {
    attacker: attackerStack,
    target: targetStack,
    attackDamage: 0,
    retaliationDamage: 0,
    attackerKilled: 0,
    defenderKilled: 0,
    isRanged: false,
  };

  // Check if ranged attack
  const dist = Math.abs(attackerStack.gridX - targetStack.gridX) + Math.abs(attackerStack.gridY - targetStack.gridY);
  const isRanged = attackerStack.ranged && attackerStack.shotsLeft > 0 && dist > 1;

  if (!isRanged && dist > 2) {
    // Need to move adjacent first for melee
    const adjPos = findAdjacentPosition(combat, targetStack.gridX, targetStack.gridY, attackerStack);
    if (adjPos) {
      moveStack(combat, attackerStack, adjPos.x, adjPos.y);
    } else {
      return null; // Can't reach
    }
  }

  // Apply hero bonuses
  let atkBonus = 0;
  let defBonus = 0;
  if (combat.attackerHero && attackerStack.side === 'attacker') {
    atkBonus = combat.attackerHero.attack;
  } else if (combat.defenderHero && attackerStack.side === 'defender') {
    atkBonus = combat.defenderHero.attack;
  }
  if (combat.attackerHero && targetStack.side === 'attacker') {
    defBonus = combat.attackerHero.defense;
  } else if (combat.defenderHero && targetStack.side === 'defender') {
    defBonus = combat.defenderHero.defense;
  }

  // Temporarily boost stats
  const boostedAttacker = { ...attackerStack, attack: attackerStack.attack + atkBonus };
  const boostedTarget = { ...targetStack, defense: targetStack.defense + defBonus };

  // Calculate and apply damage
  const damage = calculateDamage(boostedAttacker, boostedTarget, isRanged);
  const defenderBefore = targetStack.count;
  const updatedTarget = applyDamageToStack(targetStack, damage);

  // Update target stack in combat
  Object.assign(targetStack, updatedTarget);
  result.attackDamage = damage;
  result.defenderKilled = defenderBefore - targetStack.count;
  result.isRanged = isRanged;

  if (isRanged) {
    attackerStack.shotsLeft--;
  }

  // Retaliation (if target is alive, hasn't already retaliated, and it's not ranged/noRetaliation)
  if (targetStack.count > 0 && !targetStack.hasRetaliated && !isRanged && !attackerStack.noRetaliation) {
    const retDamage = calculateDamage(boostedTarget, boostedAttacker, false);
    const attackerBefore = attackerStack.count;
    const updatedAttacker = applyDamageToStack(attackerStack, retDamage);
    Object.assign(attackerStack, updatedAttacker);
    result.retaliationDamage = retDamage;
    result.attackerKilled = attackerBefore - attackerStack.count;

    if (!targetStack.unlimitedRetaliation) {
      targetStack.hasRetaliated = true;
    }
  }

  // Mark attacker as having acted
  attackerStack.hasActed = true;

  // Update grid occupants
  if (targetStack.count <= 0) {
    const cell = getCombatCell(combat, targetStack.gridX, targetStack.gridY);
    if (cell) cell.occupant = null;
  }
  if (attackerStack.count <= 0) {
    const cell = getCombatCell(combat, attackerStack.gridX, attackerStack.gridY);
    if (cell) cell.occupant = null;
  }

  // Log the action
  combat.log.push(
    `${attackerStack.name} (${attackerStack.side}) deals ${damage} damage to ${targetStack.name}` +
    (result.defenderKilled > 0 ? `, killing ${result.defenderKilled}` : '') +
    (result.retaliationDamage > 0 ? `. ${targetStack.name} retaliates for ${result.retaliationDamage} damage` : '') +
    (result.attackerKilled > 0 ? `, killing ${result.attackerKilled}` : '')
  );

  // Check combat end
  checkCombatEnd(combat);

  return result;
}

function findAdjacentPosition(combat, tx, ty, stack) {
  const dirs = [
    { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 },
  ];

  let best = null;
  let bestDist = Infinity;

  for (const dir of dirs) {
    const nx = tx + dir.x;
    const ny = ty + dir.y;
    const cell = getCombatCell(combat, nx, ny);
    if (cell && !cell.occupant && !cell.obstacle) {
      const dist = Math.abs(nx - stack.gridX) + Math.abs(ny - stack.gridY);
      const maxDist = stack.flying ? stack.speed * 2 : stack.speed;
      if (dist <= maxDist && dist < bestDist) {
        best = { x: nx, y: ny };
        bestDist = dist;
      }
    }
  }

  return best;
}

/**
 * Wait action (delay turn).
 */
export function waitAction(combat, stack) {
  stack.waitMode = true;
  stack.hasActed = true;
  combat.log.push(`${stack.name} (${stack.side}) waits.`);
}

/**
 * Defend action (boost defense until next turn).
 */
export function defendAction(combat, stack) {
  stack.defendMode = true;
  stack.defense = Math.floor(stack.defense * 1.3);
  stack.hasActed = true;
  combat.log.push(`${stack.name} (${stack.side}) defends.`);
}

/**
 * Advance to the next combat turn.
 */
export function advanceCombatTurn(combat) {
  if (combat.result !== COMBAT_RESULT.IN_PROGRESS) return;

  const aliveNotActed = combat.turnOrder.filter(s => s.count > 0 && !s.hasActed);
  if (aliveNotActed.length === 0) {
    // New round
    combat.round++;
    calculateTurnOrder(combat);

    // Reset defend bonuses
    for (const stack of combat.stacks) {
      if (stack.defendMode) {
        stack.defense = Math.floor(stack.defense / 1.3);
        stack.defendMode = false;
      }
    }
  }
}

/**
 * Check if combat has ended.
 */
export function checkCombatEnd(combat) {
  const attackerAlive = combat.stacks.some(s => s.side === 'attacker' && s.count > 0);
  const defenderAlive = combat.stacks.some(s => s.side === 'defender' && s.count > 0);

  if (!attackerAlive) {
    combat.result = COMBAT_RESULT.DEFENDER_WON;
    combat.log.push('Defender wins the battle!');
  } else if (!defenderAlive) {
    combat.result = COMBAT_RESULT.ATTACKER_WON;
    combat.log.push('Attacker wins the battle!');
  }

  return combat.result;
}

/**
 * Auto-resolve combat (simplified quick battle).
 */
export function autoResolveCombat(combat) {
  let maxRounds = 100;
  while (combat.result === COMBAT_RESULT.IN_PROGRESS && maxRounds > 0) {
    const stack = getCurrentStack(combat);
    if (!stack) {
      advanceCombatTurn(combat);
      maxRounds--;
      continue;
    }

    // Find best target
    const enemies = combat.stacks.filter(s => s.side !== stack.side && s.count > 0);
    if (enemies.length === 0) {
      checkCombatEnd(combat);
      break;
    }

    // Pick closest enemy
    const target = enemies.sort((a, b) => {
      const distA = Math.abs(a.gridX - stack.gridX) + Math.abs(a.gridY - stack.gridY);
      const distB = Math.abs(b.gridX - stack.gridX) + Math.abs(b.gridY - stack.gridY);
      return distA - distB;
    })[0];

    const dist = Math.abs(target.gridX - stack.gridX) + Math.abs(target.gridY - stack.gridY);

    // Try attack if in range (adjacent or within move+attack range)
    const result = attackAction(combat, stack, target);

    if (!result) {
      // Can't attack - move towards target instead
      const maxDist = stack.flying ? stack.speed * 2 : stack.speed;
      const dx = target.gridX - stack.gridX;
      const dy = target.gridY - stack.gridY;
      const stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
      const stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

      let moved = false;
      // Try to move as far as possible toward the target
      for (let steps = maxDist; steps >= 1; steps--) {
        const newX = stack.gridX + stepX * steps;
        const newY = stack.gridY + stepY * Math.min(steps, Math.abs(dy));
        const clampedX = Math.max(0, Math.min(COMBAT_GRID_WIDTH - 1, newX));
        const clampedY = Math.max(0, Math.min(COMBAT_GRID_HEIGHT - 1, newY));
        if (moveStack(combat, stack, clampedX, clampedY)) {
          moved = true;
          break;
        }
      }

      // If diagonal didn't work, try just horizontal or vertical
      if (!moved) {
        for (let steps = maxDist; steps >= 1; steps--) {
          const newX = Math.max(0, Math.min(COMBAT_GRID_WIDTH - 1, stack.gridX + stepX * steps));
          if (moveStack(combat, stack, newX, stack.gridY)) {
            moved = true;
            break;
          }
        }
      }
      if (!moved) {
        for (let steps = maxDist; steps >= 1; steps--) {
          const newY = Math.max(0, Math.min(COMBAT_GRID_HEIGHT - 1, stack.gridY + stepY * steps));
          if (moveStack(combat, stack, stack.gridX, newY)) {
            moved = true;
            break;
          }
        }
      }

      stack.hasActed = true;
    }

    advanceCombatTurn(combat);
    maxRounds--;
  }

  return combat;
}
