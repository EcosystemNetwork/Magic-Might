# ⚔ Magic & Might ⚔

A browser-based clone of **Heroes of Might and Magic** — the classic turn-based strategy game.

## Features

### Adventure Map
- Procedurally generated tile-based overworld map with multiple terrain types (grass, forest, mountains, water, sand, swamp, snow, roads)
- Fog of war with exploration mechanics
- Pathfinding for hero movement
- Interactive map objects: towns, mines, resource piles, monster lairs, treasure chests
- Minimap overlay

### Heroes
- Three hero classes: **Knight**, **Warlock**, **Necromancer** — each with distinct stat growth
- Primary skills: Attack, Defense, Spell Power, Knowledge
- Experience and leveling system
- Spell books with combat and adventure spells
- Movement points for map traversal

### Army & Creatures
- **16+ unique unit types** across 4 factions:
  - **Castle**: Peasant, Archer, Griffin, Swordsman, Cavalier, Angel
  - **Inferno**: Imp, Demon, Pit Fiend, Devil
  - **Necropolis**: Skeleton, Zombie, Vampire, Bone Dragon
  - **Neutral**: Wolf, Orc, Ogre, Red Dragon
- Units have tier (1-7), attack, defense, damage, HP, speed, and special abilities
- Special traits: Flying, Ranged, Life Steal, Unlimited Retaliation, Fear, Jousting, Fire Breath

### Tactical Combat
- Grid-based (15×11) tactical battle system
- Turn order based on unit speed
- Actions: Move, Attack, Wait, Defend, Cast Spell, Auto-Battle
- Ranged and melee combat with retaliation mechanics
- Hero stat bonuses applied in combat
- Combat log tracking all actions

### Magic System
- **Damage spells**: Magic Arrow, Lightning Bolt, Fireball, Chain Lightning
- **Buff spells**: Haste, Shield, Bless, Bloodlust
- **Debuff spells**: Slow, Curse, Blind
- **Healing**: Cure, Resurrect
- **Summon**: Summon Elemental
- **Adventure**: View Map, Town Portal

### Town Management
- Buildings: Village Hall → Town Hall, Fort → Citadel → Castle, Mage Guild, Marketplace, Tavern
- Creature recruitment from town-specific dwelling pools
- Weekly creature growth with building bonuses
- Building prerequisites and resource costs
- Town income system

### Resource System
- 7 resource types: Gold, Wood, Ore, Gems, Crystal, Sulfur, Mercury
- Income from towns and captured mines
- Resource piles scattered on the adventure map

### AI Opponent
- Automated town management (building and recruiting)
- Strategic hero movement toward objectives
- Priority-based target selection (enemy heroes > towns > mines > resources)
- Full combat AI

## How to Play

### Controls
| Key | Action |
|-----|--------|
| **Click** | Move hero / Select target / Interact |
| **Enter** | End turn |
| **T** | Open town view (hero must be at a friendly town) |
| **Tab** | Cycle between heroes |
| **Esc** | Close town view |
| **W** | Wait (combat) |
| **D** | Defend (combat) |
| **A** | Auto-battle (combat) |
| **R** | Restart (game over screen) |
| **Right-click** | View object info |

### Getting Started
1. Open `index.html` in a modern browser (or run `npm start`)
2. Click **Start Game** on the title screen
3. Click on the map to move your hero
4. Visit your town (marked 🏰) to build structures and recruit units
5. Explore the map, collect resources, and build your army
6. Find and defeat the enemy hero and capture their town to win!

### Goal
Build your army, capture towns and resource mines, and **defeat the enemy** by eliminating their hero and capturing all their towns.

## Tech Stack
- **Vanilla JavaScript** (ES Modules)
- **HTML5 Canvas** for rendering
- **No external runtime dependencies**
- **Jest** for testing

## Development

```bash
# Install dev dependencies
npm install

# Run tests
npm test

# Start a local server
npm start
```

## Project Structure
```
├── index.html          # Main game entry point
├── css/
│   └── style.css       # Game styles
├── js/
│   ├── game.js         # Main game engine & state management
│   ├── map.js          # Adventure map generation & pathfinding
│   ├── hero.js         # Hero creation & management
│   ├── units.js        # Unit/creature definitions & damage calculation
│   ├── town.js         # Town buildings & recruitment
│   ├── combat.js       # Tactical combat system
│   ├── spells.js       # Spell definitions & casting
│   ├── ai.js           # AI opponent logic
│   ├── renderer.js     # HTML5 Canvas rendering
│   └── input.js        # Input handling & game controller
├── tests/
│   ├── units.test.js
│   ├── resources.test.js
│   ├── hero.test.js
│   ├── map.test.js
│   ├── town.test.js
│   ├── combat.test.js
│   ├── spells.test.js
│   └── game.test.js
└── package.json
```

## License
MIT