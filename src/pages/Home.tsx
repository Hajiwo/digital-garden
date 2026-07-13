import { motion } from 'framer-motion'
import { ArrowDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import ArticleCard from '../components/ArticleCard'
import { articles, categories, categoryCounts, site } from '../data'

export default function Home() {
  const latestArticle = articles[0]
  const heroStyle = site.background ? { backgroundImage: `linear-gradient(90deg,rgba(20,43,39,.94),rgba(20,43,39,.48)),url("${site.background}")` } : undefined
  const title = site.title || 'Cyclopedia'
  const description = site.description || 'Ideas worth keeping, thoughtfully collected.\nA living library of technology, systems, and design.'
  const descriptionLines = description.split('\n')
  return <>
    <section className="hero" style={heroStyle}><div className="orb o1" /><div className="orb o2" /><motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}><p className="eyebrow">A PERSONAL KNOWLEDGE MAGAZINE</p><h1>{title}</h1><p className="lede">{descriptionLines.map((line, index) => <span key={`${line}-${index}`}>{line}{index < descriptionLines.length - 1 && <br />}</span>)}</p><div className="hero-links"><Link className="button" to="/explore"><Search /> Explore the library</Link><a href="#stories">Latest stories <ArrowDown /></a></div></motion.div><div className="issue">ISSUE 07<br />MMXXVI</div></section>
    <section className="section" id="stories"><div className="section-heading"><div><p className="eyebrow">LATEST ARTICLE</p><h2>Newest from the library</h2></div><span>01</span></div>{latestArticle ? <ArticleCard article={latestArticle} large /> : <div className="empty">Add your first article in Developer mode.</div>}<div className="section-heading latest"><div><p className="eyebrow">RECENTLY PUBLISHED</p><h2>More from the library</h2></div><Link to="/explore">View all stories →</Link></div><div className="grid">{articles.filter(({ slug }) => slug !== latestArticle?.slug).slice(0, 4).map((article) => <ArticleCard key={article.slug} article={article} />)}</div></section>
    <section className="topics"><p className="eyebrow">BROWSE BY TAG</p><h2>Follow your curiosity.</h2><div>{categories.map((tag) => <Link to={`/explore?category=${encodeURIComponent(tag)}`} key={tag}><span>{String(categoryCounts[tag]).padStart(2, '0')}</span>#{tag}<b>→</b></Link>)}</div></section>
  </>
}
