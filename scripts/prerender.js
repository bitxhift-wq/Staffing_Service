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
  {
    path: '/staffing-models',
    title: 'Staffing Models | IT Staffing Services in Coimbatore | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Explore flexible IT staffing models: permanent placement, executive search, dedicated offshore engineering teams, and payroll compliance worldwide.',
    breadcrumb: 'Staffing Models'
  },
  {
    path: '/models',
    title: 'Staffing Models | IT Staffing Services in Coimbatore | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Explore flexible IT staffing models: permanent placement, executive search, dedicated offshore engineering teams, and payroll compliance worldwide.',
    breadcrumb: 'Staffing Models'
  },
  {
    path: '/permanent-placement',
    title: 'Permanent Placement Services | Technical Recruitment | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Full-lifecycle permanent IT recruitment for senior engineers, architects, and technical leads across India, US, UK, Europe, and global tech hubs.',
    breadcrumb: 'Permanent Placement'
  },
  {
    path: '/executive-search',
    title: 'Executive Search Services | CXO & Leadership Hiring | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Confidential executive search for VP of Engineering, CTO, Chief AI Officer, and technical leaders with proven enterprise track records.',
    breadcrumb: 'Executive Search'
  },
  {
    path: '/practice-areas',
    title: 'Technical Practice Areas & Talent Ecosystem | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Specialized technical practice areas covering Software Engineering, AI & Machine Learning, Data Engineering, Cloud & DevOps, and IIoT.',
    breadcrumb: 'Practice Areas'
  },
  {
    path: '/offshore-teams',
    title: 'Dedicated Offshore Engineering Teams | Global Delivery | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Build and scale dedicated offshore engineering teams and technical centers operating seamlessly across global time zones.',
    breadcrumb: 'Dedicated Offshore Teams'
  },
  {
    path: '/payroll',
    title: 'Payroll & Compliance Support | Global Staffing | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Comprehensive payroll processing, statutory compliance, onboarding, and employer support for technical teams in India and international markets.',
    breadcrumb: 'Payroll & Compliance'
  },
  {
    path: '/payroll-compliance',
    title: 'Payroll & Compliance Support | Global Staffing | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Comprehensive payroll processing, statutory compliance, onboarding, and employer support for technical teams in India and international markets.',
    breadcrumb: 'Payroll & Compliance'
  },
  {
    path: '/locations',
    title: 'Where We Work — Delivery Footprint in India & Global Markets | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Connecting technology enterprises in the US, UK, Canada, Australia, Europe, and Middle East with high-caliber technical talent from Coimbatore, India.',
    breadcrumb: 'Where We Work'
  },
  {
    path: '/where-we-work',
    title: 'Where We Work — Delivery Footprint in India & Global Markets | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Connecting technology enterprises in the US, UK, Canada, Australia, Europe, and Middle East with high-caliber technical talent from Coimbatore, India.',
    breadcrumb: 'Where We Work'
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions | IT Staffing & Recruitment | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Answers to frequently asked questions about shortlisting speed, specialized technical talent, offshore models, payroll, and guarantees.',
    breadcrumb: 'FAQs'
  },
  {
    path: '/contact',
    title: 'Contact Talent Acquisition Desk | Global Recruitment | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Get in touch with the APPLIED MERIT Talent Acquisition Desk. Inquire about custom hiring, executive search, and offshore engineering teams.',
    breadcrumb: 'Contact Us'
  },
  {
    path: '/request-shortlist',
    title: 'Request Talent Shortlist | 48-72h Delivery | APPLIED MERIT — POWERED BY SMRIKAAM',
    desc: 'Submit your hiring criteria to receive a curated shortlist of pre-screened technical candidates within 48 to 72 hours.',
    breadcrumb: 'Request Shortlist'
  }
]

console.log('[Prerender] 6. Prerendering dedicated routes...')
for (const r of dedicatedRoutes) {
  try {
    const routeHtml = ReactDOMServer.renderToString(React.createElement(App, { initialPath: r.path }))
    let pageHtml = baseTemplate.replace('<div id="root"></div>', `<div id="root">${routeHtml}</div>`)
    
    // Update title for dedicated route static page
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${r.title}</title>`)
    // Update description
    pageHtml = pageHtml.replace(/<meta\s+name="description"\s+content=".*?"\s*\/>/, `<meta name="description" content="${r.desc}" />`)
    // Update Open Graph
    pageHtml = pageHtml.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/>/, `<meta property="og:title" content="${r.title}" />`)
    pageHtml = pageHtml.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/>/, `<meta property="og:description" content="${r.desc}" />`)
    pageHtml = pageHtml.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/>/, `<meta property="og:url" content="https://smrikaam.com${r.path}" />`)
    // Update Twitter
    pageHtml = pageHtml.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/>/, `<meta name="twitter:title" content="${r.title}" />`)
    pageHtml = pageHtml.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/>/, `<meta name="twitter:description" content="${r.desc}" />`)
    // Update canonical for dedicated route static page
    pageHtml = pageHtml.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/>/, `<link rel="canonical" href="https://smrikaam.com${r.path}" />`)

    // Dedicated schema for the route
    const pageSchema = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://smrikaam.com/#organization',
          'name': 'APPLIED MERIT',
          'alternateName': 'SMRIKAAM APPLIED MERIT',
          'legalName': 'SMRIKAAM',
          'url': 'https://smrikaam.com',
          'logo': {
            '@type': 'ImageObject',
            '@id': 'https://smrikaam.com/#logo',
            'url': 'https://smrikaam.com/assets/AppliedMerit_Logo_Transparent.svg',
            'caption': 'APPLIED MERIT — POWERED BY SMRIKAAM'
          }
        },
        {
          '@type': 'WebPage',
          '@id': `https://smrikaam.com${r.path}#webpage`,
          'url': `https://smrikaam.com${r.path}`,
          'name': r.title,
          'description': r.desc,
          'isPartOf': {
            '@id': 'https://smrikaam.com/#website'
          },
          'breadcrumb': {
            '@id': `https://smrikaam.com${r.path}#breadcrumb`
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `https://smrikaam.com${r.path}#breadcrumb`,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': 'https://smrikaam.com/'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': r.breadcrumb,
              'item': `https://smrikaam.com${r.path}`
            }
          ]
        }
      ]
    })
    pageHtml = pageHtml.replace(/<script\s+id="smrikaam-appliedmerit-schema"[\s\S]*?<\/script>/, `<script id="smrikaam-appliedmerit-schema" type="application/ld+json">${pageSchema}</script>`)

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
