import { describe, expect, it } from 'vitest'
import { assertSafeResourcePath, assertSafeSlug, assertUniqueSlugs, buildArticle, calculateReadingTime, excludeProductionDrafts, extractHeadings, normalizeIsoDate, publicResourceUrl, sortArticles } from '../src/lib/content/content'

const sourcePath = 'data/example/article.md'
const valid = `---
title: Example
description: A valid article.
date: 2026-01-03
tags: [Test]
---
# Same
## Same
## Same
Words here.`

describe('content contract', () => {
  it('normalizes valid ISO dates and rejects calendar errors', () => {
    expect(normalizeIsoDate('2026-02-28', 'date')).toBe('2026-02-28')
    expect(() => normalizeIsoDate('2026-02-30', 'date')).toThrow('ISO date')
  })

  it('rejects unsafe slugs and article-local paths', () => {
    expect(() => assertSafeSlug('../outside')).toThrow('kebab-case')
    expect(() => assertSafeResourcePath('../secret.png')).toThrow('unsafe')
    expect(() => assertSafeResourcePath('/secret.png')).toThrow('unsafe')
    expect(assertSafeResourcePath('./resources/image.png')).toBe('resources/image.png')
    expect(publicResourceUrl('example', 'resources/image.png')).toBe('/generated-content/assets/example/resources/image.png')
    expect(() => publicResourceUrl('example', '../image.png')).toThrow('unsafe')
  })

  it('detects duplicate slugs', () => {
    expect(() => assertUniqueSlugs(['first', 'first'])).toThrow('duplicate slug')
  })

  it('calculates a minimum reading time while ignoring code', () => {
    expect(calculateReadingTime('```ts\n' + 'word '.repeat(1000) + '\n``` short text')).toBe(1)
    expect(calculateReadingTime('word '.repeat(401))).toBe(3)
  })

  it('creates deterministic unique heading IDs', () => {
    expect(extractHeadings('# Same\n## Same\n## Same')).toEqual([
      { id: 'same', text: 'Same', depth: 1 },
      { id: 'same-2', text: 'Same', depth: 2 },
      { id: 'same-3', text: 'Same', depth: 2 },
    ])
  })

  it('normalizes an article and sanitizes unsafe raw HTML', () => {
    const article = buildArticle({ slug: 'example', sourcePath, raw: `${valid}\n<script>alert(1)</script>`, resources: [] })
    expect(article.readingTimeMinutes).toBe(1)
    expect(article.headings).toHaveLength(3)
    expect(article.contentHtml).not.toContain('<script')
  })

  it('rejects missing required metadata', () => {
    expect(() => buildArticle({ slug: 'example', sourcePath, raw: '---\ntitle: Missing\ndate: 2026-01-01\ntags: []\n---\ntext', resources: [] })).toThrow('description')
  })

  it('filters drafts for production and uses deterministic date ordering', () => {
    const articles = [
      { slug: 'zeta', publishedAt: '2026-01-02', draft: false },
      { slug: 'alpha', publishedAt: '2026-01-02', draft: false },
      { slug: 'draft', publishedAt: '2026-02-01', draft: true },
    ]
    expect(excludeProductionDrafts(articles, true).map((article) => article.slug)).toEqual(['zeta', 'alpha'])
    expect(sortArticles(excludeProductionDrafts(articles, true)).map((article) => article.slug)).toEqual(['alpha', 'zeta'])
    expect(excludeProductionDrafts(articles, false)).toHaveLength(3)
  })
})
