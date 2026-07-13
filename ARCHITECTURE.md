# Cyclopedia architecture note

## Phase 0 decisions

- **Package manager:** npm. No lockfile existed when the project was inspected, so `npm install` will create `package-lock.json`.
- **Build commands:** `npm run content:validate`, `npm run content:build`, `npm run lint`, `npm test`, and `npm run build`. `prebuild` generates content before the Vite production build.
- **Source layout:** handwritten application code is under `src/`; build tooling is under `scripts/`; raw, user-authored articles are under `data/<slug>/article.md`.
- **Generated content:** `public/generated-content/articles.json` stores summaries only. `public/generated-content/articles/<slug>.json` stores one normalized rendered article. Article-local files are copied to `public/generated-content/assets/<slug>/`.
- **Pipeline:** a standalone TypeScript script is used rather than a Vite plugin. This makes content validation available independently in CI and keeps generated data usable by other tooling.
- **Testing:** Vitest executes focused unit tests for the content domain. Component and end-to-end tests are intentionally deferred to their relevant implementation phases.

## Current limitations

The application now consumes the generated-content repository in the browser. Advanced Markdown extensions, Three.js, component tests, and end-to-end tests remain deferred by the implementation guide.

## Local developer mode

The Vite development server exposes a local-only control panel at `/developer`. Its middleware validates article-folder imports, updates the category registry and matching article front matter, manages `public/background/`, and invokes the same content pipeline used by production builds. The middleware uses `apply: "serve"`, so write endpoints are absent from production builds.
