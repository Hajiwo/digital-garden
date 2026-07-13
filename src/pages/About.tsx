import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data'

const defaults = {
  eyebrow: 'ABOUT THIS PLACE',
  title: 'A library for the\nperpetually curious.',
  intro: 'Read++ is a personal digital knowledge system: part magazine, part garden, part long-term memory.',
  body: 'It collects considered writing about technology, software, design, and the ideas that connect them. Nothing here chases a feed. The goal is slower and more durable—to make complex subjects approachable and worth returning to.',
  quote: '“We write to taste life twice, in the moment and in retrospect.”',
  quoteAuthor: '— Anaïs Nin',
  ctaLabel: 'Enter the library',
  ctaUrl: '/explore',
}

function splitLines(value: string): ReactNode[] {
  return value.split('\n').map((line, index) => <span key={`${line}-${index}`}>{line}{index < value.split('\n').length - 1 && <br />}</span>)
}

function AboutLink({ label, url }: { label: string; url: string }) {
  if (url.startsWith('/')) return <Link to={url}>{label}</Link>
  return <a href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>
}

export default function About() {
  const about = { ...defaults, ...(site.about ?? {}) }
  return <section className="page about"><p className="eyebrow">{about.eyebrow}</p><h1>{splitLines(about.title)}</h1><div className="about-copy"><p>{about.intro}</p><p>{about.body}</p>{about.quote && <blockquote>{about.quote}{about.quoteAuthor && <small>{about.quoteAuthor}</small>}</blockquote>}{about.linkUrl && about.linkLabel && <div className="about-links"><AboutLink label={about.linkLabel} url={about.linkUrl} /></div>}<Link className="button" to={about.ctaUrl?.startsWith('/') ? about.ctaUrl : '/explore'}>{about.ctaLabel}</Link></div></section>
}
