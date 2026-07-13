import { lazy,Suspense,useEffect,useState } from 'react'
import { Routes,Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
const Article=lazy(()=>import('./pages/Article'))
const Explore=lazy(()=>import('./pages/Explore'))
const Timeline=lazy(()=>import('./pages/Timeline'))
const About=lazy(()=>import('./pages/About'))
const Developer=import.meta.env.DEV?lazy(()=>import('./pages/Developer')):null
export default function App(){const [theme,setTheme]=useState(()=>localStorage.getItem('theme')||'system');useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme)},[theme]);return <><Header theme={theme} setTheme={setTheme}/><main><Suspense fallback={<div className="loading">Opening the library…</div>}><Routes><Route path="/" element={<Home/>}/><Route path="/articles/:slug" element={<Article/>}/><Route path="/explore" element={<Explore/>}/><Route path="/timeline" element={<Timeline/>}/><Route path="/about" element={<About/>}/>{Developer&&<Route path="/developer" element={<Developer/>}/>}</Routes></Suspense></main><Footer/></>}
