# Repository Guidelines

## Project Structure & Module Organization
- `server.js` wires Express with Playwright; legacy backups in the root are reference-only. In production this file is the main entrypoint registered as a `systemctl` service.
- Core logic lives in `src/`: `routes/` for HTTP handlers, `services/` for browser automation, `middleware/` for cross-cutting controls, and `utils/` for session helpers.
- Add large fixtures to `src/assets/` (create on demand) and document structural changes in `ARCHITECTURE.md`.

## Build, Test, and Development Commands
- `npm install` — sync dependencies after cloning or editing `package.json`.
- `npm start` — boot the production server; ensure required env vars exist beforehand.
- `npm run dev` — run with `nodemon` for live reload while editing; exercise endpoints via `curl` as outlined in `API_DOCUMENTATION.md`.

## Coding Style & Naming Conventions
- Keep 2-space indentation, CommonJS `require`, and async/await control flow.
- Name files in lowercase kebab-case, exports in camelCase, and constructor-like helpers in PascalCase.
- Prefer concise English logs; mirror existing emoji usage sparingly and gate verbose output behind conditions.

## Testing Guidelines
- No automated suite yet; add integration specs under a top-level `tests/` using `@playwright/test` or `supertest` when introducing coverage.
- Name test files `<feature>.spec.js` and mirror the route/service tree for discoverability.
- Until automation lands, validate manually: start the server, exercise session lifecycle endpoints, confirm mutex cleanup, and note the steps in `README.md`.

## Commit & Pull Request Guidelines
- Write imperative commit subjects (~50 chars) like `Update htmlCleaner.js`; keep each commit scoped.
- Link issues or tickets in the body where relevant and avoid bundling unrelated changes.
- Pull requests should include a purpose summary, modules touched, manual verification notes, and evidence for user-facing updates.
- Request review after local checks pass and tag maintainers responsible for the affected area.

## Environment & Security Notes
- Store secrets (Playwright credentials, proxies) in a local `.env`; never commit sensitive data.
- Reuse the provided session manager to rotate IDs and close browser instances to avoid leaks.
- Scrub user-identifying values from logs before printing or sharing traces.
