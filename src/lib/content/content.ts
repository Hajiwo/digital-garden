import matter from 'gray-matter'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import type { Article, ArticleHeading, ArticleResource, ArticleResourceType, BuildArticleInput } from './types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const WORDS_PER_MINUTE = 200

export class ContentValidationError extends Error {
  constructor(message: string, readonly sourcePath?: string) {
    super(sourcePath ? `${sourcePath}: ${message}` : message)
    this.name = 'ContentValidationError'
  }
}

type FrontMatter = Record<string, unknown>

function asNonEmptyString(value: unknown, field: string, sourcePath: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new ContentValidationError(`field "${field}" must be a non-empty string`, sourcePath)
  return value.trim()
}

export function normalizeIsoDate(value: unknown, field: string, sourcePath = 'article.md'): string {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10)
  const date = asNonEmptyString(value, field, sourcePath)
  if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`)) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
    throw new ContentValidationError(`field "${field}" must be an ISO date; received "${date}"`, sourcePath)
  }
  return date
}

export function assertSafeSlug(slug: string, sourcePath = 'data'): string {
  if (!/^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u.test(slug)) {
    throw new ContentValidationError('article slug must contain only letters, numbers, and single hyphens', sourcePath)
  }
  return slug
}

export function assertSafeResourcePath(value: string, sourcePath = 'article.md'): string {
  if (!value || value.startsWith('/') || value.includes('\\') || value.split('/').includes('..')) {
    throw new ContentValidationError(`unsafe article-local resource path "${value}"`, sourcePath)
  }
  return value.replace(/^\.\//, '')
}

export function publicResourceUrl(slug: string, path: string): string {
  return `/generated-content/assets/${assertSafeSlug(slug)}/${assertSafeResourcePath(path)}`
}

export function assertUniqueSlugs(slugs: string[]): void {
  const seen = new Set<string>()
  for (const slug of slugs) {
    if (seen.has(slug)) throw new ContentValidationError(`duplicate slug "${slug}"`)
    seen.add(slug)
  }
}

export function sortArticles<T extends { publishedAt: string; slug: string }>(articles: T[]): T[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug))
}

export function excludeProductionDrafts<T extends { draft: boolean }>(articles: T[], isProduction: boolean): T[] {
  return isProduction ? articles.filter((article) => !article.draft) : articles
}

export function calculateReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]/g, ' ')
  const cjkCount = (text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) ?? []).length
  const nonCjkText = text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
  const wordCount = nonCjkText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE + cjkCount / 400))
}

export function extractHeadings(markdown: string): ArticleHeading[] {
  const counts = new Map<string, number>()
  let inFence = false
  return markdown.split('\n').flatMap((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return [] }
    if (inFence) return []
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) return []
    const text = match[2].replace(/[*_`]/g, '').trim()
    const base = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/(^-|-$)/g, '') || 'section'
    const occurrence = counts.get(base) ?? 0
    counts.set(base, occurrence + 1)
    return [{ id: occurrence ? `${base}-${occurrence + 1}` : base, text, depth: match[1].length }]
  })
}

export function resourceType(path: string): ArticleResourceType {
  const extension = path.split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'].includes(extension ?? '')) return 'image'
  if (['mp4', 'webm', 'mov', 'ogv'].includes(extension ?? '')) return 'video'
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension ?? '')) return 'audio'
  if (extension === 'pdf') return 'pdf'
  return 'other'
}

