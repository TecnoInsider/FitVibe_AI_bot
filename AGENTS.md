# Repository Guidelines

## Project Structure & Module Organization
- Entry points live at `index.html`, `index.tsx`, and `App.tsx`.
- UI building blocks are in `components/`; feature screens live in `pages/`.
- Shared state and app wiring sit in `contexts/` and `hooks/`.
- Static content and fixtures go in `data/`; utilities live in `lib/`.
- Type definitions are centralized in `types.ts`.

## Build, Test, and Development Commands
- `npm install`: install dependencies (Node >= 20).
- `npm run dev`: start Vite dev server for local development.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally.

## Coding Style & Naming Conventions
- TypeScript + React (Vite). Use 2-space indentation and semicolons.
- Prefer single quotes for strings, mirroring existing files like `App.tsx`.
- Components and pages use `PascalCase` filenames (e.g., `ProductDetailPage.tsx`).
- Keep React components small and split reusable UI into `components/`.

## Testing Guidelines
- No automated test framework is currently configured.
- When adding tests, document the chosen tool (e.g., Vitest) and add scripts in `package.json`.
- For manual checks, verify key routes in dev: `/profile`, `/nutrition`, `/workouts`, `/catalog`.

## Commit & Pull Request Guidelines
- Existing commits use short, lowercase, imperative messages (e.g., `add files`).
- Keep commits focused; include a brief description and testing notes in PRs.
- For UI changes, add screenshots or short clips when relevant.
- Link related issues or tasks in the PR description when available.

## Security & Configuration Tips
- Create `.env.local` with `GEMINI_API_KEY` for local runs.
- Do not commit secrets; keep API keys and tokens out of the repo.
