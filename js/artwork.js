// ============================================================
// Procedural Artwork Generation System
// Generates all game sprites as offscreen canvases
// ============================================================

/**
 * SpriteCache stores pre-rendered sprites as offscreen canvases.
 */
export class SpriteCache {
  constructor() {
    this.cache = new Map();
    this.generated = false;
  }

  /**
   * Generate all game artwork. Call once at startup.
   */
  generateAll(tileSize, combatCellSize) {
    this.tileSize = tileSize;
    this.combatCellSize = combatCellSize;
    this.generateTerrainSprites(tileSize);
    this.generateMapObjectSprites(tileSize);
    this.generateHeroSprites(tileSize);
    this.generateUnitSprites(combatCellSize);
    this.generated = true;
  }

  get(key) {
    return this.cache.get(key);
  }

  /**
   * Create an offscreen canvas of given size and draw on it.
   */
  createSprite(key, width, height, drawFn) {
    // Use OffscreenCanvas when available (modern browsers), or fall back
    // to document.createElement for older browsers / test environments (jsdom)
    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : createFallbackCanvas(width, height);
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    this.cache.set(key, canvas);
    return canvas;
  }

  // =========================================================
  // Terrain Sprites
  // =========================================================

  generateTerrainSprites(size) {
    this.createSprite('terrain_GRASS', size, size, (ctx, w, h) => {
      drawGrass(ctx, w, h);
    });
    this.createSprite('terrain_FOREST', size, size, (ctx, w, h) => {
      drawForest(ctx, w, h);
    });
    this.createSprite('terrain_MOUNTAIN', size, size, (ctx, w, h) => {
      drawMountain(ctx, w, h);
    });
    this.createSprite('terrain_WATER', size, size, (ctx, w, h) => {
      drawWater(ctx, w, h);
    });
    this.createSprite('terrain_SAND', size, size, (ctx, w, h) => {
      drawSand(ctx, w, h);
    });
    this.createSprite('terrain_ROAD', size, size, (ctx, w, h) => {
      drawRoad(ctx, w, h);
    });
    this.createSprite('terrain_SWAMP', size, size, (ctx, w, h) => {
      drawSwamp(ctx, w, h);
    });
    this.createSprite('terrain_SNOW', size, size, (ctx, w, h) => {
      drawSnow(ctx, w, h);
    });
  }

  // =========================================================
  // Map Object Sprites
  // =========================================================

  generateMapObjectSprites(size) {
    this.createSprite('obj_TOWN_neutral', size + 8, size + 8, (ctx, w, h) => {
      drawTownSprite(ctx, w, h, '#aaaaaa');
    });
    this.createSprite('obj_TOWN_player1', size + 8, size + 8, (ctx, w, h) => {
      drawTownSprite(ctx, w, h, '#4488ff');
    });
    this.createSprite('obj_TOWN_player2', size + 8, size + 8, (ctx, w, h) => {
      drawTownSprite(ctx, w, h, '#ff4444');
    });
    this.createSprite('obj_MINE_GOLD', size, size, (ctx, w, h) => {
      drawMineSprite(ctx, w, h, '#ffd700');
    });
    this.createSprite('obj_MINE_WOOD', size, size, (ctx, w, h) => {
      drawMineSprite(ctx, w, h, '#8b4513');
    });
    this.createSprite('obj_MINE_ORE', size, size, (ctx, w, h) => {
      drawMineSprite(ctx, w, h, '#808080');
    });
    this.createSprite('obj_MINE_GEMS', size, size, (ctx, w, h) => {
      drawMineSprite(ctx, w, h, '#ff69b4');
    });
    this.createSprite('obj_RESOURCE_PILE', size, size, (ctx, w, h) => {
      drawResourcePileSprite(ctx, w, h);
    });
    this.createSprite('obj_TREASURE_CHEST', size, size, (ctx, w, h) => {
      drawTreasureChestSprite(ctx, w, h);
    });
    this.createSprite('obj_MONSTER_LAIR', size, size, (ctx, w, h) => {
      drawMonsterLairSprite(ctx, w, h);
    });
  }

  // =========================================================
  // Hero Sprites
  // =========================================================

