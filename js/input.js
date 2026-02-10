// ============================================================
// Input Handler - Mouse & Keyboard Controls
// ============================================================

import { GameRenderer } from './renderer.js';
import {
  createGameState, moveHeroTo, endTurn, executeCombatAction,
  openTownView, closeTownView, recruitFromTown, buildInGameTown, GAME_PHASES
} from './game.js';
import { findPath, getObjectsAt, MAP_OBJECT_TYPES } from './map.js';
import { getCurrentStack, COMBAT_RESULT, autoResolveCombat } from './combat.js';

export class GameController {
  constructor(canvas) {
    this.canvas = canvas;
    this.gameState = createGameState();
    this.renderer = new GameRenderer(canvas, this.gameState);

    this.setupEventListeners();
    this.startGameLoop();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleRightClick(e);
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Window resize
    window.addEventListener('resize', () => this.renderer.resize());
  }

  startGameLoop() {
    const loop = () => {
      this.renderer.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ===========================================================
  // Click Handlers
  // ===========================================================

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    switch (this.gameState.phase) {
      case GAME_PHASES.ADVENTURE:
        this.handleAdventureClick(x, y);
        break;
      case GAME_PHASES.COMBAT:
        this.handleCombatClick(x, y);
        break;
      case GAME_PHASES.TOWN_VIEW:
        this.handleTownClick(x, y);
        break;
      case GAME_PHASES.GAME_OVER:
        // Click to restart
        break;
    }
  }

  handleAdventureClick(x, y) {
    // Check HUD buttons
    if (this.renderer.hudButtons) {
      for (const btn of this.renderer.hudButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this.handleHudAction(btn.action);
          return;
        }
      }
    }

    // Map click
    const tile = this.renderer.screenToTile(x, y);
    const hero = this.gameState.selectedHero;

    if (!hero) return;

    // Check if clicking on own hero to select
    const clickedHero = this.gameState.heroes.find(h =>
      h.x === tile.x && h.y === tile.y && h.playerId === this.gameState.currentPlayerId
    );

    if (clickedHero) {
      this.gameState.selectedHero = clickedHero;
      this.showMessage(`Selected ${clickedHero.name}`);
      return;
    }

    // Check if clicking on own town to open
    const town = this.gameState.towns.find(t =>
      t.x === tile.x && t.y === tile.y && t.ownerId === this.gameState.currentPlayerId
    );
    if (town && hero.x === tile.x && hero.y === tile.y) {
      openTownView(this.gameState, tile.x, tile.y);
      return;
    }

    // Move hero
    const result = moveHeroTo(this.gameState, hero.id, tile.x, tile.y);
    if (result.success) {
      this.showMessage(result.message);
      this.renderer.selectedPath = null;
    } else {
      this.showMessage(result.message);
    }
  }

  handleCombatClick(x, y) {
    const combat = this.gameState.combat;
    if (!combat) return;

    // Check combat HUD buttons
    if (this.renderer.combatHudButtons) {
      for (const btn of this.renderer.combatHudButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this.handleCombatHudAction(btn.action);
          return;
        }
      }
    }

    // Handle combat end
    if (combat.result !== COMBAT_RESULT.IN_PROGRESS) {
      // Resolve and go back to adventure
      this.gameState.combat = null;
      this.gameState.phase = this.gameState.winner ? GAME_PHASES.GAME_OVER : GAME_PHASES.ADVENTURE;
      return;
    }

    const cell = this.renderer.screenToCombatCell(x, y);
    if (!cell) return;

    const currentStack = getCurrentStack(combat);
    if (!currentStack || currentStack.side !== 'attacker') {
      // AI's turn - auto-resolve
      this.handleAiCombatTurn();
      return;
    }

    // Check if clicking on enemy to attack
    const targetCell = combat.grid[cell.y * 15 + cell.x]; // COMBAT_GRID_WIDTH = 15
    if (targetCell && targetCell.occupant && targetCell.occupant.side !== currentStack.side) {
      const result = executeCombatAction(this.gameState, {
        type: 'attack',
        targetX: cell.x,
        targetY: cell.y,
      });

      if (result) {
        // Auto-resolve AI combat turns
        this.resolveAiCombatTurns();
      }
      return;
    }

