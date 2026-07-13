export interface ArticleHeading {
  id: string
  text: string
  depth: number
}

export type ArticleResourceType = 'image' | 'video' | 'audio' | 'pdf' | 'other'

export interface ArticleResource {
  path: string
  publicUrl: string
  type: ArticleResourceType
}

export interface ArticleSummary {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  coverUrl?: string
  category?: string
  tags: string[]
  featured: boolean
  readingTimeMinutes: number
}

export interface Article extends ArticleSummary {
  contentHtml: string
  headings: ArticleHeading[]
  resources: ArticleResource[]
}

export interface BuildArticleInput {
  slug: string
  sourcePath: string
  raw: string
  resources: string[]
}
