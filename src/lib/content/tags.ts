export function buildTagIndex(articles: Array<{ tags: string[] }>) {
  const allCounts = new Map<string, number>()
  const categoryCounts = new Map<string, number>()
  for (const article of articles) {
    const tags = article.tags.map((tag) => tag.trim()).filter(Boolean)
    for (const tag of tags) allCounts.set(tag, (allCounts.get(tag) ?? 0) + 1)
    const category = tags[0]
    if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
  }
  const categories = [...categoryCounts.keys()].sort((a, b) => a.localeCompare(b))
  const allTags = [...allCounts.keys()].sort((a, b) => a.localeCompare(b))
  return {
    categories,
    counts: Object.fromEntries(categories.map((tag) => [tag, categoryCounts.get(tag) ?? 0])),
    allTags,
    tagCounts: Object.fromEntries(allTags.map((tag) => [tag, allCounts.get(tag) ?? 0])),
  }
}