    // Move to empty cell
    if (!targetCell?.occupant) {
      const result = executeCombatAction(this.gameState, {
        type: 'move',
        targetX: cell.x,
        targetY: cell.y,
      });

      if (result && !result.error) {
        this.resolveAiCombatTurns();
      }
    }
  }

  handleTownClick(x, y) {
    // Check build buttons
    if (this.renderer.townBuildButtons) {
      for (const btn of this.renderer.townBuildButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          const town = this.gameState.activeTown;
          if (town) {
            const result = buildInGameTown(this.gameState, town.x, town.y, btn.buildingId);
            if (result && result.success) {
              this.showMessage(`Built ${btn.buildingId}!`);
            } else {
              this.showMessage(result?.error || 'Cannot build');
            }
          }
          return;
        }
      }
    }

    // Check recruit buttons
    if (this.renderer.townRecruitButtons) {
      for (const btn of this.renderer.townRecruitButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          const town = this.gameState.activeTown;
          if (town) {
            const result = recruitFromTown(this.gameState, town.x, town.y, btn.unitId, btn.count);
            if (result && result.success) {
              this.showMessage(`Recruited ${result.recruited} units!`);
            } else {
              this.showMessage(result?.error || 'Cannot recruit');
            }
          }
          return;
        }
      }
    }

    // Check close button
    if (this.renderer.townCloseButton) {
      const btn = this.renderer.townCloseButton;
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        closeTownView(this.gameState);
        return;
      }
    }
  }

  // ===========================================================
  // Mouse Move
  // ===========================================================

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.gameState.phase === GAME_PHASES.ADVENTURE) {
      const tile = this.renderer.screenToTile(x, y);
      this.renderer.hoveredTile = tile;

      // Show path preview
      const hero = this.gameState.selectedHero;
      if (hero) {
        const pathResult = findPath(this.gameState.map, hero.x, hero.y, tile.x, tile.y);
        this.renderer.selectedPath = pathResult ? pathResult.path : null;

        // Tooltip
        const objects = getObjectsAt(this.gameState.map, tile.x, tile.y);
        if (objects.length > 0) {
          const obj = objects[0];
          this.renderer.tooltipText = `${obj.name || obj.type}${obj.ownerId ? ` (Player ${obj.ownerId})` : ''}`;
          this.renderer.tooltipX = x + 15;
          this.renderer.tooltipY = y - 10;
        } else {
          this.renderer.tooltipText = '';
        }
      }
    } else if (this.gameState.phase === GAME_PHASES.COMBAT) {
      const cell = this.renderer.screenToCombatCell(x, y);
      this.renderer.hoveredCombatCell = cell;

      if (cell) {
        const combat = this.gameState.combat;
        const gridCell = combat.grid[cell.y * 15 + cell.x];
        if (gridCell && gridCell.occupant) {
          const s = gridCell.occupant;
          this.renderer.tooltipText = `${s.name}: ${s.count} (HP:${s.currentHp}/${s.hp}, ATK:${s.attack}, DEF:${s.defense})`;
          this.renderer.tooltipX = x + 15;
          this.renderer.tooltipY = y - 10;
        } else {
          this.renderer.tooltipText = '';
        }
      }
    }
  }

  handleRightClick(event) {
    // Right-click could show info panel
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.gameState.phase === GAME_PHASES.ADVENTURE) {
      const tile = this.renderer.screenToTile(x, y);
      const objects = getObjectsAt(this.gameState.map, tile.x, tile.y);
      if (objects.length > 0) {
        this.showMessage(`${objects[0].name}: ${objects[0].type}`);
      }
    }
  }

  // ===========================================================
  // Keyboard Handler
  // ===========================================================

  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
        if (this.gameState.phase === GAME_PHASES.ADVENTURE) {
          endTurn(this.gameState);
          this.showMessage(`Turn ended. Turn ${this.gameState.turn}`);
        }
        break;

      case 'Escape':
        if (this.gameState.phase === GAME_PHASES.TOWN_VIEW) {
          closeTownView(this.gameState);
        }
        break;

      case 't':
      case 'T':
        if (this.gameState.phase === GAME_PHASES.ADVENTURE) {
          this.handleHudAction('openTown');
        }
        break;

      case 'w':
      case 'W':
        if (this.gameState.phase === GAME_PHASES.COMBAT) {
          this.handleCombatHudAction('wait');
        }
        break;

      case 'd':
      case 'D':
        if (this.gameState.phase === GAME_PHASES.COMBAT) {
          this.handleCombatHudAction('defend');
        }
        break;

      case 'a':
      case 'A':
        if (this.gameState.phase === GAME_PHASES.COMBAT) {
          this.handleCombatHudAction('auto');
        }
        break;

      case 'r':
      case 'R':
        if (this.gameState.phase === GAME_PHASES.GAME_OVER) {
          this.gameState = createGameState();
          this.renderer.gameState = this.gameState;
          this.showMessage('New game started!');
        }
        break;

      case 'Tab':
        event.preventDefault();
        // Cycle through heroes
        if (this.gameState.phase === GAME_PHASES.ADVENTURE) {
          const playerHeroes = this.gameState.heroes.filter(h => h.playerId === this.gameState.currentPlayerId);
          if (playerHeroes.length > 1) {
            const currentIdx = playerHeroes.indexOf(this.gameState.selectedHero);
            this.gameState.selectedHero = playerHeroes[(currentIdx + 1) % playerHeroes.length];
          }
        }
        break;
    }
  }

  // ===========================================================
  // Action Handlers
  // ===========================================================

  handleHudAction(action) {
    switch (action) {
      case 'endTurn':
        endTurn(this.gameState);
        this.showMessage(`Turn ended. Turn ${this.gameState.turn}`);
        break;

      case 'openTown': {
        const hero = this.gameState.selectedHero;
        if (hero) {
          const town = this.gameState.towns.find(t =>
            t.ownerId === this.gameState.currentPlayerId &&
            Math.abs(t.x - hero.x) <= 1 && Math.abs(t.y - hero.y) <= 1
          );
          if (town) {
            openTownView(this.gameState, town.x, town.y);
          } else {
            this.showMessage('No friendly town nearby');
          }
        }
        break;
      }
    }
  }

  handleCombatHudAction(action) {
    const combat = this.gameState.combat;
    if (!combat || combat.result !== COMBAT_RESULT.IN_PROGRESS) {
      if (action === 'continue') {
        this.gameState.combat = null;
        this.gameState.phase = this.gameState.winner ? GAME_PHASES.GAME_OVER : GAME_PHASES.ADVENTURE;
      }
      return;
    }

    switch (action) {
      case 'wait':
        executeCombatAction(this.gameState, { type: 'wait' });
        this.resolveAiCombatTurns();
        break;

      case 'defend':
        executeCombatAction(this.gameState, { type: 'defend' });
        this.resolveAiCombatTurns();
        break;

      case 'auto':
        autoResolveCombat(combat);
        // Resolve combat end if needed
        if (combat.result !== COMBAT_RESULT.IN_PROGRESS) {
          // The combat will end on next click
        }
        break;
    }
  }

  resolveAiCombatTurns() {
    const combat = this.gameState.combat;
    if (!combat || combat.result !== COMBAT_RESULT.IN_PROGRESS) return;

    // Auto-play defender (AI) turns
    let safety = 50;
    while (safety > 0) {
      const current = getCurrentStack(combat);
      if (!current) break;
      if (current.side === 'attacker') break; // Player's turn
      if (combat.result !== COMBAT_RESULT.IN_PROGRESS) break;

      // AI picks best target
      const enemies = combat.stacks.filter(s => s.side !== current.side && s.count > 0);
      if (enemies.length === 0) break;

      const target = enemies.sort((a, b) => (a.count * a.hp) - (b.count * b.hp))[0];
      executeCombatAction(this.gameState, {
        type: 'attack',
        targetX: target.gridX,
        targetY: target.gridY,
      });

      safety--;
    }
  }

  handleAiCombatTurn() {
    this.resolveAiCombatTurns();
  }

  showMessage(text) {
    this.gameState.gameLog.push(text);
    // Keep log manageable
    if (this.gameState.gameLog.length > 100) {
      this.gameState.gameLog = this.gameState.gameLog.slice(-50);
    }
  }

  // Public API for restarting game
  newGame(options) {
    this.gameState = createGameState(options);
    this.renderer.gameState = this.gameState;
  }
}
