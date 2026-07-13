import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertUniqueSlugs, buildArticle, excludeProductionDrafts, sortArticles } from '../src/lib/content/content'
import type { Article, ArticleSummary } from '../src/lib/content/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = join(root, 'data')
const outputDirectory = join(root, 'public', 'generated-content')

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const target = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(target) : [target]
  }))
  return paths.flat()
}

function toSummary(article: Article): ArticleSummary {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    ...(article.updatedAt ? { updatedAt: article.updatedAt } : {}),
    ...(article.coverUrl ? { coverUrl: article.coverUrl } : {}),
    ...(article.category ? { category: article.category } : {}),
    tags: article.tags,
    featured: article.featured,
    readingTimeMinutes: article.readingTimeMinutes,
  }
}

function withoutDraft(article: Article & { draft: boolean }): Article {
  return Object.fromEntries(Object.entries(article).filter(([key]) => key !== 'draft')) as Article
}

export async function generateContent(options: { includeDrafts?: boolean } = {}): Promise<ArticleSummary[]> {
  const entries = await readdir(dataDirectory, { withFileTypes: true })
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
  const articles = await Promise.all(directories.map(async (slug) => {
    const articleDirectory = join(dataDirectory, slug)
    const sourcePath = join(articleDirectory, 'article.md')
    const files = await filesIn(articleDirectory)
    const resources = files.filter((file) => file !== sourcePath).map((file) => relative(articleDirectory, file).replaceAll('\\', '/')).sort()
    return buildArticle({ slug, sourcePath: relative(root, sourcePath), raw: await readFile(sourcePath, 'utf8'), resources })
  }))
  assertUniqueSlugs(articles.map((article) => article.slug))
  const published = sortArticles(excludeProductionDrafts(articles, !options.includeDrafts))
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(join(outputDirectory, 'articles'), { recursive: true })
  await Promise.all(published.map(async (entry) => {
    const article = withoutDraft(entry)
    await writeFile(join(outputDirectory, 'articles', `${article.slug}.json`), `${JSON.stringify(article, null, 2)}\n`)
    await cp(join(dataDirectory, article.slug), join(outputDirectory, 'assets', article.slug), { recursive: true, filter: (source) => !source.endsWith('article.md') })
  }))
  const summaries = published.map((article) => toSummary(withoutDraft(article)))
  await writeFile(join(outputDirectory, 'articles.json'), `${JSON.stringify(summaries, null, 2)}\n`)
  const categories = await readFile(join(dataDirectory, 'categories.json'), 'utf8').then((value) => JSON.parse(value) as unknown).catch(() => [])
  const site = await readFile(join(dataDirectory, 'site.json'), 'utf8').then((value) => JSON.parse(value) as unknown).catch(() => ({}))
  await writeFile(join(outputDirectory, 'settings.json'), `${JSON.stringify({ categories, ...((site && typeof site === 'object') ? site : {}) }, null, 2)}\n`)
  return summaries
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedDirectly) {
  generateContent({ includeDrafts: process.argv.includes('--include-drafts') })
    .then((summaries) => console.log(`Generated ${summaries.length} articles.`))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? `Content validation failed:\n${error.message}` : error)
      process.exitCode = 1
    })
}