  generateHeroSprites(size) {
    this.createSprite('hero_KNIGHT', size, size, (ctx, w, h) => {
      drawHeroSprite(ctx, w, h, '#4488ff', 'knight');
    });
    this.createSprite('hero_WARLOCK', size, size, (ctx, w, h) => {
      drawHeroSprite(ctx, w, h, '#ff4444', 'warlock');
    });
    this.createSprite('hero_NECROMANCER', size, size, (ctx, w, h) => {
      drawHeroSprite(ctx, w, h, '#884488', 'necromancer');
    });
  }

  // =========================================================
  // Unit Sprites (for combat grid)
  // =========================================================

  generateUnitSprites(size) {
    const units = {
      PEASANT:     { color: '#aaaaaa', type: 'humanoid', weapon: 'pitchfork' },
      ARCHER:      { color: '#44aa44', type: 'humanoid', weapon: 'bow' },
      GRIFFIN:      { color: '#ddaa33', type: 'flying', wings: true },
      SWORDSMAN:   { color: '#4488cc', type: 'humanoid', weapon: 'sword', shield: true },
      CAVALIER:    { color: '#cc8844', type: 'mounted' },
      ANGEL:       { color: '#ffdd44', type: 'flying', wings: true, halo: true },
      IMP:         { color: '#ff4444', type: 'flying', small: true },
      DEMON:       { color: '#cc2222', type: 'humanoid', weapon: 'trident' },
      PIT_FIEND:   { color: '#aa0000', type: 'humanoid', horns: true },
      DEVIL:       { color: '#ff0000', type: 'flying', wings: true, horns: true },
      SKELETON:    { color: '#bbbbaa', type: 'undead', weapon: 'sword' },
      ZOMBIE:      { color: '#669966', type: 'undead' },
      VAMPIRE:     { color: '#880044', type: 'flying', cape: true },
      BONE_DRAGON: { color: '#aaaa88', type: 'dragon' },
      WOLF:        { color: '#886644', type: 'beast' },
      ORC:         { color: '#448844', type: 'humanoid', weapon: 'axe' },
      OGRE:        { color: '#886622', type: 'humanoid', large: true },
      DRAGON:      { color: '#ff4400', type: 'dragon' },
    };

    for (const [id, config] of Object.entries(units)) {
      this.createSprite(`unit_${id}`, size, size, (ctx, w, h) => {
        drawUnitSprite(ctx, w, h, config);
      });
    }
  }
}

// ============================================================
// Fallback canvas for environments without OffscreenCanvas
// ============================================================

function createFallbackCanvas(width, height) {
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const testCtx = canvas.getContext('2d');
      if (testCtx) {
        return canvas;
      }
    } catch (_) {
      // Canvas not supported in this environment
    }
  }
  // For test environments or when canvas is unsupported, return a mock
  return { width, height, getContext: () => createMockContext() };
}

function createMockContext() {
  const noop = () => {};
  return new Proxy({}, {
    get: () => noop,
    set: () => true,
  });
}

// ============================================================
// Seeded random for consistent procedural generation
// ============================================================

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >> 16) / 32767;
  };
}

// ============================================================
// Terrain Drawing Functions
// ============================================================

function drawGrass(ctx, w, h) {
  // Base green
  ctx.fillStyle = '#4a8c3f';
  ctx.fillRect(0, 0, w, h);

  // Grass variation patches
  const rng = seededRandom(42);
  for (let i = 0; i < 6; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 3 + rng() * 5;
    ctx.fillStyle = rng() > 0.5 ? '#55993a' : '#3d7a32';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass blades
  ctx.strokeStyle = '#5aaa48';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x = 2 + rng() * (w - 4);
    const y = 4 + rng() * (h - 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 1, y - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x + 3, y - 3);
    ctx.stroke();
  }
}

function drawForest(ctx, w, h) {
  // Ground
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, w, h);

  const rng = seededRandom(99);

  // Undergrowth
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#264f21';
    const x = rng() * w;
    const y = rng() * h;
    ctx.beginPath();
    ctx.arc(x, y, 4 + rng() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tree trunks
  ctx.fillStyle = '#4a3520';
  const treeX1 = w * 0.3;
  const treeX2 = w * 0.7;
  ctx.fillRect(treeX1 - 1, h * 0.4, 3, h * 0.45);
  ctx.fillRect(treeX2 - 1, h * 0.5, 3, h * 0.35);

  // Tree canopies
  ctx.fillStyle = '#1d6618';
  drawTriangle(ctx, treeX1, h * 0.1, 10, 12);
  ctx.fillStyle = '#228822';
  drawTriangle(ctx, treeX1, h * 0.22, 8, 10);

  ctx.fillStyle = '#1d6618';
  drawTriangle(ctx, treeX2, h * 0.2, 9, 11);
  ctx.fillStyle = '#228822';
  drawTriangle(ctx, treeX2, h * 0.32, 7, 9);
}

