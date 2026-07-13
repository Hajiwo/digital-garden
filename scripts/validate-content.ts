import { generateContent } from './build-content'

generateContent().then((summaries) => console.log(`Validated ${summaries.length} articles.`)).catch((error: unknown) => { console.error(error instanceof Error ? `Content validation failed:\n${error.message}` : error); process.exitCode = 1 })
