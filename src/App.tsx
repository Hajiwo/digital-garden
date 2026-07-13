import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Bonfire from './components/Bonfire'
import Header, { type WebsiteStyle } from './components/Header'
import Home from './pages/Home'
const Article = lazy(() => import('./pages/Article'))
const Explore = lazy(() => import('./pages/Explore'))
const Timeline = lazy(() => import('./pages/Timeline'))
const About = lazy(() => import('./pages/About'))
const Developer = import.meta.env.DEV ? lazy(() => import('./pages/Developer')) : null
export default function App() { const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system'); const [websiteStyle, setWebsiteStyle] = useState<WebsiteStyle>(() => (localStorage.getItem('website-style') as WebsiteStyle | null) ?? 'editorial'); useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme) }, [theme]); useEffect(() => { document.documentElement.dataset.style = websiteStyle; localStorage.setItem('website-style', websiteStyle) }, [websiteStyle]); return <><Header theme={theme} setTheme={setTheme} websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} /><main><Suspense fallback={<div className="loading">Opening the library…</div>}><Routes><Route path="/" element={<Home />} /><Route path="/articles/:slug" element={<Article />} /><Route path="/explore" element={<Explore />} /><Route path="/timeline" element={<Timeline />} /><Route path="/about" element={<About />} />{Developer && <Route path="/developer" element={<Developer />} />}</Routes></Suspense></main><Footer /><Bonfire /></> }