function drawMountain(ctx, w, h) {
  // Base rock
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 0, w, h);

  // Mountain shape
  ctx.fillStyle = '#9a8565';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h);
  ctx.lineTo(w * 0.5, h * 0.1);
  ctx.lineTo(w * 0.9, h);
  ctx.closePath();
  ctx.fill();

  // Shadow side
  ctx.fillStyle = '#7a6545';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.1);
  ctx.lineTo(w * 0.9, h);
  ctx.lineTo(w * 0.5, h);
  ctx.closePath();
  ctx.fill();

  // Snow cap
  ctx.fillStyle = '#e8e0d8';
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.35);
  ctx.lineTo(w * 0.5, h * 0.1);
  ctx.lineTo(w * 0.65, h * 0.35);
  ctx.lineTo(w * 0.55, h * 0.3);
  ctx.lineTo(w * 0.45, h * 0.33);
  ctx.closePath();
  ctx.fill();

  // Rocky texture
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  const rng = seededRandom(77);
  for (let i = 0; i < 5; i++) {
    const x = w * 0.2 + rng() * w * 0.6;
    const y = h * 0.4 + rng() * h * 0.5;
    ctx.fillRect(x, y, 2 + rng() * 3, 1 + rng() * 2);
  }
}

function drawWater(ctx, w, h) {
  // Deep water
  ctx.fillStyle = '#2266aa';
  ctx.fillRect(0, 0, w, h);

  // Wave patterns
  ctx.strokeStyle = '#3377bb';
  ctx.lineWidth = 1;
  for (let row = 0; row < 3; row++) {
    const y = h * 0.25 + row * h * 0.25;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.5 + row) * 2);
    }
    ctx.stroke();
  }

  // Light reflection
  ctx.fillStyle = 'rgba(100,180,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(w * 0.4, h * 0.35, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.6, h * 0.65, 3, 1.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSand(ctx, w, h) {
  // Base sand color
  ctx.fillStyle = '#c2b280';
  ctx.fillRect(0, 0, w, h);

  // Sand texture dots
  const rng = seededRandom(55);
  for (let i = 0; i < 12; i++) {
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillStyle = rng() > 0.5 ? '#d0c090' : '#b4a470';
    ctx.fillRect(x, y, 1, 1);
  }

  // Dune lines
  ctx.strokeStyle = '#b0a070';
  ctx.lineWidth = 0.5;
  for (let row = 0; row < 2; row++) {
    const y = h * 0.3 + row * h * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 3) {
      ctx.lineTo(x, y + Math.sin(x * 0.3 + row * 2) * 1.5);
    }
    ctx.stroke();
  }
}

function drawRoad(ctx, w, h) {
  // Dirt base
  ctx.fillStyle = '#8a7a5a';
  ctx.fillRect(0, 0, w, h);

  // Road center (lighter)
  ctx.fillStyle = '#a0906a';
  ctx.fillRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);

  // Cobblestone pattern
  ctx.strokeStyle = '#786840';
  ctx.lineWidth = 0.5;
  const rng = seededRandom(33);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = w * 0.18 + col * (w * 0.65 / 4);
      const y = h * 0.18 + row * (h * 0.65 / 4);
      const sw = w * 0.15 - 1;
      const sh = h * 0.15 - 1;
      ctx.strokeRect(x + rng() * 2, y + rng() * 2, sw, sh);
    }
  }
}

