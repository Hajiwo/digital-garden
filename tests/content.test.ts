import { describe, expect, it } from 'vitest'
import { assertSafeResourcePath, assertSafeSlug, assertUniqueSlugs, buildArticle, calculateReadingTime, excludeProductionDrafts, extractHeadings, normalizeIsoDate, publicResourceUrl, sortArticles } from '../src/lib/content/content'
import { buildTagIndex } from '../src/lib/content/tags'
import { deriveArticleSlug, slugifyArticleName } from '../src/lib/content/discovery'

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
    expect(() => assertSafeSlug('../outside')).toThrow('letters, numbers')
    expect(() => assertSafeResourcePath('../secret.png')).toThrow('unsafe')
    expect(() => assertSafeResourcePath('/secret.png')).toThrow('unsafe')
    expect(assertSafeResourcePath('./resources/image.png')).toBe('resources/image.png')
    expect(publicResourceUrl('example', 'resources/image.png')).toBe('/generated-content/assets/example/resources/image.png')
    expect(() => publicResourceUrl('example', '../image.png')).toThrow('unsafe')
  })

  it('detects duplicate slugs', () => {
    expect(() => assertUniqueSlugs(['first', 'first'])).toThrow('duplicate slug')
  })

  it('derives stable slugs from arbitrary Markdown filenames and folders', () => {
    expect(deriveArticleSlug('from Internet', 'notes.md', 1)).toBe('from-internet')
    expect(deriveArticleSlug('research', 'article.md', 2)).toBe('research')
    expect(deriveArticleSlug('research', 'Vision Notes.md', 2)).toBe('research-vision-notes')
    expect(deriveArticleSlug('研究资料', '视觉.md', 2)).toBe('研究资料-视觉')
    expect(slugifyArticleName('  My New_Post  ')).toBe('my-new-post')
  })

  it('renders image URLs followed by an outer link', () => {
    const article = buildArticle({ slug: 'image-note', sourcePath, raw: '![Portrait](https://example.com/image.avif,%20/alternate.avif)(https://example.com/source)', resources: [] })
    expect(article.contentHtml).toContain('<a href="https://example.com/source">')
    expect(article.contentHtml).toContain('<img src="https://example.com/image.avif" alt="Portrait"')
  })

  it('accepts a remote cover image and selects its first source', () => {
    const article = buildArticle({ slug: 'remote-cover', sourcePath, raw: '---\ncover: https://example.com/cover.avif,%20/alternate.avif\n---\n# Remote cover', resources: [] })
    expect(article.coverUrl).toBe('https://example.com/cover.avif')
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

  it('infers metadata for plain Markdown without front matter', () => {
    const article = buildArticle({ slug: 'plain-note', sourcePath, raw: '# A Plain Note\n\nThis first paragraph becomes the description.\n\n## Details\n\nMore text.', resources: [] })
    expect(article.title).toBe('A Plain Note')
    expect(article.description).toBe('This first paragraph becomes the description.')
    expect(article.publishedAt).toBe('1970-01-01')
    expect(article.tags).toEqual([])
  })

  it('accepts common exported metadata such as a Zhihu answer', () => {
    const raw = '---\ntitle: 为什么越聪明的人越单纯？\nauthor: 理性情绪实验室\ntype: zhihu-answer\nsource: https://www.zhihu.com/example\ndownloaded: 2026-07-13\n---\n第一段内容会自动成为文章的描述，不再要求手动填写 description。\n\n## 第一个机制：认知资源\n\n正文。'
    const article = buildArticle({ slug: 'zhihu', sourcePath, raw, resources: [] })
    expect(article.publishedAt).toBe('2026-07-13')
    expect(article.description).toContain('第一段内容')
    expect(article.headings[0].id).toBe('第一个机制-认知资源')
    expect(article.originalUrl).toBe('https://www.zhihu.com/example')
  })

  it('rejects unsafe original links', () => {
    const raw = '---\ntitle: Unsafe\noriginal_link: javascript:alert(1)\n---\nText.'
    expect(() => buildArticle({ slug: 'unsafe', sourcePath, raw, resources: [] })).toThrow('valid http or https URL')
  })

  it('calculates reading time for CJK text', () => {
    expect(calculateReadingTime('汉'.repeat(801))).toBe(3)
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

  it('derives categories and counts dynamically from distinct tags', () => {
    expect(buildTagIndex([{ tags: ['AI', 'Agents'] }, { tags: ['AI', 'Design'] }, { tags: [] }])).toEqual({ categories: ['Agents', 'AI', 'Design'], counts: { Agents: 1, AI: 2, Design: 1 } })
  })
})
