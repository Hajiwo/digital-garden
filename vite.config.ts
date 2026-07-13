import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import matter from 'gray-matter'
import { defineConfig, type Plugin } from 'vite'
import { generateContent } from './scripts/build-content'
import { assertSafeResourcePath, assertSafeSlug } from './src/lib/content/content'

const root = dirname(fileURLToPath(import.meta.url))
const dataDirectory = join(root, 'data')
const backgroundDirectory = join(root, 'public', 'background')
const categoriesFile = join(dataDirectory, 'categories.json')
const siteFile = join(dataDirectory, 'site.json')
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

type Category = { name: string; description?: string }
type Upload = { path: string; data: string }
type AboutSettings = { eyebrow?: string; title?: string; intro?: string; body?: string; quote?: string; quoteAuthor?: string; linkLabel?: string; linkUrl?: string; ctaLabel?: string; ctaUrl?: string }
type EditableSite = { background?: string; title?: string; description?: string; about?: AboutSettings }

async function readJson<T>(path: string, fallback: T): Promise<T> {
  return readFile(path, 'utf8').then((value) => JSON.parse(value) as T).catch(() => fallback)
}

async function requestJson(request: NodeJS.ReadableStream): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk as Uint8Array)
    size += buffer.length
    if (size > 30 * 1024 * 1024) throw new Error('Request is larger than the 30 MB developer-mode limit.')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
}

function writeResponse(response: import('node:http').ServerResponse, status: number, body: unknown): void {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

async function markdownFilesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.')) return markdownFilesIn(path)
    return entry.isFile() && extname(entry.name).toLowerCase() === '.md' ? [path] : []
  }))
  return files.flat()
}

async function articleFiles(): Promise<string[]> {
  const entries = await readdir(dataDirectory, { withFileTypes: true })
  const directories = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  return (await Promise.all(directories.map((entry) => markdownFilesIn(join(dataDirectory, entry.name))))).flat().sort()
}

async function updateArticleCategory(from: string, to?: string): Promise<void> {
  for (const file of await articleFiles()) {
    const raw = await readFile(file, 'utf8')
    const parsed = matter(raw)
    if (parsed.data.category !== from) continue
    if (to) parsed.data.category = to
    else delete parsed.data.category
    await writeFile(file, matter.stringify(parsed.content, parsed.data))
  }
}

async function developerState() {
  const categories = await readJson<Category[]>(categoriesFile, [])
  const site = await readJson<EditableSite>(siteFile, {})
  const about = site.about ?? {}
  const generatedArticles = await readJson<Array<{ tags?: string[] }>>(join(root, 'public', 'generated-content', 'articles.json'), [])
  const tagCounts = new Map<string, number>()
  for (const article of generatedArticles) for (const tag of article.tags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  const backgrounds = await readdir(backgroundDirectory, { withFileTypes: true }).catch(() => [])
  const articles = await articleFiles()
  return {
    categories,
    tags: [...tagCounts].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count })),
    background: site.background ?? '',
    siteTitle: site.title ?? 'Read++',
    siteDescription: site.description ?? 'Ideas worth keeping, thoughtfully collected.\nA living library of technology, systems, and design.',
    about: {
      eyebrow: about.eyebrow ?? 'ABOUT THIS PLACE',
      title: about.title ?? 'A library for the\nperpetually curious.',
      intro: about.intro ?? 'Read++ is a personal digital knowledge system: part magazine, part garden, part long-term memory.',
      body: about.body ?? 'It collects considered writing about technology, software, design, and the ideas that connect them. Nothing here chases a feed. The goal is slower and more durable—to make complex subjects approachable and worth returning to.',
      quote: about.quote ?? '“We write to taste life twice, in the moment and in retrospect.”',
      quoteAuthor: about.quoteAuthor ?? '— Anaïs Nin',
      linkLabel: about.linkLabel ?? '',
      linkUrl: about.linkUrl ?? '',
      ctaLabel: about.ctaLabel ?? 'Enter the library',
      ctaUrl: about.ctaUrl ?? '/explore',
    },
    backgrounds: backgrounds.filter((entry) => entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase())).map((entry) => `/background/${entry.name}`).sort(),
    articleCount: articles.length,
  }
}