function drawSwamp(ctx, w, h) {
  // Muddy green base
  ctx.fillStyle = '#4a6741';
  ctx.fillRect(0, 0, w, h);

  // Murky water puddles
  const rng = seededRandom(66);
  for (let i = 0; i < 3; i++) {
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillStyle = 'rgba(40,80,50,0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y, 5 + rng() * 4, 3 + rng() * 3, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dead vegetation
  ctx.strokeStyle = '#5a7a48';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const x = 3 + rng() * (w - 6);
    const y = h * 0.6 + rng() * (h * 0.3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 4, y - 5 - rng() * 4);
    ctx.stroke();
  }

  // Bubbles
  ctx.fillStyle = 'rgba(80,120,80,0.4)';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(rng() * w, rng() * h, 1 + rng(), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSnow(ctx, w, h) {
  // White base
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, w, h);

  // Snow texture / slight shadows
  const rng = seededRandom(88);
  for (let i = 0; i < 8; i++) {
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillStyle = rng() > 0.5 ? '#f0f0f5' : '#d8d8e0';
    ctx.beginPath();
    ctx.arc(x, y, 2 + rng() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparkle highlights
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillRect(x, y, 1, 1);
  }

  // Wind drift lines
  ctx.strokeStyle = '#d0d0d8';
  ctx.lineWidth = 0.5;
  const y = h * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= w; x += 3) {
    ctx.lineTo(x, y + Math.sin(x * 0.4) * 1);
  }
  ctx.stroke();
}

// ============================================================
// Map Object Drawing Functions
// ============================================================

function drawTownSprite(ctx, w, h, color) {
  const cx = w / 2;

  // Castle base wall
  ctx.fillStyle = '#6a6a7a';
  ctx.fillRect(cx - w * 0.35, h * 0.45, w * 0.7, h * 0.45);

  // Castle gate
  ctx.fillStyle = '#3a3a4a';
  ctx.beginPath();
  ctx.arc(cx, h * 0.75, w * 0.1, Math.PI, 0);
  ctx.fillRect(cx - w * 0.1, h * 0.75, w * 0.2, h * 0.15);
  ctx.fill();

  // Left tower
  ctx.fillStyle = '#7a7a8a';
  ctx.fillRect(cx - w * 0.35, h * 0.25, w * 0.18, h * 0.65);
  // Battlement
  ctx.fillRect(cx - w * 0.38, h * 0.22, w * 0.08, h * 0.08);
  ctx.fillRect(cx - w * 0.22, h * 0.22, w * 0.08, h * 0.08);

  // Right tower
  ctx.fillRect(cx + w * 0.17, h * 0.25, w * 0.18, h * 0.65);
  ctx.fillRect(cx + w * 0.14, h * 0.22, w * 0.08, h * 0.08);
  ctx.fillRect(cx + w * 0.30, h * 0.22, w * 0.08, h * 0.08);

  // Center tower (tallest)
  ctx.fillStyle = '#8a8a9a';
  ctx.fillRect(cx - w * 0.08, h * 0.1, w * 0.16, h * 0.55);

  // Tower roof
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.02);
  ctx.lineTo(cx + w * 0.12, h * 0.12);
  ctx.lineTo(cx - w * 0.12, h * 0.12);
  ctx.closePath();
  ctx.fill();

  // Flag
  ctx.fillStyle = color;
  ctx.fillRect(cx - 1, h * 0.0, 2, h * 0.06);
  ctx.fillRect(cx + 1, h * 0.0, w * 0.08, h * 0.04);

  // Windows
  ctx.fillStyle = '#ffdd66';
  ctx.fillRect(cx - 3, h * 0.18, 2, 3);
  ctx.fillRect(cx + 1, h * 0.18, 2, 3);
}

function drawMineSprite(ctx, w, h, color) {
  // Mine entrance
  ctx.fillStyle = '#5a5040';
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h);
  ctx.lineTo(w * 0.5, h * 0.15);
  ctx.lineTo(w * 0.85, h);
  ctx.closePath();
  ctx.fill();

  // Dark opening
  ctx.fillStyle = '#1a1510';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.65, w * 0.18, Math.PI, 0);
  ctx.fillRect(w * 0.32, h * 0.65, w * 0.36, h * 0.2);
  ctx.fill();

  // Support beams
  ctx.strokeStyle = '#6a5530';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.85);
  ctx.lineTo(w * 0.32, h * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.68, h * 0.85);
  ctx.lineTo(w * 0.68, h * 0.5);
  ctx.stroke();

  // Resource indicator
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.35, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawResourcePileSprite(ctx, w, h) {
  // Small sack/pile
  ctx.fillStyle = '#8a7a5a';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.6, w * 0.3, h * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sack tie
  ctx.strokeStyle = '#6a5a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.38);
  ctx.lineTo(w * 0.5, h * 0.32);
  ctx.lineTo(w * 0.55, h * 0.38);
  ctx.stroke();

  // Sparkle
  ctx.fillStyle = '#ffd700';
  drawStar(ctx, w * 0.5, h * 0.5, 3, 4);
}

