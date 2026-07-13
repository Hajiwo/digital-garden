# Cyclopedia Implementation Guide for Codex

## 1. Objective

Implement **Cyclopedia**, a personal article collection website that presents Markdown articles as a high-quality digital magazine and long-term knowledge library.

This is not a generic blog. The implementation must prioritize:

- editorial presentation;
- reliable local content ingestion;
- excellent reading ergonomics;
- strict TypeScript contracts;
- maintainable feature boundaries;
- accessibility and responsive behavior;
- restrained animation;
- a foundation that can later support semantic search, knowledge graphs, reading history, and other advanced features.

The raw content under `data/` is the source of truth.

---

## 2. Implementation Strategy

Do not implement every requested feature in one pass. Work in independently verifiable phases.

```text
Phase 0  Repository inspection and decisions
Phase 1  Project foundation
Phase 2  Content model and build-time article pipeline
Phase 3  Application shell and routing
Phase 4  Magazine homepage
Phase 5  Article reader
Phase 6  Search, categories, timeline, sorting, and filtering
Phase 7  Media and advanced Markdown
Phase 8  Motion and optional Three.js enhancement
Phase 9  Performance, accessibility, SEO, and testing
Phase 10 Future-feature extension points
```

Each phase must leave the repository in a buildable and testable state.

---

## 3. Rules for Codex

Before changing code:

1. Read `README.md`, `package.json`, TypeScript configuration, lint configuration, Vite configuration, route definitions, and the existing folder structure.
2. Identify the package manager from the lockfile.
3. Reuse existing dependencies and conventions where sound.
4. Inspect existing tests and scripts.
5. Do not assume an empty repository.
6. Do not rewrite unrelated files.
7. Do not introduce a dependency until its necessity is established.

For every implementation task:

1. State the files that will be affected.
2. Implement the smallest coherent change.
3. Validate untrusted content at the boundary.
4. Add or update tests for important behavior.
5. Run the actual repository scripts for formatting, linting, type checking, tests, and production build.
6. Report completed work, verification, and limitations.

Never claim a command passed unless it was executed successfully.

---

## 4. Target Technology Stack

Use the repository's installed versions. The intended stack is:

- React;
- TypeScript with strict mode;
- Vite;
- React Router;
- Tailwind CSS;
- Framer Motion;
- Three.js or React Three Fiber only for justified decorative scenes;
- Markdown and YAML front matter;
- a build-time article indexing process;
- a local deterministic search implementation.

Recommended content-processing capabilities may be implemented with maintained unified/remark/rehype-compatible packages or equivalent existing libraries.

Do not parse all Markdown dynamically in homepage components.

---

## 5. Target Repository Structure

Adapt this structure to the existing repository rather than recreating equivalent folders unnecessarily.

```text
project/
├── data/
│   ├── ai-agents/
│   │   ├── article.md
│   │   ├── cover.webp
│   │   └── resources/
│   │       ├── architecture.png
│   │       ├── demo.mp4
│   │       └── narration.mp3
│   └── distributed-systems/
│       ├── article.md
│       └── cover.webp
│
├── scripts/
│   ├── build-content.ts
│   └── validate-content.ts
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   └── ui/
│   ├── features/
│   │   ├── articles/
│   │   ├── categories/
│   │   ├── search/
│   │   ├── theme/
│   │   └── timeline/
│   ├── layouts/
│   ├── lib/
│   │   ├── content/
│   │   ├── markdown/
│   │   ├── search/
│   │   └── validation/
│   ├── pages/
│   ├── styles/
│   ├── three/
│   └── types/
│
├── public/
│   └── generated-content/
│
└── tests/
```

Keep generated content out of handwritten source directories unless the existing build system requires otherwise.

---

## 6. Content Contract

Each article occupies one directory under `data/`.

```text
data/<slug>/article.md
```

Example article:

```markdown
---
title: AI Agents from First Principles
description: A practical explanation of autonomous agent systems.
date: 2026-07-12
updated: 2026-07-13
cover: cover.webp
category: Artificial Intelligence
tags:
  - AI
  - Agents
featured: true
draft: false
---

# AI Agents

Article content begins here.
```

