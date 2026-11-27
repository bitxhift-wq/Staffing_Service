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
const { App, SITE_URL, renderHeadForPath, renderRobotsTxt, renderSitemapXml, SEO_HEAD_START, SEO_HEAD_END } = ssrModule

if (!App) {
  throw new Error('App component export not found in dist-ssr/main.js')
}
if (!renderHeadForPath || !renderSitemapXml || !renderRobotsTxt) {
  throw new Error('SEO helpers are missing from dist-ssr/main.js (see src/main.tsx exports)')
}

const distIndexPath = path.resolve(rootDir, 'dist', 'index.html')
const baseTemplate = fs.readFileSync(distIndexPath, 'utf-8')

if (!baseTemplate.includes('<div id="root"></div>')) {
  throw new Error('Could not find <div id="root"></div> placeholder in dist/index.html')
}
const headStart = baseTemplate.indexOf(SEO_HEAD_START)
const headEnd = baseTemplate.indexOf(SEO_HEAD_END)
if (headStart === -1 || headEnd === -1 || headEnd < headStart) {
  throw new Error('SEO head markers were not injected into dist/index.html (check seoHtmlPlugin in vite.config.ts)')
}

/** Builds a complete static HTML page: prerendered app markup + the SEO <head> for the given path. */
function buildPage(routePath) {
  const appHtml = ReactDOMServer.renderToString(React.createElement(App, { initialPath: routePath }))
  const head = renderHeadForPath(routePath)
  const withHead =
    baseTemplate.slice(0, headStart) + head + baseTemplate.slice(headEnd + SEO_HEAD_END.length)
  return {
    html: withHead.replace('<div id="root"></div>', () => `<div id="root">${appHtml}</div>`),
    size: appHtml.length
  }
}

// 1. Home page: served at "/" and at the legacy URL /IT-staffing-services-in-Coimbatore.
//    Both declare "/" as the canonical URL, so there is one indexable URL.
console.log('[Prerender] 4. Prerendering home page (/)...')
const home = buildPage('/')
console.log(`[Prerender] Rendered ${home.size} characters of initial markup for the home page.`)
fs.writeFileSync(distIndexPath, home.html, 'utf-8')
console.log('[Prerender] Saved prerendered dist/index.html.')

console.log('[Prerender] 5. Creating legacy static route dist/IT-staffing-services-in-Coimbatore/index.html...')
const legacyDir = path.resolve(rootDir, 'dist', 'IT-staffing-services-in-Coimbatore')
fs.mkdirSync(legacyDir, { recursive: true })
fs.writeFileSync(path.resolve(legacyDir, 'index.html'), buildPage('/IT-staffing-services-in-Coimbatore').html, 'utf-8')

// 2. Legacy section URLs (kept so shared links and direct access keep working).
//    They scroll to the matching section on the home page and canonicalise to "/".
const legacySectionRoutes = [
  '/staffing-models',
  '/models',
  '/permanent-placement',
  '/executive-search',
  '/practice-areas',
  '/key-job-functions',
  '/job-functions',
  '/offshore-teams',
  '/payroll',
  '/payroll-compliance',
  '/locations',
  '/where-we-work',
  '/faq',
  '/contact',
  '/request-shortlist'
]

console.log('[Prerender] 6. Prerendering legacy section routes (canonical -> /)...')
for (const routePath of legacySectionRoutes) {
  try {
    const page = buildPage(routePath)
    const targetDir = path.resolve(rootDir, 'dist', routePath.replace(/^\//, ''))
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.resolve(targetDir, 'index.html'), page.html, 'utf-8')
    console.log(`[Prerender] -> Created dist${routePath}/index.html`)
  } catch (err) {
    console.error(`[Prerender] Failed to prerender ${routePath}:`, err)
    process.exitCode = 1
  }
}

// 3. sitemap.xml and robots.txt are generated from the same site URL used for canonicals.
console.log('[Prerender] 7. Writing sitemap.xml and robots.txt to dist...')
function newestMtime(targets) {
  let newest = 0
  const visit = (p) => {
    if (!fs.existsSync(p)) return
    const st = fs.statSync(p)
    if (st.isDirectory()) fs.readdirSync(p).forEach((f) => visit(path.join(p, f)))
    else newest = Math.max(newest, st.mtimeMs)
  }
  targets.forEach(visit)
  return newest
}
const lastmod = new Date(
  newestMtime([
    path.resolve(rootDir, 'src'),
    path.resolve(rootDir, 'index.html'),
    path.resolve(rootDir, 'public', 'images'),
    path.resolve(rootDir, 'public', 'assets')
  ]) || Date.now()
)
  .toISOString()
  .slice(0, 10)

fs.writeFileSync(path.resolve(rootDir, 'dist', 'sitemap.xml'), renderSitemapXml(SITE_URL, lastmod), 'utf-8')
fs.writeFileSync(path.resolve(rootDir, 'dist', 'robots.txt'), renderRobotsTxt(SITE_URL), 'utf-8')

// Remove stray duplicate artefacts from older builds
fs.rmSync(path.resolve(rootDir, 'dist', 'executive-search.html'), { force: true })

console.log('[Prerender] 8. Cleaning up temporary SSR directory...')
fs.rmSync(path.resolve(rootDir, 'dist-ssr'), { recursive: true, force: true })

console.log('[Prerender] Prerendering and Production SEO build completed successfully!')