function drawTreasureChestSprite(ctx, w, h) {
  // Chest body
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(w * 0.15, h * 0.4, w * 0.7, h * 0.45);

  // Chest lid (open)
  ctx.fillStyle = '#9a6a3b';
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.42);
  ctx.lineTo(w * 0.2, h * 0.2);
  ctx.lineTo(w * 0.8, h * 0.2);
  ctx.lineTo(w * 0.88, h * 0.42);
  ctx.closePath();
  ctx.fill();

  // Metal bands
  ctx.strokeStyle = '#aa8833';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w * 0.15, h * 0.4, w * 0.7, h * 0.45);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.4);
  ctx.lineTo(w * 0.5, h * 0.85);
  ctx.stroke();

  // Lock/clasp
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, 3, 0, Math.PI * 2);
  ctx.fill();

  // Gold glow inside
  ctx.fillStyle = 'rgba(255,215,0,0.4)';
  ctx.fillRect(w * 0.2, h * 0.25, w * 0.6, h * 0.15);
}

function drawMonsterLairSprite(ctx, w, h) {
  // Cave entrance
  ctx.fillStyle = '#4a4035';
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h);
  ctx.lineTo(w * 0.3, h * 0.15);
  ctx.lineTo(w * 0.7, h * 0.1);
  ctx.lineTo(w * 0.95, h);
  ctx.closePath();
  ctx.fill();

  // Dark cave opening
  ctx.fillStyle = '#1a1210';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.65, w * 0.22, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes inside
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(w * 0.4, h * 0.58, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.6, h * 0.58, 2, 0, Math.PI * 2);
  ctx.fill();

  // Skull near entrance
  ctx.fillStyle = '#ccccaa';
  ctx.beginPath();
  ctx.arc(w * 0.28, h * 0.82, 3, 0, Math.PI * 2);
  ctx.fill();
  // Eye sockets
  ctx.fillStyle = '#1a1210';
  ctx.fillRect(w * 0.24, h * 0.8, 1.5, 1.5);
  ctx.fillRect(w * 0.30, h * 0.8, 1.5, 1.5);
}

// ============================================================
// Hero Drawing Functions
// ============================================================

function drawHeroSprite(ctx, w, h, color, type) {
  const cx = w / 2;
  const cy = h / 2;

  // Shield/banner background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.38);
  ctx.lineTo(cx + w * 0.32, cy);
  ctx.lineTo(cx, cy + h * 0.38);
  ctx.lineTo(cx - w * 0.32, cy);
  ctx.closePath();
  ctx.fill();

  // Inner diamond
  ctx.fillStyle = shadeColor(color, -30);
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.25);
  ctx.lineTo(cx + w * 0.2, cy);
  ctx.lineTo(cx, cy + h * 0.25);
  ctx.lineTo(cx - w * 0.2, cy);
  ctx.closePath();
  ctx.fill();

  // Class icon
  ctx.fillStyle = '#ffffff';
  if (type === 'knight') {
    // Sword cross
    ctx.fillRect(cx - 1, cy - h * 0.15, 2, h * 0.3);
    ctx.fillRect(cx - w * 0.1, cy - 2, w * 0.2, 3);
  } else if (type === 'warlock') {
    // Flame
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.15);
    ctx.quadraticCurveTo(cx + 5, cy - 3, cx + 3, cy + h * 0.1);
    ctx.lineTo(cx, cy + h * 0.05);
    ctx.lineTo(cx - 3, cy + h * 0.1);
    ctx.quadraticCurveTo(cx - 5, cy - 3, cx, cy - h * 0.15);
    ctx.fill();
  } else {
    // Skull
    ctx.beginPath();
    ctx.arc(cx, cy - 2, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - w * 0.05, cy + 2, w * 0.1, h * 0.06);
    // Eyes
    ctx.fillStyle = color;
    ctx.fillRect(cx - 3, cy - 4, 2, 2);
    ctx.fillRect(cx + 1, cy - 4, 2, 2);
  }

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.4, 0, Math.PI * 2);
  ctx.stroke();
}

// ============================================================
// Unit Drawing Functions
// ============================================================

