// ============================================================
// Adventure Map System
// ============================================================

export const TERRAIN_TYPES = {
  GRASS: { id: 'GRASS', name: 'Grass', color: '#4a8c3f', moveCost: 1, passable: true, symbol: '.' },
  FOREST: { id: 'FOREST', name: 'Forest', color: '#2d5a27', moveCost: 2, passable: true, symbol: '♣' },
  MOUNTAIN: { id: 'MOUNTAIN', name: 'Mountain', color: '#8b7355', moveCost: 999, passable: false, symbol: '▲' },
  WATER: { id: 'WATER', name: 'Water', color: '#2266aa', moveCost: 999, passable: false, symbol: '~' },
  SAND: { id: 'SAND', name: 'Sand', color: '#c2b280', moveCost: 2, passable: true, symbol: ':' },
  ROAD: { id: 'ROAD', name: 'Road', color: '#a0906a', moveCost: 0.5, passable: true, symbol: '=' },
  SWAMP: { id: 'SWAMP', name: 'Swamp', color: '#4a6741', moveCost: 3, passable: true, symbol: '≈' },
  SNOW: { id: 'SNOW', name: 'Snow', color: '#e8e8e8', moveCost: 2, passable: true, symbol: '*' },
};

export const MAP_OBJECT_TYPES = {
  TOWN: 'TOWN',
  MINE_GOLD: 'MINE_GOLD',
  MINE_WOOD: 'MINE_WOOD',
  MINE_ORE: 'MINE_ORE',
  MINE_GEMS: 'MINE_GEMS',
  RESOURCE_PILE: 'RESOURCE_PILE',
  MONSTER_LAIR: 'MONSTER_LAIR',
  ARTIFACT: 'ARTIFACT',
  TREASURE_CHEST: 'TREASURE_CHEST',
};

/**
 * Generate the adventure map.
 */
export function generateMap(width, height, seed) {
  const map = {
    width,
    height,
    tiles: [],
    objects: [],
  };

  // Simple seeded RNG
  let rng = seed || 42;
  function random() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return (rng >> 16) / 32767;
  }

  // Generate terrain using simple noise
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = random();
      let terrain;

      // Create border of water/mountains
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        terrain = TERRAIN_TYPES.WATER;
      } else if (x === 1 || y === 1 || x === width - 2 || y === height - 2) {
        terrain = random() < 0.5 ? TERRAIN_TYPES.WATER : TERRAIN_TYPES.MOUNTAIN;
      } else if (r < 0.55) {
        terrain = TERRAIN_TYPES.GRASS;
      } else if (r < 0.72) {
        terrain = TERRAIN_TYPES.FOREST;
      } else if (r < 0.82) {
        terrain = TERRAIN_TYPES.SAND;
      } else if (r < 0.88) {
        terrain = TERRAIN_TYPES.MOUNTAIN;
      } else if (r < 0.93) {
        terrain = TERRAIN_TYPES.WATER;
      } else if (r < 0.97) {
        terrain = TERRAIN_TYPES.SWAMP;
      } else {
        terrain = TERRAIN_TYPES.SNOW;
      }

      map.tiles.push({
        x,
        y,
        terrain: terrain.id,
        explored: false,
        visible: false,
      });
    }
  }

  // Ensure starting positions are passable
  clearArea(map, 3, 3, 3);
  clearArea(map, width - 4, height - 4, 3);

  // Add roads between towns
  addRoad(map, 3, 3, Math.floor(width / 2), Math.floor(height / 2));
  addRoad(map, width - 4, height - 4, Math.floor(width / 2), Math.floor(height / 2));

  // Place map objects
  placeMapObjects(map, random);

  return map;
}

function clearArea(map, cx, cy, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tile = getTile(map, cx + dx, cy + dy);
      if (tile) tile.terrain = TERRAIN_TYPES.GRASS.id;
    }
  }
}

