I think this project can become much more than a “blog.” From your description, it is closer to a personal knowledge magazine or digital library.

The architecture I’d recommend is:

project/
│
├── data/                   # Raw articles (source of truth)
│   ├── ai-agent/
│   │   ├── article.md
│   │   ├── cover.png
│   │   ├── meta.json       # optional
│   │   └── resources/
│   │       ├── image1.png
│   │       ├── video.mp4
│   │       └── audio.mp3
│   │
│   ├── distributed-system/
│   │   ├── article.md
│   │   ├── cover.jpg
│   │   └── resources/
│   │
│   └── ...
│
├── frontend/
│
└── scripts/

I also would not make metadata mandatory inside JSON. Since everything is Markdown anyway, I’d use FrontMatter.

Example:

---
title: AI Agents from First Principles
description: How autonomous agents work internally.
date: 2026-07-12
cover: cover.png
tags:
  - AI
  - LLM
  - Agent
category: Artificial Intelligence
featured: true
readingTime: 15
---
# AI Agents
...

This makes every article completely self-contained.

⸻

Below is the first version of the requirement document for Codex

# Personal Knowledge Magazine
## Project Goal
Develop a modern personal article collection website.
This website is **not a traditional blog**. It should feel more like reading a high-quality digital magazine or an interactive encyclopedia.
The website serves as a long-term knowledge base for storing articles written in Markdown.
The overall visual style should be minimal, elegant, smooth, and modern.
Technology Stack:
- React
- TypeScript
- Vite
- Three.js (for background and interactive effects)
- Framer Motion
- TailwindCSS
- React Router
---
# Data Organization
The raw articles are stored under
```
data/
```
Each article occupies one directory.
Example:
```
data/
    ai-agent/
        article.md
        cover.png
        resources/
            architecture.png
            demo.mp4
            narration.mp3
    distributed-system/
        article.md
        cover.jpg
        resources/
```
The markdown file is the source of truth.
The markdown contains FrontMatter.
Example:
```markdown
---
title: AI Agent
description: Understanding autonomous AI agents.
date: 2026-07-10
cover: cover.png
category: Artificial Intelligence
tags:
  - AI
  - Agent
featured: true
readingTime: 20
---
```
---
# Homepage
The homepage should resemble a magazine.
Requirements:
- Large hero section
- Smooth scrolling
- Beautiful typography
- Card-based article layout
- Responsive design
Each article card includes
- Cover image
- Title
- Description
- Publish date
- Reading time
- Category
- Tags
Hover animations should feel premium.
Cards should have subtle depth.
---
# Hero Section
The top section should include
Large title
Example
```
Cyclopedia
```
Subtitle
```
A personal collection of knowledge.
```
Animated background using Three.js.
Possible effects
- floating particles
- stars
- abstract geometry
- animated waves
- procedural noise
Avoid distracting animations.
Animation should remain subtle.
---
# Navigation
Top navigation bar.
Contains
- Home
- Categories
- Timeline
- Search
- About
Navbar becomes transparent initially.
Turns into blurred glass while scrolling.
---
# Article List
Supports
- Infinite scrolling
- Pagination
- Grid layout
- Masonry layout (optional)
Sort by
- newest
- oldest
- title
- reading time
Filter by
- category
- tags
- year
---
# Article Page
When opening an article
Display
Large cover
Title
Metadata
Content
Table of Contents
Estimated reading time
Previous / Next article
Back button
---
# Markdown Support
Support
# headings
## subheadings
Lists
Tables
Code blocks
Math formulas
Mermaid diagrams
Footnotes
Blockquotes
Task lists
Syntax highlighting
GitHub flavored markdown
---
# Media Support
Images
Responsive images.
Lightbox when clicked.
Lazy loading.
Videos
Embedded video player.
Audio
Embedded audio player.
PDF
Inline preview.
---
# Code Blocks
Support
- Copy button
- Syntax highlighting
- Line numbers
- Filename
- Collapse for very long code
---
# Search
Local search.
Search
- title
- tags
- category
- content
Highlight keywords.
Instant search.
---
# Categories
Dedicated category page.
Each category displays
- cover
- description
- article count
---
# Timeline
Visual timeline.
Display all articles by publication date.
Supports
- year
- month
---
# Reading Experience
Focus on readability.
Maximum content width
```
800px
```
Typography
Comfortable line height.
Smooth scrolling.
Reading progress bar.
Back to top button.
Image zoom.
---
# Theme
Support
Light
Dark
System
Remember user preference.
---
# Animations
Use Framer Motion.
Examples
- fade
- slide
- stagger children
- shared layout animation
Three.js used only where appropriate.
Never reduce reading performance.
---
# Performance
Requirements
Image lazy loading.
Route splitting.
Component lazy loading.
Markdown caching.
Virtualized article list.
Target Lighthouse
Performance >95
Accessibility >95
SEO >95
---
# Accessibility
Keyboard navigation.
ARIA labels.
Proper heading hierarchy.
High contrast.
Screen reader compatibility.
---
# Responsive
Desktop
Tablet
Mobile
Large monitor
---
# Future Features
The architecture should allow adding
Bookmarks
Favorites
Reading history
Recently viewed
Full-text search
AI semantic search
Article recommendation
Related articles
Knowledge graph visualization
Mind map
Collections
Reading statistics
RSS
Export PDF
Offline mode (PWA)
Multi-language support
Comment system
Version history
Article revision comparison
---
# Folder Structure
```
src/
components/
pages/
hooks/
layouts/
animations/
three/
markdown/
search/
theme/
utils/
types/
assets/
styles/
```
---
# Coding Principles
Use TypeScript strictly.
Avoid unnecessary dependencies.
Prefer reusable components.
Separate UI from data logic.
Use functional components.
Use React hooks.
Keep code modular.
Follow clean architecture.
Ensure maintainability.
```

⸻

Some additional ideas that would make the project much more impressive

1. Reading Mode

A distraction-free mode:

* Hide navigation
* Hide sidebar
* Only article remains
* Press Esc to exit

⸻

2. Knowledge Graph

Imagine every article connected by tags.

Operating System
      |
Linux ---- Docker
      |
Kubernetes
      |
Distributed System

This could later be rendered with d3.js or Three.js.

⸻

3. Reading Heatmap

Show which articles have been read.

██████████ AI
██████     Rust
██         Linux
███████    ML

⸻

4. Interactive Timeline

Instead of a list:

2026
● Jan
● Feb
● Mar
● Apr
──────────────
2025
● ...

⸻

5. Magazine-style Homepage

Rather than identical cards, feature one “cover story”:

+-------------------------------------------------------+
|                                                       |
|               Featured Article                        |
|               Large Cover Image                       |
|                                                       |
+-------------------------------------------------------+
+----------------+ +----------------+
| Article A      | | Article B      |
+----------------+ +----------------+
+----------------+ +----------------+
| Article C      | | Article D      |
+----------------+ +----------------+

This layout creates a stronger first impression.

Overall, I would define this project as a personal digital knowledge system rather than simply an article website. The initial requirements already support future extensions such as semantic search, knowledge graphs, and AI-assisted exploration without requiring major architectural changes later.