function drawUnitSprite(ctx, w, h, config) {
  const cx = w / 2;
  const cy = h / 2;
  const color = config.color;

  switch (config.type) {
    case 'humanoid':
      drawHumanoidUnit(ctx, w, h, config);
      break;
    case 'flying':
      drawFlyingUnit(ctx, w, h, config);
      break;
    case 'mounted':
      drawMountedUnit(ctx, w, h, config);
      break;
    case 'undead':
      drawUndeadUnit(ctx, w, h, config);
      break;
    case 'dragon':
      drawDragonUnit(ctx, w, h, config);
      break;
    case 'beast':
      drawBeastUnit(ctx, w, h, config);
      break;
    default:
      drawHumanoidUnit(ctx, w, h, config);
  }
}

function drawHumanoidUnit(ctx, w, h, config) {
  const cx = w / 2;
  const color = config.color;

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(cx - w * 0.12, h * 0.3, w * 0.24, h * 0.3);

  // Head
  ctx.fillStyle = config.weapon === 'pitchfork' ? '#ddb88a' : color;
  ctx.beginPath();
  ctx.arc(cx, h * 0.22, w * 0.1, 0, Math.PI * 2);
  ctx.fill();

  if (config.horns) {
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.08, h * 0.16);
    ctx.lineTo(cx - w * 0.14, h * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.08, h * 0.16);
    ctx.lineTo(cx + w * 0.14, h * 0.06);
    ctx.stroke();
  }

  // Legs
  ctx.fillStyle = shadeColor(color, -20);
  ctx.fillRect(cx - w * 0.1, h * 0.6, w * 0.08, h * 0.2);
  ctx.fillRect(cx + w * 0.02, h * 0.6, w * 0.08, h * 0.2);

  // Arms
  ctx.fillStyle = color;
  ctx.fillRect(cx - w * 0.22, h * 0.32, w * 0.1, h * 0.22);
  ctx.fillRect(cx + w * 0.12, h * 0.32, w * 0.1, h * 0.22);

  // Weapon
  if (config.weapon === 'sword') {
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(cx + w * 0.22, h * 0.15, 2, h * 0.3);
    ctx.fillRect(cx + w * 0.16, h * 0.3, w * 0.14, 2);
  } else if (config.weapon === 'bow') {
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx + w * 0.26, h * 0.35, h * 0.15, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.26, h * 0.2);
    ctx.lineTo(cx + w * 0.26, h * 0.5);
    ctx.stroke();
  } else if (config.weapon === 'axe') {
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(cx + w * 0.22, h * 0.12, 2, h * 0.35);
    ctx.fillStyle = '#aaaaaa';
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.23, h * 0.14);
    ctx.lineTo(cx + w * 0.34, h * 0.2);
    ctx.lineTo(cx + w * 0.23, h * 0.26);
    ctx.closePath();
    ctx.fill();
  } else if (config.weapon === 'trident') {
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(cx + w * 0.22, h * 0.1, 2, h * 0.38);
    ctx.fillRect(cx + w * 0.16, h * 0.08, 2, h * 0.08);
    ctx.fillRect(cx + w * 0.28, h * 0.08, 2, h * 0.08);
  } else if (config.weapon === 'pitchfork') {
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(cx + w * 0.22, h * 0.1, 1.5, h * 0.38);
    ctx.fillRect(cx + w * 0.16, h * 0.08, 1.5, h * 0.06);
    ctx.fillRect(cx + w * 0.27, h * 0.08, 1.5, h * 0.06);
  }

  // Shield
  if (config.shield) {
    ctx.fillStyle = shadeColor(color, 20);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, h * 0.28);
    ctx.lineTo(cx - w * 0.18, h * 0.28);
    ctx.lineTo(cx - w * 0.18, h * 0.48);
    ctx.lineTo(cx - w * 0.23, h * 0.53);
    ctx.lineTo(cx - w * 0.28, h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  if (config.large) {
    // Draw bigger head to suggest size
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, h * 0.2, w * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlyingUnit(ctx, w, h, config) {
  const cx = w / 2;
  const color = config.color;

  // Wings
  if (config.wings) {
    ctx.fillStyle = shadeColor(color, 15);
    // Left wing
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.08, h * 0.3);
    ctx.quadraticCurveTo(cx - w * 0.4, h * 0.1, cx - w * 0.35, h * 0.35);
    ctx.quadraticCurveTo(cx - w * 0.25, h * 0.3, cx - w * 0.08, h * 0.35);
    ctx.closePath();
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.08, h * 0.3);
    ctx.quadraticCurveTo(cx + w * 0.4, h * 0.1, cx + w * 0.35, h * 0.35);
    ctx.quadraticCurveTo(cx + w * 0.25, h * 0.3, cx + w * 0.08, h * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.42, w * 0.12, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(cx, h * 0.2, w * 0.09, 0, Math.PI * 2);
  ctx.fill();

  if (config.halo) {
    ctx.strokeStyle = '#ffff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.1, w * 0.1, h * 0.03, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (config.horns) {
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.07, h * 0.14);
    ctx.lineTo(cx - w * 0.12, h * 0.04);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.07, h * 0.14);
    ctx.lineTo(cx + w * 0.12, h * 0.04);
    ctx.stroke();
  }

  if (config.cape) {
    ctx.fillStyle = shadeColor(color, -30);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.08, h * 0.3);
    ctx.lineTo(cx - w * 0.2, h * 0.7);
    ctx.lineTo(cx + w * 0.2, h * 0.7);
    ctx.lineTo(cx + w * 0.08, h * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Legs
  if (!config.small) {
    ctx.fillStyle = shadeColor(color, -15);
    ctx.fillRect(cx - w * 0.08, h * 0.58, w * 0.06, h * 0.16);
    ctx.fillRect(cx + w * 0.02, h * 0.58, w * 0.06, h * 0.16);
  }
}

function drawMountedUnit(ctx, w, h, config) {
  const cx = w / 2;
  const color = config.color;

  // Horse body
  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.55, w * 0.28, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horse head
  ctx.fillStyle = '#7a5a0a';
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.22, h * 0.42, w * 0.08, h * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Horse legs
  ctx.fillStyle = '#6a4a00';
  ctx.fillRect(cx - w * 0.2, h * 0.68, 3, h * 0.15);
  ctx.fillRect(cx - w * 0.08, h * 0.68, 3, h * 0.15);
  ctx.fillRect(cx + w * 0.08, h * 0.68, 3, h * 0.15);
  ctx.fillRect(cx + w * 0.2, h * 0.68, 3, h * 0.15);

  // Rider body
  ctx.fillStyle = color;
  ctx.fillRect(cx - w * 0.08, h * 0.22, w * 0.16, h * 0.22);

  // Rider head (with helm)
  ctx.fillStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.arc(cx, h * 0.16, w * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Lance
  ctx.fillStyle = '#aa8833';
  ctx.save();
  ctx.translate(cx + w * 0.15, h * 0.15);
  ctx.rotate(0.3);
  ctx.fillRect(-1, -h * 0.12, 2, h * 0.4);
  ctx.restore();

  // Lance tip
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.22, h * 0.05);
  ctx.lineTo(cx + w * 0.25, h * 0.12);
  ctx.lineTo(cx + w * 0.19, h * 0.12);
  ctx.closePath();
  ctx.fill();
}

function drawUndeadUnit(ctx, w, h, config) {
  const cx = w / 2;
  const color = config.color;

  // Tattered robe/body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.25);
  ctx.lineTo(cx + w * 0.18, h * 0.6);
  ctx.lineTo(cx + w * 0.15, h * 0.75);
  ctx.lineTo(cx - w * 0.15, h * 0.75);
  ctx.lineTo(cx - w * 0.18, h * 0.6);
  ctx.closePath();
  ctx.fill();

  // Skull head
  ctx.fillStyle = '#ddddcc';
  ctx.beginPath();
  ctx.arc(cx, h * 0.2, w * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Eye sockets
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(cx - w * 0.04, h * 0.18, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + w * 0.04, h * 0.18, 2, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes
  ctx.fillStyle = '#88ff88';
  ctx.beginPath();
  ctx.arc(cx - w * 0.04, h * 0.18, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + w * 0.04, h * 0.18, 1, 0, Math.PI * 2);
  ctx.fill();

  // Jaw
  ctx.strokeStyle = '#aaaaaa';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.05, h * 0.25);
  ctx.lineTo(cx, h * 0.28);
  ctx.lineTo(cx + w * 0.05, h * 0.25);
  ctx.stroke();

  // Weapon
  if (config.weapon === 'sword') {
    ctx.fillStyle = '#999999';
    ctx.fillRect(cx + w * 0.18, h * 0.15, 2, h * 0.35);
    ctx.fillRect(cx + w * 0.13, h * 0.32, w * 0.12, 2);
  }

  // Bone arms
  ctx.strokeStyle = '#ccccbb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.12, h * 0.35);
  ctx.lineTo(cx - w * 0.22, h * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.12, h * 0.35);
  ctx.lineTo(cx + w * 0.22, h * 0.5);
  ctx.stroke();
}

function drawDragonUnit(ctx, w, h, config) {
  const cx = w / 2;
  const color = config.color;

  // Wings
  ctx.fillStyle = shadeColor(color, 10);
  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.05, h * 0.25);
  ctx.quadraticCurveTo(cx - w * 0.42, h * 0.05, cx - w * 0.38, h * 0.3);
  ctx.quadraticCurveTo(cx - w * 0.3, h * 0.25, cx - w * 0.2, h * 0.35);
  ctx.closePath();
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.05, h * 0.25);
  ctx.quadraticCurveTo(cx + w * 0.42, h * 0.05, cx + w * 0.38, h * 0.3);
  ctx.quadraticCurveTo(cx + w * 0.3, h * 0.25, cx + w * 0.2, h * 0.35);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.45, w * 0.18, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.06, h * 0.3);
  ctx.lineTo(cx + w * 0.12, h * 0.12);
  ctx.lineTo(cx + w * 0.06, h * 0.3);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = shadeColor(color, -10);
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.08, h * 0.1, w * 0.08, h * 0.06, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(cx + w * 0.1, h * 0.08, 2, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.15, h * 0.5);
  ctx.quadraticCurveTo(cx - w * 0.35, h * 0.65, cx - w * 0.25, h * 0.78);
  ctx.stroke();

  // Legs
  ctx.fillStyle = shadeColor(color, -20);
  ctx.fillRect(cx - w * 0.12, h * 0.6, 4, h * 0.15);
  ctx.fillRect(cx + w * 0.06, h * 0.6, 4, h * 0.15);

  // Fire breath (for red dragon)
  if (color === '#ff4400') {
    ctx.fillStyle = 'rgba(255,100,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.15, h * 0.08);
    ctx.lineTo(cx + w * 0.4, h * 0.02);
    ctx.lineTo(cx + w * 0.35, h * 0.15);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBeastUnit(ctx, w, h, config) {
  const cx = w / 2;
  const color = config.color;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.48, w * 0.22, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = shadeColor(color, -10);
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.18, h * 0.38, w * 0.1, h * 0.08, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.2, h * 0.32);
  ctx.lineTo(cx + w * 0.16, h * 0.22);
  ctx.lineTo(cx + w * 0.24, h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.26, h * 0.32);
  ctx.lineTo(cx + w * 0.28, h * 0.22);
  ctx.lineTo(cx + w * 0.3, h * 0.3);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(cx + w * 0.22, h * 0.36, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = shadeColor(color, -20);
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.28, h * 0.4, w * 0.04, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = shadeColor(color, -15);
  ctx.fillRect(cx - w * 0.15, h * 0.58, 3, h * 0.16);
  ctx.fillRect(cx - w * 0.04, h * 0.58, 3, h * 0.16);
  ctx.fillRect(cx + w * 0.06, h * 0.58, 3, h * 0.16);
  ctx.fillRect(cx + w * 0.15, h * 0.58, 3, h * 0.16);

  // Tail
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.2, h * 0.45);
  ctx.quadraticCurveTo(cx - w * 0.35, h * 0.35, cx - w * 0.3, h * 0.28);
  ctx.stroke();
}

// ============================================================
// Helper Drawing Functions
// ============================================================

function drawTriangle(ctx, cx, topY, halfWidth, height) {
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + halfWidth, topY + height);
  ctx.lineTo(cx - halfWidth, topY + height);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, cx, cy, innerR, points) {
  const outerR = innerR * 2;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Shade a hex color by a percentage (-100 to 100).
 * Expects a 6-digit hex color string like '#4488cc'.
 */
export function shadeColor(color, percent) {
  const hex = color.startsWith('#') ? color.slice(1) : color;
  const num = parseInt(hex, 16);
  if (isNaN(num)) return color;
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.floor(percent * 2.55)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.floor(percent * 2.55)));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.floor(percent * 2.55)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