### Required fields

- `title`: non-empty string;
- `description`: non-empty string;
- `date`: valid ISO date;
- `tags`: array of strings.

### Optional fields

- `updated`: valid ISO date;
- `cover`: safe article-local path;
- `category`: string;
- `featured`: boolean, default `false`;
- `draft`: boolean, default `false`;
- `readingTime`: positive number; otherwise calculate it.

### Slug rules

Use the article directory name as the stable slug unless the repository explicitly supports a front-matter slug.

Reject:

- duplicate slugs;
- empty slugs;
- absolute paths;
- `..` path segments;
- unsupported path separators;
- unsafe resource references.

### Runtime schema

Create a runtime schema using an existing validation library or a small explicit validator.

Export normalized domain types similar to:

```ts
export interface ArticleHeading {
  id: string;
  text: string;
  depth: number;
}

export type ArticleResourceType =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "other";

export interface ArticleResource {
  path: string;
  publicUrl: string;
  type: ArticleResourceType;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  coverUrl?: string;
  category?: string;
  tags: string[];
  featured: boolean;
  readingTimeMinutes: number;
}

export interface Article extends ArticleSummary {
  contentHtml: string;
  headings: ArticleHeading[];
  resources: ArticleResource[];
}
```

Do not expose raw front matter directly to UI components.

---

## 7. Phase 0 — Repository Inspection and Decisions

### Tasks

- Inspect repository files and commands.
- Identify whether the app is already initialized.
- Identify CSS and routing conventions.
- Determine whether content generation should run through a Vite plugin, a prebuild script, or a standalone script.
- Determine where generated assets and JSON should live.
- Document any deviations from this guide.

### Deliverable

Create or update an architecture note containing:

- package manager;
- build commands;
- source layout;
- generated-content location;
- content pipeline choice;
- testing tools;
- unresolved limitations.

### Acceptance criteria

- No implementation assumptions remain undocumented.
- Existing conventions have been identified.
- The repository still builds before feature work begins, or existing failures are recorded.

---

## 8. Phase 1 — Project Foundation

### Tasks

If required, configure:

- React and Vite;
- strict TypeScript;
- React Router;
- Tailwind CSS;
- linting and formatting;
- test runner;
- path aliases only when they improve clarity;
- global design tokens;
- light, dark, and system theme support.

Create a minimal application shell containing:

- header;
- main landmark;
- footer;
- route outlet;
- error boundary or route error element;
- not-found page.

### Theme requirements

- `light`, `dark`, and `system` modes;
- persist explicit preference;
- react to operating-system changes while in `system` mode;
- avoid theme flash before hydration/rendering;
- ensure readable contrast in both themes.

### Acceptance criteria

- The app starts locally.
- Routes render through a shared layout.
- Type checking passes.
- Light, dark, and system themes work.
- Keyboard focus is visible.
- A production build succeeds.

---

## 9. Phase 2 — Content Pipeline

Implement content processing before building article-dependent pages.

### Pipeline stages

```text
scan directories
  -> locate article.md
  -> parse front matter
  -> validate metadata
  -> normalize metadata
  -> calculate reading time
  -> resolve article-local resources
  -> parse Markdown
  -> extract headings
  -> sanitize HTML
  -> copy or map assets
  -> generate article documents
  -> generate summary index
  -> generate search index
```

### Generated artifacts

Generate at least:

```text
public/generated-content/articles.json
public/generated-content/articles/<slug>.json
```

`articles.json` should contain summaries only.

Each article document should contain normalized metadata, rendered content, heading data, and safe resource URLs.

### Processing requirements

- Sort articles deterministically.
- Exclude drafts in production.
- Emit clear validation errors with source paths.
- Resolve relative image, audio, video, and PDF paths.
- Preserve article isolation.
- Generate deterministic heading IDs.
- Handle repeated heading names.
- Sanitize output.
- Avoid executing arbitrary Markdown HTML or scripts.
- Fail the production build when published content is invalid.

