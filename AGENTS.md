# Repository Guidelines

Labloom should stay lean; use these guardrails to keep contributions consistent as the portfolio evolves.

## Project Structure & Module Organization
- Keep authored source in `src/`: group UI modules by feature (`src/sections/Hero`, `src/components/Button`), centralize shared styles in `src/styles`, and hold data-driven content in `src/content`.
- Serve unprocessed static assets (favicons, fonts, resume PDFs) from `public/`; never commit generated output (e.g., `dist/`).
- Mirror the runtime tree inside `tests/`; keep helper scripts in `scripts/`.
- Root-level files should stay limited to configuration (`package.json`, `tsconfig.json`, linters) and documentation.

## Build, Test, and Development Commands
- `npm install` — install dependencies; lock to Node 20 LTS for consistent toolchain support.
- `npm run dev` — start the local dev server (Vite or equivalent) with hot reload.
- `npm run build` — create an optimized static bundle in `dist/`.
- `npm run preview` — smoke-test the production bundle locally.
- `npm run test` — execute the Vitest suite with coverage; wire this into CI.

## Coding Style & Naming Conventions
- Enforce Prettier defaults (2-space indent, single quotes in TS/JS) and ESLint’s recommended rules; add `.eslintrc.cjs` and `.prettierrc` at the root.
- Name React components with PascalCase (`HeroSection.tsx`), hooks in camelCase (`useScrollLock.ts`), and utilities in kebab-case directories.
- Scope CSS Modules or Tailwind layers to the feature folder; avoid global selectors outside `src/styles/base.css`.

## Testing Guidelines
- Use Vitest for unit/component coverage (`*.spec.tsx`) and Playwright for high-value journeys (`tests/e2e/*.spec.ts`).
- Target ≥80% statement coverage; fail builds below the threshold.
- Snapshot tests belong next to the component and must be regenerated only when intentional visual changes occur.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) to keep history searchable; scope prefixes to the feature folder (`feat(hero): add animated headline`).
- Each PR needs: problem statement, implementation notes, and screenshots or recordings for UI changes.
- Reference GitHub issues with `Closes #ID`; keep PRs under ~300 lines changed to simplify reviews.

## Environment & Secrets
- Store environment variables in `.env.local`; keep safe defaults in `config/defaults.ts`.
- Document every required key in `/.env.example`, keep secrets out of commits, and rotate anything accidentally exposed immediately.
