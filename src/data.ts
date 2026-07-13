import type { Article as GeneratedArticle, ArticleSummary } from './lib/content/types'
import type { Article, Category, SiteSettings } from './types'

async function loadJson<T>(url: string, fallback: T): Promise<T> {
  try { const response = await fetch(url); return response.ok ? await response.json() as T : fallback } catch { return fallback }
}
const summaries = await loadJson<ArticleSummary[]>('/generated-content/articles.json', [])
const documents = await Promise.all(summaries.map(({ slug }) => loadJson<GeneratedArticle | null>(`/generated-content/articles/${slug}.json`, null)))
export const site = await loadJson<SiteSettings>('/generated-content/settings.json', { categories: [] })
export const articles: Article[] = documents.flatMap((article) => article ? [{ slug: article.slug, title: article.title, description: article.description, date: article.publishedAt, ...(article.updatedAt ? { updated: article.updatedAt } : {}), category: article.category ?? 'Uncategorized', tags: article.tags, readingTime: article.readingTimeMinutes, featured: article.featured, cover: article.coverUrl, contentHtml: article.contentHtml, headings: article.headings }] : [])
const articleCategories = new Set(articles.map(({ category }) => category))
export const categoryDetails: Category[] = [...site.categories, ...[...articleCategories].filter((name) => !site.categories.some((category) => category.name === name)).map((name) => ({ name }))]
export const categories = categoryDetails.map(({ name }) => name)
