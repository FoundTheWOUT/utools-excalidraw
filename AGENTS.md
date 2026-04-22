# AGENTS.md

## Build & Release

```bash
pnpm build          # Build web assets to dist/web
pnpm pack-ext       # Package for uTools (creates .upx file)
pnpm dev            # Run Vite dev server
```

Release workflow: Push a semver tag (`v*.*.*`) to trigger CI. CI builds and uploads `.upx` to GitHub Releases.

## Testing

```bash
pnpm test           # Run Vitest in watch mode
pnpm coverage       # Run with coverage
```

Tests use jsdom. Test files should end with `.test.ts`.

## Lint & TypeCheck

```bash
pnpm lint           # ESLint
pnpm type-check    # TypeScript
pnpm format         # Prettier
```

## uTools Plugin Context

This is a uTools plugin. The app runs inside uTools with `window.utools` API (see `src/main.tsx`). Dev server (`pnpm dev`) is for testing in browser; actual plugin runs in uTools.

## Tech Stack

- Vite + React 18 + TypeScript
- TailwindCSS for styling
- @excalidraw/excalidraw for drawing
- pnpm as package manager