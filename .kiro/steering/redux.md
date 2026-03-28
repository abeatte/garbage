---
inclusion: fileMatch
fileMatchPattern: "src/data/**"
---

# Redux State Management

## Store Structure
The store (`src/data/store.ts`) has four slices:
- `ticker` — game tick counter and speed control
- `board` — all game state (tiles, combatants, items, settings, game mode)
- `hud` — UI display mode and active panel
- `paintPalette` — map editor paint tool state

## Types
- `AppState = ReturnType<typeof store.getState>` — full store type
- `AppDispatch = typeof store.dispatch` — dispatch type

## Slice Conventions
- Use `createSlice` from `@reduxjs/toolkit`
- Export individual action creators as named exports
- Export the reducer as default export
- State interfaces are defined in the slice file or inline
- Use `PayloadAction<T>` for typed action payloads

## Board Slice (the big one)
- Contains `BoardState` (tiles, combatants, items, viewport, player) and `SettingsState`
- `Tiles` type: `{ t: { [position: number]: TileModel }, start, end, width, height, size }`
- `Combatants` type: `{ c: { [position: number]: CombatantModel }, size }`
- `Items` type: `{ i: { [position: number]: ItemModel[] }, size }`
- Position-based indexing — entities are keyed by their tile position (integer)

## Ticker Slice
- `tick_speed` is a step index (0 = paused, 1 = slowest, `TICK_SPEED_MAX_STEPS` = fastest)
- Convert to ms interval: `tickSpeedToMs(step)` = `1000 * (3/4)^(step-1)`
- `prev_tick_speed` stores the speed before pausing for resume

## Utility Functions
- Pure functions live in `src/data/utils/`
- `CombatantUtils` — factory (`GetCombatant`), position helpers, kill/copy operations
- `TurnProcessingUtils` — `processBoardTick`, movement, environment effects, combat
- `SightUtils` — `viewSurroundings` returns a `Sight` object with 9-cell neighborhood
- `TargetingUtils` — target resolution for combat
- `ItemUtils` — item processing and effects
- `GameUtils` — enums for `GameState`, `GameMode`, `ArrowKey`
