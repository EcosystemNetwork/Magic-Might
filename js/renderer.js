// ============================================================
// Canvas Renderer for the Adventure Map and Combat
// ============================================================

import { TERRAIN_TYPES, getTile, MAP_OBJECT_TYPES } from './map.js';
import { COMBAT_GRID_WIDTH, COMBAT_GRID_HEIGHT, getCombatCell, getCurrentStack, COMBAT_RESULT } from './combat.js';
import { GAME_PHASES } from './game.js';
import { RESOURCE_NAMES, RESOURCE_COLORS } from './resources.js';
import { BUILDING_TYPES, getAvailableBuildings, FACTION_UNITS } from './town.js';
import { UNIT_TEMPLATES } from './units.js';
import { SpriteCache } from './artwork.js';

const TILE_SIZE = 32;
const COMBAT_CELL_SIZE = 48;

export class GameRenderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.cameraX = 0;
    this.cameraY = 0;
    this.hoveredTile = null;
    this.hoveredCombatCell = null;
    this.animationFrame = 0;
    this.selectedPath = null;

    // UI state
    this.showMinimap = true;
    this.tooltipText = '';
    this.uiPanels = [];

    // Artwork sprite cache
    this.sprites = new SpriteCache();
    this.sprites.generateAll(TILE_SIZE, COMBAT_CELL_SIZE);

    this.resize();
  }

  resize() {
    this.canvas.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.canvas.height = this.canvas.parentElement?.clientHeight || (window.innerHeight - 120);
  }

  /**
   * Main render loop.
   */
  render() {
    this.animationFrame++;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.gameState.phase) {
      case GAME_PHASES.ADVENTURE:
        this.renderAdventureMap();
        break;
      case GAME_PHASES.COMBAT:
        this.renderCombat();
        break;
      case GAME_PHASES.TOWN_VIEW:
        this.renderTownView();
        break;
      case GAME_PHASES.GAME_OVER:
        this.renderGameOver();
        break;
    }

    // Always render HUD overlay
    this.renderHUD();
  }

  // ===========================================================
  // Adventure Map Rendering
  // ===========================================================

  renderAdventureMap() {
    const { ctx, gameState, canvas } = this;
    const map = gameState.map;

    // Center camera on selected hero
    if (gameState.selectedHero) {
      this.cameraX = gameState.selectedHero.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
      this.cameraY = gameState.selectedHero.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;
    }

    // Clamp camera
    this.cameraX = Math.max(0, Math.min(this.cameraX, map.width * TILE_SIZE - canvas.width));
    this.cameraY = Math.max(0, Math.min(this.cameraY, map.height * TILE_SIZE - canvas.height));

    // Calculate visible tile range
    const startTileX = Math.max(0, Math.floor(this.cameraX / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(this.cameraY / TILE_SIZE));
    const endTileX = Math.min(map.width, Math.ceil((this.cameraX + canvas.width) / TILE_SIZE) + 1);
    const endTileY = Math.min(map.height, Math.ceil((this.cameraY + canvas.height) / TILE_SIZE) + 1);

    // Draw terrain
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = getTile(map, x, y);
        if (!tile) continue;

        const screenX = x * TILE_SIZE - this.cameraX;
        const screenY = y * TILE_SIZE - this.cameraY;

        const terrain = TERRAIN_TYPES[tile.terrain];
        if (!terrain) continue;

        // Fog of war
        const isVisible = tile.visibleTo && tile.visibleTo[gameState.currentPlayerId];
        const isExplored = tile.explored;

        if (!isExplored && !isVisible) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          continue;
        }

        // Draw terrain sprite
        const terrainSprite = this.sprites.get(`terrain_${tile.terrain}`);
        if (terrainSprite) {
          ctx.drawImage(terrainSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = terrain.color;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Dim unexplored but seen tiles
        if (!isVisible) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw map objects
    for (const obj of map.objects) {
      const isVisible = (() => {
        const tile = getTile(map, obj.x, obj.y);
        return tile && (tile.visibleTo && tile.visibleTo[gameState.currentPlayerId]);
      })();

      if (!isVisible && obj.type !== MAP_OBJECT_TYPES.TOWN) continue;
      if (obj.collected) continue;

      const screenX = obj.x * TILE_SIZE - this.cameraX;
      const screenY = obj.y * TILE_SIZE - this.cameraY;

      // Draw object background and sprite
      if (obj.type === MAP_OBJECT_TYPES.TOWN) {
        const townKey = obj.ownerId === 1 ? 'obj_TOWN_player1' :
                        obj.ownerId === 2 ? 'obj_TOWN_player2' : 'obj_TOWN_neutral';
        const townSprite = this.sprites.get(townKey);
        if (townSprite) {
          ctx.drawImage(townSprite, screenX - 4, screenY - 4, TILE_SIZE + 8, TILE_SIZE + 8);
        } else {
          ctx.fillStyle = obj.ownerId === 1 ? 'rgba(68,136,255,0.3)' :
                          obj.ownerId === 2 ? 'rgba(255,68,68,0.3)' : 'rgba(200,200,200,0.3)';
          ctx.fillRect(screenX - 2, screenY - 2, TILE_SIZE + 4, TILE_SIZE + 4);
        }
      } else {
        // Try to find specific sprite for this object type
        let spriteKey = null;
        if (obj.type === MAP_OBJECT_TYPES.MINE_GOLD) spriteKey = 'obj_MINE_GOLD';
        else if (obj.type === MAP_OBJECT_TYPES.MINE_WOOD) spriteKey = 'obj_MINE_WOOD';
        else if (obj.type === MAP_OBJECT_TYPES.MINE_ORE) spriteKey = 'obj_MINE_ORE';
        else if (obj.type === MAP_OBJECT_TYPES.MINE_GEMS) spriteKey = 'obj_MINE_GEMS';
        else if (obj.type === MAP_OBJECT_TYPES.RESOURCE_PILE) spriteKey = 'obj_RESOURCE_PILE';
        else if (obj.type === MAP_OBJECT_TYPES.TREASURE_CHEST) spriteKey = 'obj_TREASURE_CHEST';
        else if (obj.type === MAP_OBJECT_TYPES.MONSTER_LAIR) spriteKey = 'obj_MONSTER_LAIR';

        const objSprite = spriteKey ? this.sprites.get(spriteKey) : null;
        if (objSprite) {
          ctx.drawImage(objSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.font = `${TILE_SIZE * 0.7}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(obj.symbol || '?', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      }
    }

    // Draw heroes
    for (const hero of gameState.heroes) {
      const tile = getTile(map, hero.x, hero.y);
      const isVisible = tile && (tile.visibleTo && tile.visibleTo[gameState.currentPlayerId]);
      if (!isVisible && hero.playerId !== gameState.currentPlayerId) continue;

      const screenX = hero.x * TILE_SIZE - this.cameraX;
      const screenY = hero.y * TILE_SIZE - this.cameraY;

      // Hero sprite
      const isSelected = gameState.selectedHero && gameState.selectedHero.id === hero.id;
      const heroSprite = this.sprites.get(`hero_${hero.heroClass}`);
      if (heroSprite) {
        ctx.drawImage(heroSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = hero.color;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${TILE_SIZE * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(hero.symbol, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      }

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing selection indicator
        const pulse = Math.sin(this.animationFrame * 0.1) * 3;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE * 0.4 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Hero name
      ctx.font = '10px sans-serif';
      ctx.fillStyle = hero.color;
      ctx.fillText(hero.name, screenX + TILE_SIZE / 2, screenY - 4);
    }

    // Draw selected path
    if (this.selectedPath) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const hero = gameState.selectedHero;
      if (hero) {
        ctx.moveTo(hero.x * TILE_SIZE - this.cameraX + TILE_SIZE / 2,
                    hero.y * TILE_SIZE - this.cameraY + TILE_SIZE / 2);
        for (const step of this.selectedPath) {
          ctx.lineTo(step.x * TILE_SIZE - this.cameraX + TILE_SIZE / 2,
                      step.y * TILE_SIZE - this.cameraY + TILE_SIZE / 2);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Hovered tile highlight
    if (this.hoveredTile) {
      const screenX = this.hoveredTile.x * TILE_SIZE - this.cameraX;
      const screenY = this.hoveredTile.y * TILE_SIZE - this.cameraY;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    // Minimap
    if (this.showMinimap) {
      this.renderMinimap();
    }
  }

  renderMinimap() {
    const { ctx, gameState, canvas } = this;
    const map = gameState.map;
    const mmSize = 150;
    const mmX = canvas.width - mmSize - 10;
    const mmY = 10;
    const pixelW = mmSize / map.width;
    const pixelH = mmSize / map.height;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);

    // Terrain
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = getTile(map, x, y);
        if (!tile) continue;
        const terrain = TERRAIN_TYPES[tile.terrain];
        ctx.fillStyle = tile.explored ? terrain.color : '#1a1a2e';
        ctx.fillRect(mmX + x * pixelW, mmY + y * pixelH, Math.ceil(pixelW), Math.ceil(pixelH));
      }
    }

    // Heroes on minimap
    for (const hero of gameState.heroes) {
      ctx.fillStyle = hero.color;
      ctx.fillRect(mmX + hero.x * pixelW - 1, mmY + hero.y * pixelH - 1, 4, 4);
    }

    // Towns on minimap
    for (const town of gameState.towns) {
      ctx.fillStyle = town.ownerId === 1 ? '#4488ff' : town.ownerId === 2 ? '#ff4444' : '#ffffff';
      ctx.fillRect(mmX + town.x * pixelW - 2, mmY + town.y * pixelH - 2, 5, 5);
    }

    // Camera viewport
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mmX + (this.cameraX / TILE_SIZE) * pixelW,
      mmY + (this.cameraY / TILE_SIZE) * pixelH,
      (canvas.width / TILE_SIZE) * pixelW,
      (canvas.height / TILE_SIZE) * pixelH
    );
  }

  // ===========================================================
  // Combat Rendering
  // ===========================================================

  renderCombat() {
    const { ctx, gameState, canvas } = this;
    const combat = gameState.combat;
    if (!combat) return;

    const gridWidth = COMBAT_GRID_WIDTH * COMBAT_CELL_SIZE;
    const gridHeight = COMBAT_GRID_HEIGHT * COMBAT_CELL_SIZE;
    const offsetX = (canvas.width - gridWidth) / 2;
    const offsetY = (canvas.height - gridHeight) / 2 - 40;

    // Background
    ctx.fillStyle = '#2a2a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.font = 'bold 20px serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('⚔ BATTLE ⚔', canvas.width / 2, offsetY - 15);

    // Round info
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Round ${combat.round}`, canvas.width / 2, offsetY - 0);

    // Draw grid
    for (let y = 0; y < COMBAT_GRID_HEIGHT; y++) {
      for (let x = 0; x < COMBAT_GRID_WIDTH; x++) {
        const cell = getCombatCell(combat, x, y);
        const screenX = offsetX + x * COMBAT_CELL_SIZE;
        const screenY = offsetY + y * COMBAT_CELL_SIZE;

        // Cell background
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#5a6a3a' : '#4a5a2a';
        ctx.fillRect(screenX, screenY, COMBAT_CELL_SIZE, COMBAT_CELL_SIZE);

        // Highlight current stack's reachable cells
        const currentStack = getCurrentStack(combat);
        if (currentStack && !cell.occupant) {
          const dist = Math.abs(x - currentStack.gridX) + Math.abs(y - currentStack.gridY);
          const maxDist = currentStack.flying ? currentStack.speed * 2 : currentStack.speed;
          if (dist <= maxDist) {
            ctx.fillStyle = currentStack.side === 'attacker'
              ? 'rgba(68,136,255,0.15)'
              : 'rgba(255,68,68,0.15)';
            ctx.fillRect(screenX, screenY, COMBAT_CELL_SIZE, COMBAT_CELL_SIZE);
          }
        }

        // Draw occupant
        if (cell && cell.occupant && cell.occupant.count > 0) {
          const stack = cell.occupant;
          const isCurrentTurn = currentStack && currentStack === stack;

          // Unit background
          ctx.fillStyle = stack.side === 'attacker' ? 'rgba(68,136,255,0.3)' : 'rgba(255,68,68,0.3)';
          ctx.fillRect(screenX + 2, screenY + 2, COMBAT_CELL_SIZE - 4, COMBAT_CELL_SIZE - 4);

          // Current turn highlight
          if (isCurrentTurn) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(screenX + 1, screenY + 1, COMBAT_CELL_SIZE - 2, COMBAT_CELL_SIZE - 2);
          }

          // Unit sprite
          const unitSprite = stack.templateId ? this.sprites.get(`unit_${stack.templateId}`) : null;
          if (unitSprite) {
            ctx.drawImage(unitSprite, screenX + 2, screenY + 2, COMBAT_CELL_SIZE - 4, COMBAT_CELL_SIZE - 4);
          } else {
            ctx.font = `${COMBAT_CELL_SIZE * 0.45}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = stack.color || '#ffffff';
            ctx.fillText(stack.symbol || '?', screenX + COMBAT_CELL_SIZE / 2, screenY + COMBAT_CELL_SIZE / 2 - 6);
          }

          // Count
          ctx.font = `bold 12px sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`×${stack.count}`, screenX + COMBAT_CELL_SIZE / 2, screenY + COMBAT_CELL_SIZE - 10);

          // HP bar
          const maxHp = stack.hp * stack.count;
          const currentTotalHp = (stack.count - 1) * stack.hp + stack.currentHp;
          const hpPercent = maxHp > 0 ? currentTotalHp / maxHp : 0;
          const barY = screenY + COMBAT_CELL_SIZE - 4;
          ctx.fillStyle = '#333333';
          ctx.fillRect(screenX + 4, barY, COMBAT_CELL_SIZE - 8, 3);
          ctx.fillStyle = hpPercent > 0.5 ? '#44cc44' : hpPercent > 0.25 ? '#cccc44' : '#cc4444';
          ctx.fillRect(screenX + 4, barY, (COMBAT_CELL_SIZE - 8) * hpPercent, 3);
        }

        // Hover highlight
        if (this.hoveredCombatCell && this.hoveredCombatCell.x === x && this.hoveredCombatCell.y === y) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX, screenY, COMBAT_CELL_SIZE, COMBAT_CELL_SIZE);
        }

        // Grid border
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, COMBAT_CELL_SIZE, COMBAT_CELL_SIZE);
      }
    }

    // Combat info panels
    this.renderCombatInfoPanels(combat, offsetX, offsetY, gridWidth, gridHeight);

    // Combat log
    this.renderCombatLog(combat, offsetX, offsetY + gridHeight + 10);
  }

  renderCombatInfoPanels(combat, offsetX, offsetY, gridWidth, gridHeight) {
    const { ctx, canvas } = this;

    // Attacker info (left)
    const leftX = 10;
    const infoY = offsetY + 10;
    ctx.fillStyle = 'rgba(68,136,255,0.2)';
    ctx.fillRect(leftX, infoY, offsetX - 20, gridHeight - 20);
    ctx.strokeStyle = '#4488ff';
    ctx.strokeRect(leftX, infoY, offsetX - 20, gridHeight - 20);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#4488ff';
    ctx.textAlign = 'left';
    const attackerName = combat.attackerHero ? combat.attackerHero.name : 'Guardians';
    ctx.fillText(`⚔ ${attackerName}`, leftX + 5, infoY + 20);

    let yOff = 40;
    const attackerStacks = combat.stacks.filter(s => s.side === 'attacker');
    for (const stack of attackerStacks) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = stack.count > 0 ? '#ffffff' : '#666666';
      ctx.fillText(`${stack.symbol} ${stack.name}: ${stack.count}`, leftX + 5, infoY + yOff);
      yOff += 18;
    }

    // Defender info (right)
    const rightX = offsetX + gridWidth + 10;
    ctx.fillStyle = 'rgba(255,68,68,0.2)';
    ctx.fillRect(rightX, infoY, canvas.width - rightX - 10, gridHeight - 20);
    ctx.strokeStyle = '#ff4444';
    ctx.strokeRect(rightX, infoY, canvas.width - rightX - 10, gridHeight - 20);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'left';
    const defenderName = combat.defenderHero ? combat.defenderHero.name : 'Defenders';
    ctx.fillText(`🛡 ${defenderName}`, rightX + 5, infoY + 20);

    yOff = 40;
    const defenderStacks = combat.stacks.filter(s => s.side === 'defender');
    for (const stack of defenderStacks) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = stack.count > 0 ? '#ffffff' : '#666666';
      ctx.fillText(`${stack.symbol} ${stack.name}: ${stack.count}`, rightX + 5, infoY + yOff);
      yOff += 18;
    }

    // Current turn indicator
    const currentStack = getCurrentStack(combat);
    if (currentStack) {
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(`Current: ${currentStack.name} (${currentStack.side})`,
        canvas.width / 2, offsetY + gridHeight + COMBAT_GRID_HEIGHT + 45);
    }
  }

  renderCombatLog(combat, x, y) {
    const { ctx, canvas } = this;
    const logHeight = 80;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, canvas.width - x * 2, logHeight);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'left';

    const recentLogs = combat.log.slice(-4);
    recentLogs.forEach((log, i) => {
      ctx.fillText(log, x + 5, y + 15 + i * 18);
    });
  }

  // ===========================================================
  // Town View Rendering
  // ===========================================================

  renderTownView() {
    const { ctx, gameState, canvas } = this;
    const town = gameState.activeTown;
    if (!town) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Town header
    ctx.font = 'bold 28px serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(`🏰 ${town.name} (${town.faction})`, canvas.width / 2, 40);

    // Built buildings
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#88cc88';
    ctx.textAlign = 'left';
    ctx.fillText('Built:', 20, 80);

    let yOffset = 100;
    for (const buildingId of town.buildings) {
      const b = BUILDING_TYPES[buildingId];
      if (b) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#aaddaa';
        ctx.fillText(`✓ ${b.name}: ${b.description}`, 30, yOffset);
        yOffset += 22;
      }
    }

    // Available buildings
    yOffset += 20;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#cccc88';
    ctx.fillText('Available to build:', 20, yOffset);
    yOffset += 25;

    const available = getAvailableBuildings(town);
    this.townBuildButtons = [];
    for (const building of available) {
      const costStr = Object.entries(building.cost).map(([r, a]) => `${a} ${r}`).join(', ');
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ddddaa';
      ctx.fillText(`• ${building.name} (${costStr})`, 30, yOffset);

      // Build button
      const btnX = canvas.width / 2 + 100;
      ctx.fillStyle = '#446644';
      ctx.fillRect(btnX, yOffset - 14, 60, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Build', btnX + 30, yOffset);
      ctx.textAlign = 'left';

      this.townBuildButtons.push({ x: btnX, y: yOffset - 14, w: 60, h: 20, buildingId: building.id });
      yOffset += 25;
    }

    // Available units to recruit
    yOffset += 20;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#8888cc';
    ctx.fillText('Recruit units:', 20, yOffset);
    yOffset += 25;

    this.townRecruitButtons = [];
    for (const unitId of town.availableUnits) {
      const template = UNIT_TEMPLATES[unitId];
      if (!template) continue;
      const available = town.unitPool[unitId] || 0;
      const costStr = Object.entries(template.cost).map(([r, a]) => `${a} ${r}`).join(', ');

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#aaaadd';
      ctx.fillText(`${template.symbol} ${template.name}: ${available} available (${costStr} each)`, 30, yOffset);

      if (available > 0) {
        const btnX = canvas.width / 2 + 100;
        ctx.fillStyle = '#444466';
        ctx.fillRect(btnX, yOffset - 14, 80, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Recruit ${available}`, btnX + 40, yOffset);
        ctx.textAlign = 'left';

        this.townRecruitButtons.push({ x: btnX, y: yOffset - 14, w: 80, h: 20, unitId, count: available });
      }
      yOffset += 25;
    }

    // Garrison info
    yOffset += 20;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#cc8888';
    ctx.fillText('Garrison:', 20, yOffset);
    yOffset += 25;

    const hero = gameState.heroes.find(h =>
      h.playerId === gameState.currentPlayerId &&
      Math.abs(h.x - town.x) <= 1 && Math.abs(h.y - town.y) <= 1
    );

    if (hero) {
      for (const stack of hero.army) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#ddaaaa';
        ctx.fillText(`${stack.symbol} ${stack.name}: ${stack.count}`, 30, yOffset);
        yOffset += 22;
      }
    } else {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText('No hero present to recruit units', 30, yOffset);
    }

    // Close button
    ctx.fillStyle = '#664444';
    ctx.fillRect(canvas.width / 2 - 50, canvas.height - 50, 100, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Close (Esc)', canvas.width / 2, canvas.height - 28);
    this.townCloseButton = { x: canvas.width / 2 - 50, y: canvas.height - 50, w: 100, h: 35 };
  }

  // ===========================================================
  // Game Over Screen
  // ===========================================================

  renderGameOver() {
    const { ctx, canvas, gameState } = this;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('⚔ VICTORY ⚔', canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = '24px serif';
    ctx.fillStyle = '#ffffff';
    const winner = gameState.winner;
    ctx.fillText(`${winner ? winner.name : 'Unknown'} has conquered the realm!`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Game ended on turn ${gameState.turn}`, canvas.width / 2, canvas.height / 2 + 50);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('Press R to start a new game', canvas.width / 2, canvas.height / 2 + 90);
  }

  // ===========================================================
  // HUD (Heads-Up Display)
  // ===========================================================

  renderHUD() {
    const { ctx, canvas, gameState } = this;
    const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!player) return;

    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, 30);

    // Resources
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    let rx = 10;
    for (const [res, amount] of Object.entries(player.resources)) {
      const color = RESOURCE_COLORS[res] || '#ffffff';
      ctx.fillStyle = color;
      ctx.fillText(`${RESOURCE_NAMES[res] || res}: ${amount}`, rx, 20);
      rx += 100;
    }

    // Turn counter and player name
    ctx.textAlign = 'right';
    ctx.fillStyle = player.color;
    ctx.fillText(`${player.name} | Turn ${gameState.turn}`, canvas.width - 10, 20);

    // Bottom bar
    if (gameState.phase === GAME_PHASES.ADVENTURE) {
      this.renderAdventureHUD();
    } else if (gameState.phase === GAME_PHASES.COMBAT) {
      this.renderCombatHUD();
    }

    // Tooltip
    if (this.tooltipText) {
      const tx = this.tooltipX || canvas.width / 2;
      const ty = this.tooltipY || canvas.height - 60;
      ctx.font = '12px sans-serif';
      const metrics = ctx.measureText(this.tooltipText);
      const padding = 8;
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(tx - padding, ty - 14, metrics.width + padding * 2, 20);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(this.tooltipText, tx, ty);
    }
  }

  renderAdventureHUD() {
    const { ctx, canvas, gameState } = this;
    const hero = gameState.selectedHero;
    const barY = canvas.height - 80;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, barY, canvas.width, 80);

    if (hero) {
      // Hero info
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = hero.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${hero.symbol} ${hero.name} (Lv.${hero.level})`, 10, barY + 20);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#cccccc';
      ctx.fillText(`ATK:${hero.attack} DEF:${hero.defense} POW:${hero.spellPower} KNW:${hero.knowledge}`, 10, barY + 38);
      ctx.fillText(`MP: ${hero.movementPoints.toFixed(1)}/${hero.maxMovementPoints} | Mana: ${hero.mana}/${hero.maxMana}`, 10, barY + 55);

      // Army display
      let ax = 350;
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText('Army:', ax, barY + 20);
      ax += 40;
      for (const stack of hero.army) {
        ctx.fillStyle = stack.color || '#ffffff';
        ctx.fillText(`${stack.symbol}${stack.count}`, ax, barY + 20);
        ax += 50;
      }
    }

    // Action buttons
    this.hudButtons = [];
    const btnY = barY + 40;
    const buttons = [
      { label: 'End Turn (Enter)', action: 'endTurn', x: canvas.width - 150 },
      { label: 'Town (T)', action: 'openTown', x: canvas.width - 300 },
    ];

    for (const btn of buttons) {
      ctx.fillStyle = '#444466';
      ctx.fillRect(btn.x, btnY, 130, 30);
      ctx.strokeStyle = '#6666aa';
      ctx.strokeRect(btn.x, btnY, 130, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + 65, btnY + 20);
      this.hudButtons.push({ ...btn, y: btnY, w: 130, h: 30 });
    }

    // Game log
    ctx.font = '11px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'left';
    const recentLogs = gameState.gameLog.slice(-3);
    recentLogs.forEach((log, i) => {
      ctx.fillText(log, 10, barY + 70 + i * 14);
    });
  }

  renderCombatHUD() {
    const { ctx, canvas, gameState } = this;
    const combat = gameState.combat;
    if (!combat) return;

    const barY = canvas.height - 50;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, barY, canvas.width, 50);

    this.combatHudButtons = [];
    const currentStack = getCurrentStack(combat);

    if (currentStack && currentStack.side === 'attacker') {
      const buttons = [
        { label: 'Wait (W)', action: 'wait', x: 10 },
        { label: 'Defend (D)', action: 'defend', x: 120 },
        { label: 'Auto Battle (A)', action: 'auto', x: 230 },
      ];

      for (const btn of buttons) {
        ctx.fillStyle = '#444466';
        ctx.fillRect(btn.x, barY + 10, 100, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + 50, barY + 30);
        this.combatHudButtons.push({ ...btn, y: barY + 10, w: 100, h: 30 });
      }

      // Show current stack info
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd700';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${currentStack.name} (Speed: ${currentStack.speed}, Dmg: ${currentStack.minDamage}-${currentStack.maxDamage})`,
        canvas.width - 10, barY + 30);
    } else if (combat.result !== COMBAT_RESULT.IN_PROGRESS) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(combat.result === COMBAT_RESULT.ATTACKER_WON ? '🎉 Victory!' : '💀 Defeat!',
        canvas.width / 2, barY + 30);

      ctx.fillStyle = '#446644';
      ctx.fillRect(canvas.width / 2 - 50, barY + 5, 100, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText('Continue', canvas.width / 2, barY + 25);
      this.combatHudButtons.push({ action: 'continue', x: canvas.width / 2 - 50, y: barY + 5, w: 100, h: 30 });
    }
  }

  // ===========================================================
  // Input Helpers
  // ===========================================================

  screenToTile(screenX, screenY) {
    const tileX = Math.floor((screenX + this.cameraX) / TILE_SIZE);
    const tileY = Math.floor((screenY + this.cameraY) / TILE_SIZE);
    return { x: tileX, y: tileY };
  }

  screenToCombatCell(screenX, screenY) {
    const gridWidth = COMBAT_GRID_WIDTH * COMBAT_CELL_SIZE;
    const gridHeight = COMBAT_GRID_HEIGHT * COMBAT_CELL_SIZE;
    const offsetX = (this.canvas.width - gridWidth) / 2;
    const offsetY = (this.canvas.height - gridHeight) / 2 - 40;

    const cellX = Math.floor((screenX - offsetX) / COMBAT_CELL_SIZE);
    const cellY = Math.floor((screenY - offsetY) / COMBAT_CELL_SIZE);

    if (cellX >= 0 && cellX < COMBAT_GRID_WIDTH && cellY >= 0 && cellY < COMBAT_GRID_HEIGHT) {
      return { x: cellX, y: cellY };
    }
    return null;
  }
}