function addRoad(map, x1, y1, x2, y2) {
  let x = x1;
  let y = y1;
  while (x !== x2 || y !== y2) {
    const tile = getTile(map, x, y);
    if (tile && tile.terrain !== TERRAIN_TYPES.WATER.id) {
      tile.terrain = TERRAIN_TYPES.ROAD.id;
    }
    if (x < x2) x++;
    else if (x > x2) x--;
    if (y < y2) y++;
    else if (y > y2) y--;
  }
}

function placeMapObjects(map, random) {
  const w = map.width;
  const h = map.height;

  // Player 1 town (top-left area)
  map.objects.push({
    type: MAP_OBJECT_TYPES.TOWN,
    x: 3, y: 3,
    ownerId: 1,
    faction: 'Castle',
    symbol: '🏰',
    name: 'Steadwick',
  });

  // Player 2 town (bottom-right area)
  map.objects.push({
    type: MAP_OBJECT_TYPES.TOWN,
    x: w - 4, y: h - 4,
    ownerId: 2,
    faction: 'Inferno',
    symbol: '🏰',
    name: 'Kreelah',
  });

  // Neutral town in center
  map.objects.push({
    type: MAP_OBJECT_TYPES.TOWN,
    x: Math.floor(w / 2), y: Math.floor(h / 2),
    ownerId: null,
    faction: 'Necropolis',
    symbol: '🏚',
    name: 'Deyja',
    guardians: [{ templateId: 'SKELETON', count: 30 }, { templateId: 'ZOMBIE', count: 15 }],
  });

  // Scatter resource mines
  const mineTypes = [
    { type: MAP_OBJECT_TYPES.MINE_GOLD, resource: 'gold', amount: 1000, symbol: '⛏', name: 'Gold Mine' },
    { type: MAP_OBJECT_TYPES.MINE_WOOD, resource: 'wood', amount: 2, symbol: '🪓', name: 'Sawmill' },
    { type: MAP_OBJECT_TYPES.MINE_ORE, resource: 'ore', amount: 2, symbol: '⛏', name: 'Ore Mine' },
    { type: MAP_OBJECT_TYPES.MINE_GEMS, resource: 'gems', amount: 1, symbol: '💎', name: 'Gem Mine' },
  ];

  for (let i = 0; i < 8; i++) {
    const mine = mineTypes[i % mineTypes.length];
    let x, y, attempts = 0;
    do {
      x = 3 + Math.floor(random() * (w - 6));
      y = 3 + Math.floor(random() * (h - 6));
      attempts++;
    } while (attempts < 50 && (!isPassable(map, x, y) || hasObjectAt(map, x, y)));

    if (attempts < 50) {
      map.objects.push({
        ...mine,
        x, y,
        ownerId: null,
        guardians: i > 3 ? [{ templateId: 'ORC', count: 5 + Math.floor(random() * 10) }] : null,
      });
    }
  }

  // Scatter resource piles
  for (let i = 0; i < 12; i++) {
    let x, y, attempts = 0;
    do {
      x = 2 + Math.floor(random() * (w - 4));
      y = 2 + Math.floor(random() * (h - 4));
      attempts++;
    } while (attempts < 50 && (!isPassable(map, x, y) || hasObjectAt(map, x, y)));

    if (attempts < 50) {
      const resources = ['gold', 'wood', 'ore', 'gems'];
      const res = resources[Math.floor(random() * resources.length)];
      const amounts = { gold: 500 + Math.floor(random() * 1500), wood: 3 + Math.floor(random() * 7), ore: 3 + Math.floor(random() * 7), gems: 1 + Math.floor(random() * 3) };
      map.objects.push({
        type: MAP_OBJECT_TYPES.RESOURCE_PILE,
        x, y,
        resource: res,
        amount: amounts[res],
        symbol: res === 'gold' ? '💰' : res === 'wood' ? '🪵' : res === 'ore' ? '🪨' : '💎',
        name: `${res.charAt(0).toUpperCase() + res.slice(1)} Pile`,
        collected: false,
      });
    }
  }

  // Scatter monster lairs
  for (let i = 0; i < 6; i++) {
    let x, y, attempts = 0;
    do {
      x = 3 + Math.floor(random() * (w - 6));
      y = 3 + Math.floor(random() * (h - 6));
      attempts++;
    } while (attempts < 50 && (!isPassable(map, x, y) || hasObjectAt(map, x, y)));

    if (attempts < 50) {
      const monsters = [
        { templateId: 'WOLF', count: 10 + Math.floor(random() * 20) },
        { templateId: 'ORC', count: 8 + Math.floor(random() * 12) },
        { templateId: 'OGRE', count: 3 + Math.floor(random() * 5) },
      ];
      const monster = monsters[Math.floor(random() * monsters.length)];
      map.objects.push({
        type: MAP_OBJECT_TYPES.MONSTER_LAIR,
        x, y,
        guardians: [monster],
        symbol: '⚠',
        name: 'Monster Lair',
        reward: { gold: 500 + Math.floor(random() * 2000) },
      });
    }
  }

  // Treasure chests
  for (let i = 0; i < 8; i++) {
    let x, y, attempts = 0;
    do {
      x = 2 + Math.floor(random() * (w - 4));
      y = 2 + Math.floor(random() * (h - 4));
      attempts++;
    } while (attempts < 50 && (!isPassable(map, x, y) || hasObjectAt(map, x, y)));

    if (attempts < 50) {
      map.objects.push({
        type: MAP_OBJECT_TYPES.TREASURE_CHEST,
        x, y,
        symbol: '📦',
        name: 'Treasure Chest',
        gold: 1000 + Math.floor(random() * 3000),
        experience: 500 + Math.floor(random() * 1500),
        collected: false,
      });
    }
  }
}

