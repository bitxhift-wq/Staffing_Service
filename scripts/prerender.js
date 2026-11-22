import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('[Prerender] 1. Building Vite client...')
execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' })

console.log('[Prerender] 2. Building SSR bundle...')
execSync('npx vite build --ssr src/main.tsx --outDir dist-ssr', { cwd: rootDir, stdio: 'inherit' })

console.log('[Prerender] 3. Importing SSR bundle and rendering App...')
const ssrPath = path.resolve(rootDir, 'dist-ssr', 'main.js')
const ssrModule = await import(`file://${ssrPath}`)
const App = ssrModule.App

if (!App) {
  throw new Error('App component export not found in dist-ssr/main.js')
}

const distIndexPath = path.resolve(rootDir, 'dist', 'index.html')
let baseTemplate = fs.readFileSync(distIndexPath, 'utf-8')

if (!baseTemplate.includes('<div id="root"></div>')) {
  throw new Error('Could not find <div id="root"></div> placeholder in dist/index.html')
}

// 1. Render Main Staffing Page (Home)
console.log('[Prerender] 4. Prerendering Main Staffing Page (/IT-staffing-services-in-Coimbatore)...')
const mainAppHtml = ReactDOMServer.renderToString(React.createElement(App, { initialPath: '/IT-staffing-services-in-Coimbatore' }))
console.log(`[Prerender] Rendered ${mainAppHtml.length} characters of initial markup for main page.`)

const mainFinalHtml = baseTemplate.replace('<div id="root"></div>', `<div id="root">${mainAppHtml}</div>`)
fs.writeFileSync(distIndexPath, mainFinalHtml, 'utf-8')
console.log('[Prerender] Saved prerendered dist/index.html.')

console.log('[Prerender] 5. Creating static route dist/IT-staffing-services-in-Coimbatore/index.html...')
const routeDir = path.resolve(rootDir, 'dist', 'IT-staffing-services-in-Coimbatore')
fs.mkdirSync(routeDir, { recursive: true })
fs.writeFileSync(path.resolve(routeDir, 'index.html'), mainFinalHtml, 'utf-8')

// 2. Prerender Dedicated Routes for direct URL access and refresh
const dedicatedRoutes = [
  { path: '/staffing-models', title: 'Staffing Models | IT Staffing Services in Coimbatore | SMRIKAAM TALENTO' },
  { path: '/models', title: 'Staffing Models | IT Staffing Services in Coimbatore | SMRIKAAM TALENTO' },
  { path: '/permanent-placement', title: 'Permanent Placement Services | IT Staffing in Coimbatore | SMRIKAAM TALENTO' },
  { path: '/executive-search', title: 'Executive Search Services | CXO & Leadership Hiring | SMRIKAAM TALENTO' },
  { path: '/practice-areas', title: 'Technical Practice Areas & Talent Ecosystem | SMRIKAAM TALENTO' },
  { path: '/offshore-teams', title: 'Dedicated Offshore Engineering Teams | SMRIKAAM TALENTO' },
  { path: '/payroll', title: 'Payroll & Compliance Support | SMRIKAAM TALENTO' },
  { path: '/payroll-compliance', title: 'Payroll & Compliance Support | SMRIKAAM TALENTO' },
  { path: '/locations', title: 'Where We Work - Delivery Footprint | SMRIKAAM TALENTO Coimbatore' },
  { path: '/where-we-work', title: 'Where We Work - Delivery Footprint | SMRIKAAM TALENTO Coimbatore' },
  { path: '/faq', title: 'Frequently Asked Questions | SMRIKAAM TALENTO' },
  { path: '/contact', title: 'Contact Talent Acquisition Desk | SMRIKAAM TALENTO' },
  { path: '/request-shortlist', title: 'Request Talent Shortlist | SMRIKAAM TALENTO' }
]

console.log('[Prerender] 6. Prerendering dedicated routes...')
for (const r of dedicatedRoutes) {
  try {
    const routeHtml = ReactDOMServer.renderToString(React.createElement(App, { initialPath: r.path }))
    let pageHtml = baseTemplate.replace('<div id="root"></div>', `<div id="root">${routeHtml}</div>`)
    
    // Update title for dedicated route static page
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${r.title}</title>`)
    // Update canonical for dedicated route static page
    pageHtml = pageHtml.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/>/, `<link rel="canonical" href="https://smrikaam.com${r.path}" />`)

    // Dedicated schema for executive-search
    if (r.path === '/executive-search') {
      const execSchema = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://smrikaam.com/#organization',
            'name': 'SMRIKAAM TALENTO',
            'url': 'https://smrikaam.com'
          },
          {
            '@type': 'WebPage',
            '@id': 'https://smrikaam.com/executive-search#webpage',
            'url': 'https://smrikaam.com/executive-search',
            'name': 'Executive Search Services | CXO & Leadership Hiring | SMRIKAAM TALENTO'
          }
        ]
      })
      pageHtml = pageHtml.replace(/<script\s+id="smrikaam-talento-schema"[\s\S]*?<\/script>/, `<script id="smrikaam-talento-schema" type="application/ld+json">${execSchema}</script>`)
    }

    const targetDir = path.resolve(rootDir, 'dist', r.path.replace(/^\//, ''))
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.resolve(targetDir, 'index.html'), pageHtml, 'utf-8')
    
    if (r.path === '/executive-search') {
      fs.writeFileSync(path.resolve(rootDir, 'dist', 'executive-search.html'), pageHtml, 'utf-8')
    }

    console.log(`[Prerender] -> Created dist${r.path}/index.html`)
  } catch (err) {
    console.error(`[Prerender] Failed to prerender ${r.path}:`, err)
  }
}

// 3. Sync Sitemap & Robots
console.log('[Prerender] 7. Ensuring sitemap.xml and robots.txt in dist...')
const publicSitemap = path.resolve(rootDir, 'public', 'sitemap.xml')
const distSitemap = path.resolve(rootDir, 'dist', 'sitemap.xml')
if (fs.existsSync(publicSitemap)) {
  fs.copyFileSync(publicSitemap, distSitemap)
}

const publicRobots = path.resolve(rootDir, 'public', 'robots.txt')
const distRobots = path.resolve(rootDir, 'dist', 'robots.txt')
if (fs.existsSync(publicRobots)) {
  fs.copyFileSync(publicRobots, distRobots)
}

console.log('[Prerender] 8. Cleaning up temporary SSR directory...')
fs.rmSync(path.resolve(rootDir, 'dist-ssr'), { recursive: true, force: true })

console.log('[Prerender] Prerendering and Production SEO build completed successfully!')
