---
inclusion: fileMatch
fileMatchPattern: "src/components/**"
---

# React Component Conventions

## Pattern
- Components are functional (e.g., `Tile`) or class-based with `connect()` from react-redux
- Class components use `connect(mapStateToProps, mapDispatchToProps)` for Redux binding
- `mapStateToProps` is shared via `src/data/utils/ReactUtils.ts` — it maps the full `AppState`
- `mapDispatchToProps` is defined per-component and returns typed `DispatchProps`

## Props
- Class components receive `AppState & DispatchProps` as props
- Functional components use inline prop type definitions (no separate interface files)

## Styling
- Each component has a matching CSS file in `src/css/` (e.g., `Arena.tsx` → `Arena.css`)
- Use `classnames` library for conditional class application
- Import CSS directly: `import '../css/ComponentName.css'`

## Game Loop Integration
- `Arena` owns the game tick loop via `requestAnimationFrame`
- Tick speed is controlled by the `tickerSlice` — converted to ms via `tickSpeedToMs()`
- Each tick dispatches `tick()` (ticker) and `combatantTick()` (board) actions
- Keyboard events are bound in `componentDidMount` and cleaned up in `componentWillUnmount`

## Component Hierarchy
```
Game
├── TitleScreen (when game_state === Title)
└── GameBoard (when game_state === Game)
    ├── Arena
    │   ├── Dashboard
    │   ├── Map (renders the tile grid + combatants + items)
    │   ├── Controls (Adventure mode only)
    │   └── PaintPalette
    ├── Hud (when activeHudPanel === DETAILS)
    └── SpeciesStats (when activeHudPanel === STATS)
```

## Analytics
- Use `Analytics.logEvent('event_name')` for user interaction tracking
- Analytics is initialized in the app entry point via Firebase