### Example build error

```text
Content validation failed:
data/ai-agents/article.md
field "date" must be an ISO date; received "next Friday"
```

### Tests

Add unit tests for:

- metadata validation;
- slug safety;
- duplicate slug detection;
- date normalization;
- reading-time calculation;
- resource path resolution;
- heading ID generation;
- duplicate heading IDs;
- draft exclusion;
- generated sort order.

### Acceptance criteria

- A sample article is converted into generated JSON.
- The summary index does not include full article bodies.
- Invalid metadata causes a clear failure.
- Draft handling works.
- Resource paths work in the production build.
- Generated output is deterministic.

---

## 10. Phase 3 — Application Routing and Data Access

### Required routes

```text
/                         Homepage
/articles/:slug           Article reader
/categories               Category index
/categories/:category     Category detail
/timeline                  Timeline
/search                    Search
/about                     About
/*                         Not found
```

### Data access

Create a content repository module rather than fetching generated JSON throughout components.

Example API:

```ts
export interface ArticleRepository {
  listArticles(): Promise<ArticleSummary[]>;
  getArticle(slug: string): Promise<Article | null>;
  listCategories(): Promise<CategorySummary[]>;
  searchArticles(query: string): Promise<SearchResult[]>;
}
```

Use route-level code splitting where supported.

Provide explicit loading, error, empty, and not-found states.

### Acceptance criteria

- All routes load through the shared shell.
- Unknown article slugs produce a proper not-found state.
- Pages use repository functions rather than raw fetch calls.
- Route chunks are split in the production build.

---

## 11. Phase 4 — Magazine Homepage

The homepage must read as an editorial publication, not a uniform card dashboard.

### Page composition

1. navigation;
2. hero;
3. featured article or cover story;
4. editorial article grid;
5. category or topic highlights;
6. recent articles;
7. footer.

### Hero

Display:

- `Cyclopedia`;
- `A personal collection of knowledge.`;
- restrained visual treatment;
- optional static decorative background during MVP.

Do not block the MVP on Three.js.

### Featured article

Use the newest article marked `featured: true`.

If none exists, use the newest published article.

Display:

- cover;
- title;
- description;
- publication date;
- reading time;
- category;
- prominent article link.

### Article cards

Display:

- cover image;
- title;
- short description;
- publication date;
- reading time;
- category;
- tags where space permits.

Requirements:

- semantic links;
- stable image aspect ratios;
- responsive card arrangements;
- visible focus states;
- subtle hover behavior;
- no layout shift when images load.

### Responsive editorial layout

Use a deliberate hierarchy:

- one large featured story;
- secondary stories of medium prominence;
- compact recent-story cards.

Do not make every item visually equal.

### Acceptance criteria

- Homepage loads article summaries only.
- Featured fallback behavior works.
- Cards remain usable without hover.
- Mobile, tablet, desktop, and wide layouts are coherent.
- Keyboard navigation reaches every article.
- Cover failures produce stable fallbacks.

---

## 12. Phase 5 — Article Reader

### Required layout

Display:

- back navigation;
- title;
- description;
- publication and update dates;
- category and tags;
- reading time;
- cover image;
- article body;
- table of contents;
- reading progress;
- back-to-top action;
- previous and next article links.

### Reading ergonomics

- main prose width around 720–800 px;
- comfortable line height;
- responsive typography;
- clear heading hierarchy;
- readable code blocks;
- responsive media;
- no distracting background motion;
- sensible spacing around lists, quotes, tables, and figures.

### Table of contents

- derive from generated heading data;
- link to deterministic heading IDs;
- support keyboard use;
- indicate the active section where practical;
- collapse or relocate appropriately on small screens.

### Reading progress

- calculate progress from article content, not the entire page;
- update efficiently;
- avoid excessive scroll handlers;
- hide or simplify when JavaScript is unavailable.

### Previous and next articles

Use the same deterministic ordering as the global article index.

### Reading mode

Implement only after the standard reader works.

Reading mode should:

