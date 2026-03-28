---
inclusion: fileMatch
fileMatchPattern: "src/css/**"
---

# CSS Conventions

## Structure
- One CSS file per component in `src/css/`
- File names match component names (e.g., `Arena.css` for `Arena.tsx`)
- Global styles in `src/index.css` and `src/css/App.css`

## Naming
- CSS class names use PascalCase matching the component (e.g., `.Arena_container`, `.Tile`, `.Hud`)
- Modifier classes use descriptive names (e.g., `.Highlight`, `.Selected`)
- Use `classnames` library in components for conditional class application

## Tile Sizing
- `TILE_SIZE = 25` (px) — defined in `src/components/Tile.tsx`
- Tile images are positioned absolutely within a relative container

## Responsive
- HUD switches between `SIDE_PANEL`, `FULL_SCREEN`, and `GONE` modes based on screen width
- Breakpoint: `EXPANDED_MODE_ARENA_WIDTH (785px) + EXPANDED_MODE_HUD_WIDTH (445px)`
- Portrait mode detection via `screenWidth < screenHeight`
