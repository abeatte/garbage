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
├── components/   — React component tests
├── integration/  — cross-cutting game loop tests
├── models/       — data model tests
├── slices/       — Redux slice reducer tests
└── utils/        — utility function tests
```

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

## Firebase Mocks
- `src/__mocks__/firebase/app.js` and `src/__mocks__/firebase/analytics.js`
- Auto-mocked by Jest's module resolution — no manual mock setup needed in tests

## Pre-commit
- Husky runs tests before every commit via `.husky/pre-commit`
- Deploy script (`npm run deploy`) runs `test:ci` before building
