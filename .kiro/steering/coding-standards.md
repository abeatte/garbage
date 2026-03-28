# Coding Standards

## TypeScript
- Components are `.tsx`, everything else is `.ts`
- Use enums for fixed sets of values (e.g., `State`, `Character`, `TileType`, `GameMode`)
- Use interfaces for data models, not classes — classes are for entities with behavior
- Type Redux state with `AppState` and `AppDispatch` from `src/data/store.ts`
- Use `Partial<T>` for optional model construction (e.g., `Partial<CombatantModel>`)

## Naming
- PascalCase: components, classes, interfaces, enums, enum members
- camelCase: functions, variables, parameters
- snake_case: Redux state fields and model properties (e.g., `tick_speed`, `is_player`, `target_waypoints`)
- UPPER_SNAKE_CASE: constants (e.g., `TICK_SPEED_MAX_STEPS`, `MAX_TILE_ITEM_COUNT`)

## Imports
- Use relative imports throughout (no path aliases configured)
- Group: external packages first, then internal modules
- Use `require()` for image assets in components

## Code Organization
- Pure logic goes in `src/data/utils/` — keep it free of React/Redux imports where possible
- Redux state mutations only happen inside slice reducers
- Entity behavior lives in `src/objects/` classes
- Data models (interfaces + helper functions) live in `src/models/`

## Error Handling
- Use `throw new Error()` for unimplemented code paths (e.g., unknown combatant type)
- Use `eslint-disable-next-line no-fallthrough` comments for intentional switch fall-throughs

## Dependencies
- `classnames` for conditional CSS classes
- `react-uuid` for generating unique IDs
- `unique-names-generator` for random combatant names
- `@fortawesome` for icons
- No additional test libraries beyond Jest + RTL