function developerPlugin(): Plugin {
  return {
    name: 'cyclopedia-developer-mode',
    apply: 'serve',
    configureServer(server) {
      let refreshPromise: Promise<unknown> | undefined
      const refreshContent = () => {
        if (!refreshPromise) refreshPromise = generateContent({ includeDrafts: true }).finally(() => { refreshPromise = undefined })
        return refreshPromise
      }
      server.watcher.on('all', (_event, changedPath) => {
        const normalizedPath = resolve(changedPath)
        if (normalizedPath === dataDirectory || normalizedPath.startsWith(`${dataDirectory}/`)) void refreshContent().catch((error: unknown) => console.error('Content refresh failed:', error))
      })
      server.middlewares.use(async (request, response, next) => {
        const acceptsHtml = request.headers.accept?.includes('text/html')
        if (request.method !== 'GET' || !acceptsHtml || request.url?.startsWith('/__developer/')) return next()
        try {
          await refreshContent()
          return next()
        } catch (error) {
          return writeResponse(response, 500, { error: error instanceof Error ? `Content refresh failed: ${error.message}` : 'Content refresh failed.' })
        }
      })
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/__developer/')) return next()
        try {
          const action = request.url.slice('/__developer/'.length).split('?')[0]
          if (request.method === 'GET' && action === 'state') return writeResponse(response, 200, await developerState())
          if (request.method !== 'POST') return writeResponse(response, 405, { error: 'Method not allowed.' })
          const body = await requestJson(request)
          if (action === 'rebuild') {
            const summaries = await generateContent({ includeDrafts: true })
            return writeResponse(response, 200, { ok: true, count: summaries.length })
          }
          if (action === 'import') {
            const slug = assertSafeSlug(String(body.slug ?? ''))
            const uploads = body.files as Upload[]
            if (!Array.isArray(uploads) || uploads.length === 0) throw new Error('Choose a folder containing at least one Markdown file.')
            const target = join(dataDirectory, slug)
            if (await stat(target).then(() => true).catch(() => false)) throw new Error(`An article folder named "${slug}" already exists.`)
            const temporary = await mkdtemp(join(dataDirectory, '.import-'))
            try {
              for (const upload of uploads) {
                const relativePath = assertSafeResourcePath(String(upload.path ?? ''))
                const destination = resolve(temporary, relativePath)
                if (!destination.startsWith(`${temporary}/`)) throw new Error(`Unsafe upload path: ${relativePath}`)
                await mkdir(dirname(destination), { recursive: true })
                await writeFile(destination, Buffer.from(String(upload.data ?? ''), 'base64'))
              }
              const markdownPaths = uploads.map((upload) => assertSafeResourcePath(upload.path)).filter((path) => path.toLowerCase().endsWith('.md'))
              if (!markdownPaths.length) throw new Error('The selected folder must contain at least one Markdown file.')
              await rename(temporary, target)
              try { await generateContent({ includeDrafts: true }) }
              catch (error) { await rm(target, { recursive: true, force: true }); await generateContent({ includeDrafts: true }); throw error }
            } catch (error) {
              await rm(temporary, { recursive: true, force: true })
              throw error
            }
            return writeResponse(response, 200, { ok: true, slug })
          }
          if (action === 'category') {
            const operation = String(body.operation ?? '')
            const categories = await readJson<Category[]>(categoriesFile, [])
            const name = String(body.name ?? '').trim()
            if (!name) throw new Error('Category name is required.')
            if (operation === 'add') {
              if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) throw new Error('That category already exists.')
              categories.push({ name, ...(body.description ? { description: String(body.description).trim() } : {}) })
            } else if (operation === 'rename') {
              const nextName = String(body.nextName ?? '').trim()
              if (!nextName) throw new Error('New category name is required.')
              const category = categories.find((entry) => entry.name === name)
              if (!category) throw new Error('Category was not found.')
              category.name = nextName
              await updateArticleCategory(name, nextName)
            } else if (operation === 'delete') {
              const index = categories.findIndex((entry) => entry.name === name)
              if (index < 0) throw new Error('Category was not found.')
              categories.splice(index, 1)
              await updateArticleCategory(name)
            } else throw new Error('Unknown category operation.')
            categories.sort((a, b) => a.name.localeCompare(b.name))
            await writeFile(categoriesFile, `${JSON.stringify(categories, null, 2)}\n`)
            await generateContent({ includeDrafts: true })
            return writeResponse(response, 200, { ok: true })
          }
          if (action === 'site') {
            const title = String(body.title ?? '').trim()
            const description = String(body.description ?? '').trim()
            if (!title) throw new Error('Homepage title is required.')
            if (!description) throw new Error('Homepage description is required.')
            if (title.length > 80) throw new Error('Homepage title must be 80 characters or fewer.')
            if (description.length > 300) throw new Error('Homepage description must be 300 characters or fewer.')
            const site = await readJson<EditableSite>(siteFile, {})
            site.title = title
            site.description = description
            const aboutText = (key: string, fallback: string, maxLength: number) => {
              const value = String(body[key] ?? fallback).trim()
              if (value.length > maxLength) throw new Error(`About ${key} must be ${maxLength} characters or fewer.`)
              return value
            }
            const linkUrl = aboutText('aboutLinkUrl', site.about?.linkUrl ?? '', 500)
            const ctaUrl = aboutText('aboutCtaUrl', site.about?.ctaUrl ?? '/explore', 500)
            const validateLink = (value: string, field: string) => {
              if (value && !value.startsWith('/') && !/^https?:\/\//i.test(value)) throw new Error(`${field} must be an http(s) URL or local path.`)
              return value
            }
            site.about = {
              eyebrow: aboutText('aboutEyebrow', site.about?.eyebrow ?? 'ABOUT THIS PLACE', 80),
              title: aboutText('aboutTitle', site.about?.title ?? 'A library for the\nperpetually curious.', 180),
              intro: aboutText('aboutIntro', site.about?.intro ?? '', 500),
              body: aboutText('aboutBody', site.about?.body ?? '', 1200),
              quote: aboutText('aboutQuote', site.about?.quote ?? '', 300),
              quoteAuthor: aboutText('aboutQuoteAuthor', site.about?.quoteAuthor ?? '', 120),
              linkLabel: aboutText('aboutLinkLabel', site.about?.linkLabel ?? '', 100),
              linkUrl: validateLink(linkUrl, 'About link'),
              ctaLabel: aboutText('aboutCtaLabel', site.about?.ctaLabel ?? 'Enter the library', 80),
              ctaUrl: validateLink(ctaUrl, 'About button'),
            }
            await writeFile(siteFile, `${JSON.stringify(site, null, 2)}\n`)
            await generateContent({ includeDrafts: true })
            return writeResponse(response, 200, { ok: true })
          }
          if (action === 'background') {
            await mkdir(backgroundDirectory, { recursive: true })
            const operation = String(body.operation ?? '')
            const site = await readJson<{ background?: string }>(siteFile, {})
            if (operation === 'upload') {
              const originalName = String(body.name ?? '')
              const extension = extname(originalName).toLowerCase()
              if (!imageExtensions.has(extension)) throw new Error('Use a PNG, JPG, WebP, AVIF, GIF, or SVG image.')
              const safeName = `${originalName.slice(0, -extension.length).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '') || 'background'}${extension}`
              await writeFile(join(backgroundDirectory, safeName), Buffer.from(String(body.data ?? ''), 'base64'))
              site.background = `/background/${safeName}`
            } else if (operation === 'select') {
              const path = String(body.path ?? '')
              const name = path.replace('/background/', '')
              if (name.includes('/') || !imageExtensions.has(extname(name).toLowerCase())) throw new Error('Invalid background path.')
              if (!(await stat(join(backgroundDirectory, name)).then(() => true).catch(() => false))) throw new Error('Background was not found.')
              site.background = `/background/${name}`
            } else if (operation === 'reset') delete site.background
            else if (operation === 'delete') {
              const path = String(body.path ?? '')
              const name = path.replace('/background/', '')
              if (name.includes('/') || !imageExtensions.has(extname(name).toLowerCase())) throw new Error('Invalid background path.')
              await rm(join(backgroundDirectory, name), { force: true })
              if (site.background === path) delete site.background
            } else throw new Error('Unknown background operation.')
            await writeFile(siteFile, `${JSON.stringify(site, null, 2)}\n`)
            await generateContent({ includeDrafts: true })
            return writeResponse(response, 200, { ok: true })
          }
          return writeResponse(response, 404, { error: 'Unknown developer action.' })
        } catch (error) {
          return writeResponse(response, 400, { error: error instanceof Error ? error.message : 'Developer action failed.' })
        }
      })
    },
  }
}

export default defineConfig(({ command }) => ({ plugins: [react(), tailwindcss(), ...(command === 'serve' ? [developerPlugin()] : [])] }))
