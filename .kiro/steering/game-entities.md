---
inclusion: fileMatch
fileMatchPattern: "src/objects/**,src/models/**"
---

# Game Entity System

## Entity Hierarchy
```
Entity<T> (abstract base)
├── Combatant (abstract — core game character)
│   ├── Player — user-controlled, moves via waypoints from arrow keys
│   ├── NPC — basic AI combatant (minimal override of Combatant)
│   └── Seeker — pathfinding AI with A* and basic movement strategies
└── Item (abstract — placed objects on the board)
    ├── Bomb — explodes after fuse, damages nearby combatants
    ├── MedPack — heals combatants on the tile
    ├── PokemonBall — captures combatants
    └── Spider (variants per terrain type) — modifies terrain tiles
```

## Entity Base (`src/objects/Entity.ts`)
- Generic abstract class `Entity<T>` with `EntityModel` interface
- `EntityModel`: `{ id: string, tick: number, position: number }`
- All entities must implement: `getPosition()`, `getID()`, `getAge()`, `tick()`, `toModel()`

## Model Pattern
- Each entity class has a corresponding model in `src/models/`
- Models are plain serializable interfaces (stored in Redux state)
- Entity classes wrap models and provide behavior methods
- `toModel()` converts entity back to serializable form for Redux
- Factory function `GetCombatant()` in `CombatantUtils` reconstructs entities from models

## Combatant System
- Species: Bunny, Turtle, Lizard, Elephant, Dog, Cat, Unicorn
- States: Alive, Mating, Dead, Captured
- Decision types: Fighter, Lover, Neutral, Seeker, Wanderer
- Strength ratings: Weak, Average, Strong, Immortal (calculated from global stats)
- Gender system: Male/Female (optional, toggled by `use_genders` setting)
- Fitness: health-like value affected by terrain, combat, and age
- Species have terrain affinities (e.g., Turtle gets Water bonus, Lizard gets Fire/Sand bonus)

## Combatant Identification
- `Player.IsOf(model)` — checks `is_player` flag
- `Seeker.IsOf(model)` — checks `decision_type === Seeker`
- `NPC.IsOf(model)` — checks `position !== undefined` (catch-all)
- Order matters in `GetCombatant`: Player → Seeker → NPC

## Item System
- Items have a fuse mechanic (`fuse_length`, checked via `isFuseUp()`)
- Max 4 items per tile (`MAX_TILE_ITEM_COUNT`)
- Items are processed each tick via their `tap()` method
- `ItemState`: Live or Spent

## Tile System
- Tile types: Void, Water, Fire, Rock, Sand, Grass
- Each tile has `score_potential` per species (cached, lazily computed)
- Void tiles are impassable
- Terrain effects on fitness defined in `getMapTileEffect()` in CombatantModel
