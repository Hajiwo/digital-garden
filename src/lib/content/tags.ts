export function buildTagIndex(articles: Array<{ tags: string[] }>) {
  const counts = new Map<string, number>()
  for (const article of articles) for (const rawTag of article.tags) {
    const tag = rawTag.trim()
    if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  const categories = [...counts.keys()].sort((a, b) => a.localeCompare(b))
  return { categories, counts: Object.fromEntries(categories.map((tag) => [tag, counts.get(tag) ?? 0])) }
}