function inferTitle(data: FrontMatter, body: string, slug: string): string {
  if (typeof data.title === 'string' && data.title.trim()) return data.title.trim()
  const heading = /^#\s+(.+?)\s*#*\s*$/m.exec(body)?.[1]?.trim()
  if (heading) return heading.replace(/[*_`]/g, '')
  return slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function inferDescription(data: FrontMatter, body: string): string {
  for (const field of ['description', 'summary', 'excerpt', 'abstract']) {
    const value = data[field]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  const paragraph = body.split(/\n\s*\n/).map((block) => block.trim()).find((block) => block && !/^(#{1,6}\s|```|~~~|!\[|<)/.test(block)) ?? 'Imported Markdown article.'
  const plain = paragraph.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`>#~]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > 180 ? `${plain.slice(0, 179).trim()}…` : plain
}

function normalizeTags(data: FrontMatter, sourcePath: string): string[] {
  const value = data.tags ?? data.keywords ?? data.topics
  if (value === undefined || value === null || value === '') return []
  if (typeof value === 'string') return value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string')) throw new ContentValidationError('field "tags" must be a string or an array of strings', sourcePath)
  return value.flatMap((tag) => String(tag).split(/[,，]/)).map((tag) => tag.trim()).filter(Boolean)
}

function normalizeOriginalUrl(data: FrontMatter, sourcePath: string): string | undefined {
  const value = data.original_link ?? data.originalUrl ?? data.source
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new ContentValidationError('field "original_link" must be a URL string', sourcePath)
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsafe protocol')
    return url.toString()
  } catch {
    throw new ContentValidationError('field "original_link" must be a valid http or https URL', sourcePath)
  }
}

function normalizeMetadata(data: FrontMatter, body: string, input: BuildArticleInput): Omit<Article, 'contentHtml' | 'headings' | 'resources'> {
  const title = inferTitle(data, body, input.slug)
  const description = inferDescription(data, body)
  const tags = normalizeTags(data, input.sourcePath)
  const originalUrl = normalizeOriginalUrl(data, input.sourcePath)
  const providedReadingTime = data.readingTime
  if (providedReadingTime !== undefined && (typeof providedReadingTime !== 'number' || !Number.isFinite(providedReadingTime) || providedReadingTime <= 0)) {
    throw new ContentValidationError('field "readingTime" must be a positive number', input.sourcePath)
  }
  const readingTime = typeof providedReadingTime === 'number' ? providedReadingTime : calculateReadingTime(body)
  const cover = data.cover === undefined ? undefined : assertSafeResourcePath(asNonEmptyString(data.cover, 'cover', input.sourcePath), input.sourcePath)
  if (cover && !input.resources.includes(cover)) throw new ContentValidationError(`cover resource "${cover}" does not exist`, input.sourcePath)
  if (data.featured !== undefined && typeof data.featured !== 'boolean') throw new ContentValidationError('field "featured" must be a boolean', input.sourcePath)
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new ContentValidationError('field "draft" must be a boolean', input.sourcePath)
  return {
    slug: assertSafeSlug(input.slug, input.sourcePath),
    title,
    description,
    publishedAt: normalizeIsoDate(data.date ?? data.publishedAt ?? data.published ?? data.created ?? data.downloaded ?? '1970-01-01', 'date', input.sourcePath),
    ...(data.updated === undefined ? {} : { updatedAt: normalizeIsoDate(data.updated, 'updated', input.sourcePath) }),
    ...(cover ? { coverUrl: publicResourceUrl(input.slug, cover) } : {}),
    ...(originalUrl ? { originalUrl } : {}),
    ...(data.category === undefined ? {} : { category: asNonEmptyString(data.category, 'category', input.sourcePath) }),
    tags,
    featured: data.featured === true,
    readingTimeMinutes: readingTime,
  }
}

function rewriteLocalLinks(markdown: string, slug: string): string {
  return markdown.replace(/(!?\[[^\]]*\]\()([^\s)]+)(\))/g, (whole, start, target, end) => {
    if (/^(https?:|mailto:|#)/i.test(target)) return whole
    const safe = assertSafeResourcePath(target)
    return `${start}${publicResourceUrl(slug, safe)}${end}`
  })
}

function renderMarkdown(markdown: string, headings: ArticleHeading[]): string {
  let headingIndex = 0
  const renderer = new marked.Renderer()
  renderer.heading = ({ text, depth }) => {
    const heading = headings[headingIndex++]
    return `<h${depth} id="${heading?.id ?? 'section'}">${text}</h${depth}>`
  }
  const unsafeHtml = marked.parse(markdown, { renderer, gfm: true, breaks: false, async: false }) as string
  return sanitizeHtml(unsafeHtml, {
    allowedTags: ['a', 'audio', 'blockquote', 'br', 'code', 'del', 'details', 'div', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'li', 'ol', 'p', 'pre', 'source', 'span', 'strong', 'summary', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul', 'video'],
    allowedAttributes: { '*': ['id', 'class'], a: ['href', 'title'], audio: ['controls', 'src'], img: ['src', 'alt', 'title', 'width', 'height', 'loading'], source: ['src', 'type'], video: ['controls', 'src', 'poster', 'width', 'height'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  })
}

export function buildArticle(input: BuildArticleInput): Article & { draft: boolean } {
  const parsed = matter(input.raw)
  const metadata = normalizeMetadata(parsed.data, parsed.content, input)
  const resources: ArticleResource[] = [...new Set(input.resources)].sort().map((path) => ({ path, publicUrl: publicResourceUrl(input.slug, path), type: resourceType(path) }))
  const headings = extractHeadings(parsed.content)
  return { ...metadata, contentHtml: renderMarkdown(rewriteLocalLinks(parsed.content, input.slug), headings), headings, resources, draft: parsed.data.draft === true }
}
