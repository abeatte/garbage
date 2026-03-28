---
inclusion: fileMatch
fileMatchPattern: "src/__tests__/**"
---

# Testing Conventions

## Framework
- Jest + React Testing Library (via react-scripts/CRA)
- Run tests: `npm test` (watch mode) or `npm run test:ci` (single run, CI)

## File Structure
Tests mirror the source tree under `src/__tests__/`:
```
src/__tests__/
├── components/    — React component tests
├── coverage/      — coverage gap verification tests
├── helpers/       — shared test factories and utilities
├── integration/   — cross-cutting game loop tests
├── models/        — data model tests
├── objects/       — game entity class tests (Combatant, Player, Seeker, NPC)
│   └── items/     — item class tests (Bomb, MedPack, PokemonBall, Spider)
├── preservation/  — existing test suite stability verification
├── slices/        — Redux slice reducer tests
└── utils/         — utility function tests
```

## Shared Test Factories
Use `src/__tests__/helpers/testFactories.ts` for consistent test data:
- `makeGrassTiles(width, height)` — creates a Tiles object filled with Grass tiles
- `makeCombatantModel(overrides?)` — creates a CombatantModel with sensible defaults
- `makeItemModel(type, overrides?)` — creates an ItemModel with DEFAULT_ITEM base
- `emptyCombatants()` / `emptyItems()` — empty collection factories
- `makeSight(overrides?)` — creates a minimal Sight object for item tap tests

Import testFactories before entity classes to resolve circular dependencies safely.

## Patterns

### Slice Tests
- Get initial state via `reducer(undefined, { type: '@@INIT' })`
- Test each action creator by dispatching and asserting state changes
- Use real reducer — no mocking of Redux internals

### Model Tests
- Test factory functions and pure computation functions directly
- Assert return values and edge cases

### Utility Tests
- Test pure functions with various inputs
- Mock only external dependencies (Firebase is mocked in `src/__mocks__/firebase/`)

### Component Tests
- Use `@testing-library/react` for rendering
- Test user interactions and rendered output

### Game Entity Tests
- Use NPC as concrete subclass when testing abstract Combatant behavior
- Test static `IsOf()` methods for type identification
- Test `tap()` methods for items with before-fuse and on-fuse-up scenarios
- Use `makeSight()` factory to build Sight objects for item tap tests
- Import testFactories before entity imports to resolve circular dependencies

### Item Tests
- Test `IsOf()`, `tap()` (before and after fuse-up), and `fuse_length`
- Build surroundings arrays matching ClockFace enum ordering (c, tl, t, tr, r, br, b, bl, l)
- Use `emptyItems()` / `emptyCombatants()` for clean state

## Firebase Mocks
- `src/__mocks__/firebase/app.js` and `src/__mocks__/firebase/analytics.js`
- Auto-mocked by Jest's module resolution — no manual mock setup needed in tests

## Pre-commit
- Husky runs tests before every commit via `.husky/pre-commit`
- Deploy script (`npm run deploy`) runs `test:ci` before building
