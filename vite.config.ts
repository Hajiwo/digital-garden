import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import matter from 'gray-matter'
import { defineConfig, type Plugin } from 'vite'
import { generateContent } from './scripts/build-content'
import { assertSafeResourcePath, assertSafeSlug, buildArticle } from './src/lib/content/content'

const root = dirname(fileURLToPath(import.meta.url))
const dataDirectory = join(root, 'data')
const backgroundDirectory = join(root, 'public', 'background')
const categoriesFile = join(dataDirectory, 'categories.json')
const siteFile = join(dataDirectory, 'site.json')
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

type Category = { name: string; description?: string }
type Upload = { path: string; data: string }

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

async function articleFiles(): Promise<string[]> {
  const entries = await readdir(dataDirectory, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => join(dataDirectory, entry.name, 'article.md'))
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
  const site = await readJson<{ background?: string }>(siteFile, {})
  const backgrounds = await readdir(backgroundDirectory, { withFileTypes: true }).catch(() => [])
  const entries = await readdir(dataDirectory, { withFileTypes: true })
  return {
    categories,
    background: site.background ?? '',
    backgrounds: backgrounds.filter((entry) => entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase())).map((entry) => `/background/${entry.name}`).sort(),
    articleCount: entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).length,
  }
}

function developerPlugin(): Plugin {
  return {
    name: 'cyclopedia-developer-mode',
    apply: 'serve',
    configureServer(server) {
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
            if (!Array.isArray(uploads) || uploads.length === 0) throw new Error('Choose a folder containing article.md.')
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
              let markdownName = 'article.md'
              let markdown = await readFile(join(temporary, markdownName), 'utf8').catch(() => '')
              if (!markdown) {
                const rootMarkdown = uploads.map((upload) => assertSafeResourcePath(upload.path)).filter((path) => !path.includes('/') && path.toLowerCase().endsWith('.md'))
                if (rootMarkdown.length !== 1) throw new Error('The selected folder must contain article.md or exactly one Markdown file at its root.')
                markdownName = rootMarkdown[0]
                markdown = await readFile(join(temporary, markdownName), 'utf8')
                await rename(join(temporary, markdownName), join(temporary, 'article.md'))
              }
              const resources = uploads.map((upload) => assertSafeResourcePath(upload.path)).filter((path) => path !== markdownName)
              buildArticle({ slug, sourcePath: `data/${slug}/article.md`, raw: markdown, resources })
              await rename(temporary, target)
              await generateContent({ includeDrafts: true })
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
