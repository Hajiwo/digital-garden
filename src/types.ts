export type ArticleHeading = { id: string; text: string; depth: number }
export type Article = { slug: string; title: string; description: string; date: string; updated?: string; category: string; tags: string[]; readingTime: number; featured?: boolean; cover?: string; originalUrl?: string; contentHtml: string; headings: ArticleHeading[] }
export type Category = { name: string; description?: string }
export type SiteSettings = { categories: Category[]; background?: string; title?: string; description?: string }