- hide non-essential navigation;
- retain an obvious exit action;
- exit on `Escape`;
- preserve keyboard focus;
- not hide essential document context from assistive technology.

### Acceptance criteria

- Every generated Markdown element is readable.
- Heading anchors and the table of contents match.
- Previous and next navigation is correct.
- Article-not-found behavior is explicit.
- Reading progress is accurate.
- The page works with keyboard navigation and reduced motion.

---

## 13. Phase 6 — Discovery Features

Implement discovery features after the basic homepage and reader are stable.

### Search

Search fields:

- title;
- description;
- category;
- tags;
- normalized article body text.

Initial search should be deterministic and local.

Requirements:

- title matches rank above body matches;
- query is reflected in the URL;
- keyboard-accessible result navigation;
- empty-query and no-result states;
- safe text highlighting without unsafe HTML injection;
- bounded index size;
- optional debounce based on measured need.

### Categories

Category index should display:

- category name;
- article count;
- optional representative cover;
- optional description when a category registry exists.

Category detail should display matching article summaries.

Treat absent categories consistently, such as `Uncategorized`, or omit them according to one documented rule.

### Timeline

Group published articles by:

```text
year -> month -> article
```

Use semantic lists or sections. Do not make the timeline dependent on animation.

### Sorting and filtering

Support:

- newest;
- oldest;
- title;
- reading time;
- category;
- tag;
- year.

Persist filters in the URL when practical.

### Pagination versus infinite scroll

Implement pagination first.

Add infinite scrolling only when there is a demonstrated need. Preserve navigability and browser history if it is introduced.

### Acceptance criteria

- Search finds expected title, tag, category, and body matches.
- Filter combinations are deterministic.
- URL state can reproduce search/filter results.
- Timeline ordering is correct.
- Empty states are clear.

---

## 14. Phase 7 — Markdown and Media Enhancements

Introduce features incrementally and test each transformation.

### Baseline Markdown

Support:

- headings;
- paragraphs;
- links;
- ordered and unordered lists;
- blockquotes;
- tables;
- task lists;
- fenced code blocks;
- GitHub Flavored Markdown.

### Code blocks

Add:

- syntax highlighting;
- copy button;
- optional filename metadata;
- horizontal scrolling;
- accessible copy feedback;
- optional line numbers;
- optional collapse for very long blocks.

Copy controls must work with keyboard input.

### Images

- lazy-load below the fold;
- preserve dimensions or aspect ratio;
- use useful alt text from Markdown;
- support an accessible lightbox only after standard images work;
- treat missing images gracefully.

### Video

- use native controls;
- avoid autoplay with sound;
- load metadata conservatively;
- provide fallback text.

### Audio

- use native controls initially;
- display meaningful labels;
- provide fallback text.

### PDF

- provide a direct open/download link;
- add inline preview only if browser support and accessibility are acceptable;
- do not make preview the only access method.

### Math, Mermaid, and footnotes

Add separately.

For Mermaid:

- render diagrams in a controlled container;
- sanitize configuration and content where possible;
- provide source or fallback text on failure;
- lazy-load the renderer.

### Acceptance criteria

- Each enabled Markdown extension has a fixture article and test.
- External links are handled safely.
- Media controls are keyboard-accessible.
- Missing resources do not crash the page.
- Heavy renderers are lazy-loaded.

---

## 15. Phase 8 — Motion and Three.js

Motion is an enhancement, not a dependency of comprehension.

### Framer Motion

Appropriate uses:

- page entrance;
- article-card stagger;
- image reveal;
- shared layout transitions;
- small hover-depth feedback.

Requirements:

- animations remain short and restrained;
- motion never delays navigation;
- content remains usable when animation fails;
- reduced-motion preference disables or simplifies effects.

### Three.js hero

Only implement after the static hero is complete.

Use a lazy-loaded, decorative scene such as:

- sparse particles;
- abstract geometry;
- slow procedural waves;
- subtle depth field.

Do not create constant high-contrast movement.

### Technical requirements