/**
 * Get tile at position.
 */
export function getTile(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
  return map.tiles[y * map.width + x];
}

/**
 * Check if a tile is passable.
 */
export function isPassable(map, x, y) {
  const tile = getTile(map, x, y);
  if (!tile) return false;
  const terrain = TERRAIN_TYPES[tile.terrain];
  return terrain && terrain.passable;
}

/**
 * Check if there is a map object at position.
 */
export function hasObjectAt(map, x, y) {
  return map.objects.some(obj => obj.x === x && obj.y === y);
}

/**
 * Get all objects at position.
 */
export function getObjectsAt(map, x, y) {
  return map.objects.filter(obj => obj.x === x && obj.y === y);
}

/**
 * Get move cost for a tile.
 */
export function getMoveCost(map, x, y) {
  const tile = getTile(map, x, y);
  if (!tile) return 999;
  const terrain = TERRAIN_TYPES[tile.terrain];
  return terrain ? terrain.moveCost : 999;
}

/**
 * Update visibility around a position (fog of war).
 */
export function updateVisibility(map, x, y, radius, playerId) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        const tile = getTile(map, x + dx, y + dy);
        if (tile) {
          tile.explored = true;
          tile.visible = true;
          tile.visibleTo = tile.visibleTo || {};
          tile.visibleTo[playerId] = true;
        }
      }
    }
  }
}

/**
 * Simple pathfinding (BFS) to find shortest path.
 */
export function findPath(map, startX, startY, endX, endY) {
  if (!isPassable(map, endX, endY)) return null;

  const visited = new Set();
  const queue = [{ x: startX, y: startY, path: [], cost: 0 }];
  visited.add(`${startX},${startY}`);

  const dirs = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
    { dx: 1, dy: -1 }, { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }, { dx: -1, dy: -1 },
  ];

  while (queue.length > 0) {
    // Sort by cost for Dijkstra-like behavior
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();

    if (current.x === endX && current.y === endY) {
      return { path: current.path, cost: current.cost };
    }

    for (const dir of dirs) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = `${nx},${ny}`;

      if (!visited.has(key) && isPassable(map, nx, ny)) {
        visited.add(key);
        const moveCost = getMoveCost(map, nx, ny);
        queue.push({
          x: nx, y: ny,
          path: [...current.path, { x: nx, y: ny }],
          cost: current.cost + moveCost,
        });
      }
    }
  }

  return null; // No path found
}
