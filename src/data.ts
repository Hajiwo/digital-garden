import type { Article as GeneratedArticle, ArticleSummary } from './lib/content/types'
import { buildTagIndex } from './lib/content/tags'
import type { Article, SiteSettings } from './types'

async function loadJson<T>(url: string, fallback: T): Promise<T> {
  try { const response = await fetch(url, { cache: 'no-store' }); return response.ok ? await response.json() as T : fallback } catch { return fallback }
}
const appBase = import.meta.env.BASE_URL
const contentUrl = (path: string) => `${appBase}${path.replace(/^\/+/, '')}`
const assetUrl = (url?: string) => url?.startsWith('/') ? contentUrl(url) : url
const contentHtmlUrl = (html: string) => html.replace(/(["'(])\/(generated-content|background)\//g, `$1${appBase}$2/`)
const summaries = await loadJson<ArticleSummary[]>(contentUrl('/generated-content/articles.json'), [])
const documents = await Promise.all(summaries.map(({ slug }) => loadJson<GeneratedArticle | null>(contentUrl(`/generated-content/articles/${slug}.json`), null)))
const loadedSite = await loadJson<SiteSettings>(contentUrl('/generated-content/settings.json'), { categories: [] })
export const site = { ...loadedSite, ...(loadedSite.background ? { background: assetUrl(loadedSite.background) } : {}) }
export const articles: Article[] = documents.flatMap((article) => article ? [{ slug: article.slug, title: article.title, description: article.description, date: article.publishedAt, ...(article.updatedAt ? { updated: article.updatedAt } : {}), category: article.category ?? 'Uncategorized', tags: article.tags, readingTime: article.readingTimeMinutes, featured: article.featured, cover: assetUrl(article.coverUrl), originalUrl: article.originalUrl, contentHtml: contentHtmlUrl(article.contentHtml), headings: article.headings }] : [])
const tagIndex = buildTagIndex(articles)
export const categories = tagIndex.categories
export const categoryCounts = tagIndex.counts
export const tags = tagIndex.allTags