- isolate scene code under `src/three/`;
- lazy-load it only on routes that use it;
- provide a static CSS fallback;
- cap device pixel ratio;
- pause when offscreen or when the tab is hidden;
- avoid allocations in the render loop;
- dispose geometries, materials, textures, controls, and renderer;
- reduce complexity on mobile;
- disable or freeze non-essential motion under reduced-motion preference.

### Acceptance criteria

- Article routes do not load the Three.js bundle unnecessarily.
- Hero remains legible without WebGL.
- No obvious resource leak occurs during route changes.
- Mobile interaction remains responsive.
- Reduced-motion behavior is verified.

---

## 16. Phase 9 — Accessibility, Performance, SEO, and Testing

### Accessibility verification

Check:

- semantic page landmarks;
- one meaningful page-level heading;
- heading hierarchy;
- keyboard navigation;
- visible focus;
- accessible names for icon controls;
- image alt handling;
- dialog focus trapping;
- Escape behavior;
- contrast;
- reduced motion;
- no keyboard traps;
- screen-reader-compatible status messages.

Never use clickable `div` elements for links or buttons.

### Performance work

Prioritize:

- route splitting;
- summary-only homepage data;
- responsive images;
- below-fold lazy loading;
- stable media dimensions;
- lazy-loaded Markdown extensions;
- lazy-loaded Three.js;
- cacheable generated JSON and media;
- minimal JavaScript on article pages.

Do not virtualize ordinary article lists without evidence that rendering volume requires it.

### SEO

Implement:

- unique title and description per page;
- canonical article URL where deployment configuration permits;
- Open Graph metadata;
- article metadata;
- meaningful link text;
- sitemap generation where practical;
- RSS as a later independent feature;
- structured data only when accurately populated.

### Automated tests

Unit tests:

- content schema;
- article transforms;
- sorting/filtering;
- search ranking;
- resource resolution;
- reading time;
- heading IDs.

Component tests:

- article card;
- theme control;
- search form and results;
- table of contents;
- code copy control;
- media fallback;
- reading mode.

End-to-end tests:

1. load homepage;
2. open featured article;
3. navigate through the table of contents;
4. search for an article;
5. filter by category and tag;
6. switch themes;
7. use mobile navigation;
8. open a missing article;
9. use previous and next article links.

### Lighthouse target

Treat the following as release targets, not automatic guarantees:

- Performance: 95 or higher;
- Accessibility: 95 or higher;
- SEO: 95 or higher.

Record the tested route, device profile, and build mode with any score.

### Acceptance criteria

- Production build succeeds.
- Core workflows have automated coverage.
- No critical accessibility violations remain.
- Initial article pages do not load unnecessary Three.js code.
- Performance findings are based on a production build.

---

## 17. Phase 10 — Future Feature Extension Points

Do not implement these features in the MVP unless explicitly requested:

- bookmarks and favorites;
- reading history;
- recently viewed;
- semantic search;
- recommendations;
- knowledge graph;
- mind maps;
- collections;
- reading statistics and heatmaps;
- RSS;
- PDF export;
- PWA/offline mode;
- multilingual content;
- comments;
- version history;
- revision comparison.

Prepare for them through clean interfaces, not speculative implementations.

### Useful extension boundaries

```ts
export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

export interface ReadingStateStore {
  markOpened(slug: string): Promise<void>;
  getHistory(): Promise<ReadingHistoryEntry[]>;
}

export interface ArticleRelationProvider {
  getRelatedArticles(slug: string): Promise<ArticleSummary[]>;
}
```

Do not add empty classes, database layers, or network APIs merely to represent possible future work.

---

## 18. Suggested MVP Scope

The first release should contain:

- validated `data/` article directories;
- build-time article generation;
- summary index;
- responsive application shell;
- light/dark/system theme;
- magazine homepage;
- article reader;
- table of contents;
- syntax-highlighted code;
- image support;
- categories;
- timeline;
- local search;
- pagination;
- basic Framer Motion transitions;
- accessibility verification;
- production build and core tests.

Defer from the first release:

