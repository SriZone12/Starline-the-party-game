# AGENTS.md

## Project

- Single-page, same-device party game built with Vite + React 19 + TypeScript. All gameplay is client-side; there is no backend, auth, database, or test suite.
- Despite `README.md`, `.env.example`, `metadata.json`, and the `@google/genai` dependency, there are no Gemini/API calls in `src/`. `GEMINI_API_KEY` is not needed to run the game.
- The `express`, `dotenv`, and `tsx` dependencies are unused; do not add a server unless explicitly asked.

## Commands

- Install: `npm install --legacy-peer-deps --no-package-lock`. Plain `npm install` fails because root `esbuild@^0.25` conflicts with Vite 8's optional peer `esbuild@^0.27 || ^0.28`; `--no-package-lock` avoids adding a second lockfile next to `bun.lock`. Bun is not installed here.
- Dev server: `npm run dev` -> Vite on `0.0.0.0:3000`.
- Typecheck/lint: `npm run lint` (runs only `tsc --noEmit`; there is no ESLint or Prettier).
- Production build: `npm run build` -> `dist/`.
- Preview build: `npm run preview`.
- There is no test command. Verify with `npm run lint`, `npm run build`, and manual play.
- `DISABLE_HMR=true` intentionally disables HMR and file watching in `vite.config.ts` for AI Studio; do not remove or "fix" this.

## Architecture

- `src/main.tsx` mounts `src/App.tsx`, which owns the game state machine (`LOBBY`, `PLAYING`, `DARE_POPUP`, `COMPLETED`), players/turn rotation, nodes, completed strokes/dares, and custom-dare persistence.
- `src/components/GameCanvas.tsx` owns the full-window canvas and pointer input. Collision is checked every ~3 px while dragging; crossing a committed line or touching any star except the source/target stops the drag and immediately opens the dare popup. Confirming a dare commits the path plus the target node center; declining commits no stroke.
- `src/utils/geometry.ts` contains segment intersection, 4.5 px proximity detection, self-intersection, source-node exclusion, active-path star-touch detection, and rejection-sampling/jittered-grid node placement.
- `GameNode.x/y` and `DrawnStroke.points` are viewport pixels, not normalized. The `GameNode` comment claiming normalized coordinates is stale. App rescales nodes/strokes on resize/orientation changes.
- `src/utils/dares.ts` holds built-in dares and persists custom dares in localStorage key `constellation_dares_custom_v1`.
- `src/utils/audio.ts` provides a Web Audio singleton; sound settings mutate `soundEngine.enabled`.
- `PRESET_COLORS` lives in `SetupLobby`. Player count is constrained to 2-15; node counts are fixed at 8/12/16/20/24/30/69.

## Gotchas

- Tailwind is v4 via `@tailwindcss/vite`. Add global styles to `src/index.css`; there is no `tailwind.config.js`.
- The `@/*` alias resolves to the repo root, not `src/`. Existing imports are relative.
- The canvas uses a high-DPI transform capped at 2.5 and relies on `touch-action: none` plus pointer events; preserve these for mobile behavior.
- Global `html/body/#root` and `main` are `overflow: hidden`; only the lobby (`h-dvh`) and modal panels scroll. The active game canvas is intentionally non-scrollable.
- `.aistudio/artifacts/brain/*/implementation_plan.md` is historical planning, not authoritative. Verify claims against `src/`.
