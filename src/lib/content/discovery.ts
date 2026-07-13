import { ContentValidationError } from './content'

export function slugifyArticleName(value: string): string {
  const slug = value.normalize('NFKC').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/(^-|-$)/g, '')
  if (!slug) throw new ContentValidationError(`cannot derive a safe article slug from "${value}"`)
  return slug
}

export function deriveArticleSlug(topDirectory: string, relativeMarkdownPath: string, markdownCount: number): string {
  if (markdownCount === 1) return slugifyArticleName(topDirectory)
  const withoutExtension = relativeMarkdownPath.replace(/\.md$/i, '')
  const parts = withoutExtension.split('/').filter(Boolean)
  if (parts.at(-1)?.toLowerCase() === 'article') parts.pop()
  return slugifyArticleName([topDirectory, ...parts].join('-'))
}