- Three.js if the static hero is not already polished;
- masonry layout;
- infinite scrolling;
- PDF inline rendering;
- Mermaid and math until the baseline Markdown pipeline is stable;
- knowledge graph;
- semantic search;
- user accounts or server persistence.

---

## 19. First Codex Work Order

Use this work order for the initial implementation session:

```markdown
Implement Phase 0 through Phase 2 of Cyclopedia.

Requirements:

1. Inspect the repository and reuse its existing package manager, scripts, and conventions.
2. Configure or verify strict TypeScript, routing foundation, styling foundation, and tests.
3. Implement a build-time content pipeline for `data/<slug>/article.md`.
4. Parse and validate front matter.
5. Generate a summary index and one article JSON document per article.
6. Calculate reading time when it is not provided.
7. Resolve article-local resources safely.
8. Extract deterministic heading IDs.
9. Sanitize rendered Markdown.
10. Exclude drafts from production output.
11. Add representative fixture articles and unit tests.
12. Run formatting, linting, type checking, tests, and production build using actual package scripts.

Do not implement the final homepage design, Three.js, semantic search, knowledge graph, or other future features in this work order.

At completion, report:

- files changed;
- architecture decisions;
- generated artifact format;
- commands run and their results;
- remaining limitations.
```

---

## 20. Subsequent Codex Work Orders

### Work Order A — Application shell and homepage

```markdown
Implement Phase 3 and Phase 4 using the existing generated article index.

Build the shared layout, required routes, navigation, hero, featured story, and responsive editorial homepage. Fetch content through a repository abstraction. Use article summaries only on the homepage. Include loading, empty, error, and image-fallback states. Add component tests and verify keyboard navigation.

Do not add Three.js yet. Use a polished static hero treatment.
```

### Work Order B — Article reader

```markdown
Implement Phase 5.

Build the article route and reading layout using generated article documents. Include metadata, cover, sanitized content, table of contents, reading progress, back-to-top action, and previous/next navigation. Preserve heading-anchor consistency and add responsive and keyboard behavior. Add tests for missing articles, table-of-contents links, and navigation ordering.
```

### Work Order C — Discovery

```markdown
Implement Phase 6.

Add local search, category pages, timeline, sorting, filtering, and pagination. Keep state reproducible through URL parameters. Rank title matches above body matches. Add deterministic tests for ranking, filtering, and date grouping. Do not add semantic search or infinite scrolling.
```

### Work Order D — Advanced content

```markdown
Implement Phase 7 incrementally.

Add code-block controls, responsive images, accessible lightbox behavior, video, audio, and PDF fallback links. Add math, Mermaid, and footnotes only as separate commits or coherent changes, with fixtures and tests for each feature. Lazy-load heavy renderers.
```

### Work Order E — Motion

```markdown
Implement Phase 8 only after the static experience is complete.

Add restrained Framer Motion transitions and an optional lazy-loaded Three.js hero scene. Respect reduced motion, provide a static fallback, dispose all WebGL resources, and ensure article routes do not load the Three.js bundle.
```

### Work Order F — Release hardening

```markdown
Implement Phase 9.

Audit accessibility, production performance, metadata, error handling, responsive behavior, and automated coverage. Run the production build and report measured findings. Fix substantive issues before cosmetic ones.
```

---

## 21. Definition of Done

A feature is complete only when:

- requested behavior is implemented;
- relevant data is validated;
- loading, empty, error, and fallback states are handled;
- keyboard interaction works;
- responsive behavior is checked;
- reduced-motion behavior is respected;
- tests cover important logic or behavior;
- lint and type checking pass;
- the production build passes;
- no unrelated changes are included;
- documentation is updated when architecture or content rules change.

---

## 22. Required Completion Report

Codex should finish each task with:

```markdown
## Implemented

- What was added or changed.

## Key decisions

- Important architecture and dependency choices.

## Files changed

- `path/to/file`: purpose.

## Verification

- `actual command`: passed or failed.

## Accessibility and responsive checks

- Checks performed and findings.

## Limitations

- Known limitations, deferred work, or `None`.
```

Use exact command results. Do not report an unexecuted check as successful.
