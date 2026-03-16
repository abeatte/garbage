# Project: Garbage

A React + TypeScript browser game with Redux state management, deployed via GitHub Pages.

## Stack
- React 18, TypeScript 4, Redux Toolkit
- react-scripts (CRA) for build/test/lint
- Jest + React Testing Library for tests
- Firebase for analytics
- Husky pre-commit hook runs tests before every commit

## Project Structure
- `src/components/` — React UI components
- `src/objects/` — Game entity classes (Combatant, NPC, Player, Items)
- `src/models/` — Data models (CombatantModel, TileModel, etc.)
- `src/data/slices/` — Redux slices (board, hud, paintPalette, ticker)
- `src/data/utils/` — Pure utility functions (CombatantUtils, TurnProcessingUtils, etc.)
- `src/__tests__/` — Tests mirroring the src structure

## Key Commands
- `npm start` — dev server
- `npm test` — watch mode tests
- `npm run test:ci` — single-run tests (used in CI and pre-deploy)
- `npm run build` — production build
- `npm run tsc` — type-check only
- `npm run deploy` — runs test:ci + build + gh-pages deploy

## Conventions
- Components are `.tsx`, utilities/models/objects are `.ts`
- Tests live in `src/__tests__/` mirroring the source path
- Redux state is managed exclusively through slices in `src/data/slices/`
- Game entities extend `Entity` base class in `src/objects/Entity.ts`
- Neural network data for NPC AI lives in `src/data/nets/`
