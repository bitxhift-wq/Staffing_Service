import React, { useState, useEffect, FormEvent } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom'
import './styles.css'
import {
  BUSINESS,
  FAQ_ITEMS,
  OG_IMAGE_PATH,
  buildSchemaGraph,
  getCanonicalUrl,
  getPageMeta,
  renderHeadTags,
  serializeJsonLd,
  OG_IMAGE_ALT
} from './seo'
import { getEnquiryRegion, handleTrackedClick, trackEvent } from './analytics'

export { SEO_HEAD_START, SEO_HEAD_END, renderRobotsTxt, renderSitemapXml } from './seo'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://smrikaam.com').replace(/\/$/, '')
export const TARGET_PATH = '/IT-staffing-services-in-Coimbatore'
export const CANONICAL_URL = getCanonicalUrl(SITE_URL)
export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`

/** Analytics / Search Console configuration comes from VITE_* env placeholders. */
export const ANALYTICS_CONFIG = {
  gtmId: import.meta.env.VITE_GTM_ID as string | undefined,
  ga4Id: import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined,
  gscToken: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined
}

/** Used by the prerender script to write the <head> of every static HTML file. */
export function renderHeadForPath(pathname: string): string {
  return renderHeadTags({ siteUrl: SITE_URL, pathname, analytics: ANALYTICS_CONFIG })
}

export interface ShortlistFormState {
  fullName: string
  companyName: string
  email: string
  phone: string
  hiringModel: string
  requiredSkills: string
  positions: string
  details: string
}

export const initialFormState: ShortlistFormState = {
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  hiringModel: 'Permanent Placement',
  requiredSkills: '',
  positions: '1-2',
  details: ''
}

export function Emblem() {
  return (
    <svg className="talento-brand-emblem" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <polygon points="50,12 82,30 50,48 18,30" fill="#00B4D8" />
      <polygon points="18,30 50,48 50,88 18,70" fill="#1D4ED8" />
      <polygon points="50,48 82,30 82,70 50,88" fill="#F97316" />
      <polygon points="50,12 50,48 18,30" fill="#38BDF8" opacity="0.9" />
      <polygon points="50,48 82,30 50,12" fill="#F59E0B" opacity="0.9" />
    </svg>
  )
}

/**
 * Computes exact untransformed layout top in document coordinates
 */
export function getElementDocumentTop(el: HTMLElement): number {
  let top = 0
  let elem: HTMLElement | null = el
  while (elem) {
    top += elem.offsetTop
    elem = elem.offsetParent as HTMLElement | null
  }
  return top
}

/**
 * Smooth Scroll to Target Element with Exact Header Offset
 * Re-arms and triggers destination section entrance animations
 */
export function scrollToSection(sectionId: string, smooth: boolean = true) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const cleanId = sectionId.replace(/^#/, '')
  if (!cleanId || cleanId === 'hero') {
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    // Re-trigger hero animation
    const hero = document.getElementById('hero')
    if (hero) {
      hero.classList.remove('is-revealed')
      document.body.classList.remove('talento-animated')
      void document.body.offsetHeight
      document.body.classList.add('talento-animated')
      hero.classList.add('is-revealed')
      hero.querySelectorAll('.anim-scroll').forEach((child) => child.classList.add('is-revealed'))
    }
    return
  }

  const aliasMap: Record<string, string> = {
    models: 'staffing-models',
    'technology-areas': 'practice-areas',
    'job-functions': 'key-job-functions',
    'payroll-compliance': 'payroll',
    'where-we-work': 'locations',
    faqs: 'faq',
    'contact-cta': 'final-cta',
    'shortlist-form': 'contact',
    shortlist: 'contact',
    'request-shortlist': 'contact'
  }

  const targetId = document.getElementById(cleanId) ? cleanId : (aliasMap[cleanId] || cleanId)
  const el = document.getElementById(targetId)
  if (!el) return

  const getTargetY = () => {
    const header = document.querySelector('.talento-header') as HTMLElement | null
    const headerHeight = header ? header.offsetHeight : (window.innerWidth <= 768 ? 72 : 82)
    const padding = window.innerWidth <= 768 ? 12 : 14
    const offset = headerHeight + padding
    const docTop = getElementDocumentTop(el)
    return Math.max(0, docTop - offset)
  }

  const targetY = getTargetY()

  window.scrollTo({
    top: Math.round(targetY),
    behavior: smooth ? 'smooth' : 'instant'
  })

  const triggerReveal = () => {
    el.classList.add('is-revealed')
    let ancestor: HTMLElement | null = el.parentElement
    while (ancestor) {
      if (ancestor.classList && ancestor.classList.contains('anim-scroll')) {
        ancestor.classList.add('is-revealed')
      }
      ancestor = ancestor.parentElement
    }
    el.querySelectorAll('.anim-scroll').forEach((child) => child.classList.add('is-revealed'))
  }

  // Ensure element is revealed immediately for position and synchronous checks
  triggerReveal()

  // For smooth navigation clicks: re-trigger destination entrance animation right as user arrives
  if (smooth) {
    setTimeout(() => {
      // Re-arm section animation so user experiences fresh entrance reveal upon arrival
      el.classList.remove('is-revealed')
      el.querySelectorAll('.anim-scroll').forEach((child) => child.classList.remove('is-revealed'))
      void el.offsetHeight
      triggerReveal()
    }, 200)

    // Self-correcting alignment for any layout reflow (e.g. line expansion animations) after reveal
    setTimeout(() => {
      const updatedTargetY = getTargetY()
      if (Math.abs(updatedTargetY - targetY) >= 4) {
        window.scrollTo({
          top: Math.round(updatedTargetY),
          behavior: 'smooth'
        })
      }
      triggerReveal()
    }, 280)
  } else {
    requestAnimationFrame(() => {
      const updatedTargetY = getTargetY()
      if (Math.abs(updatedTargetY - targetY) >= 4) {
        window.scrollTo({
          top: Math.round(updatedTargetY),
          behavior: 'instant'
        })
      }
      triggerReveal()
    })
  }
}

/**
 * Scroll & Hash Manager
 * Handles initial hash scrolling, direct section URLs, back/forward history navigation,
 * and ensures single-page continuous flow.
 */
export function ScrollManager({
  setActiveSection,
  isScrollingFromClickRef
}: {
  setActiveSection: (sec: string) => void
  isScrollingFromClickRef: React.MutableRefObject<boolean>
}) {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const routeToSection: Record<string, string> = {
      '/staffing-models': 'staffing-models',
      '/models': 'staffing-models',
      '/permanent-placement': 'permanent-placement',
      '/executive-search': 'executive-search',
      '/practice-areas': 'practice-areas',
      '/key-job-functions': 'key-job-functions',
      '/job-functions': 'key-job-functions',
      '/offshore-teams': 'offshore-teams',
      '/payroll': 'payroll',
      '/payroll-compliance': 'payroll',
      '/locations': 'locations',
      '/where-we-work': 'locations',
      '/faq': 'faq',
      '/contact': 'final-cta',
      '/request-shortlist': 'contact'
    }

    const hash = window.location.hash.replace(/^#/, '')
    const pathname = location.pathname.replace(/\/$/, '')
    const targetSection = hash || routeToSection[pathname]

    if (targetSection) {
      const navKeyMap: Record<string, string> = {
        'final-cta': 'contact',
        contact: 'contact',
        'payroll-compliance': 'payroll',
        'where-we-work': 'locations',
        models: 'staffing-models'
      }
      setActiveSection(navKeyMap[targetSection] || targetSection)

      if (!hash && routeToSection[pathname]) {
        window.history.replaceState(null, '', `/#${targetSection === 'final-cta' ? 'contact' : targetSection}`)
      }

      isScrollingFromClickRef.current = true
      const timer = setTimeout(() => {
        scrollToSection(targetSection, false)
        isScrollingFromClickRef.current = false
      }, 70)
      return () => clearTimeout(timer)
    } else {
      setActiveSection('hero')
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [location.pathname, setActiveSection, isScrollingFromClickRef])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash) {
        const navKeyMap: Record<string, string> = {
          'final-cta': 'contact',
          contact: 'contact',
          'payroll-compliance': 'payroll',
          'where-we-work': 'locations',
          models: 'staffing-models'
        }
        setActiveSection(navKeyMap[hash] || hash)
        scrollToSection(hash, true)
      } else {
        setActiveSection('hero')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [setActiveSection])

  return null
}

/**
 * Backwards-compatible ScrollToTop export
 */
export function ScrollToTop() {
  return null
}

/**
 * SEO Manager for Head tags.
 * The static HTML already contains the correct head (see src/seo.ts); this keeps the
 * document head in sync on the client. Every URL canonicalises to the home page.
 */
export function SEOManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const meta = getPageMeta(pathname)
    const canonicalUrl = getCanonicalUrl(SITE_URL)

    const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    document.title = meta.title
    upsertMeta('name', 'description', meta.description)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalUrl)

    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:title', meta.title)
    upsertMeta('property', 'og:description', meta.description)
    upsertMeta('property', 'og:image', OG_IMAGE_URL)
    upsertMeta('property', 'og:image:alt', OG_IMAGE_ALT)
    upsertMeta('name', 'twitter:title', meta.title)
    upsertMeta('name', 'twitter:description', meta.description)
    upsertMeta('name', 'twitter:image', OG_IMAGE_URL)
    upsertMeta('name', 'twitter:image:alt', OG_IMAGE_ALT)

    // Single JSON-LD block (remove legacy ids from earlier brand versions)
    const scriptId = 'smrikaam-workforce-schema'
    ;['smrikaam-appliedmerit-schema', 'smrikaam-talento-schema'].forEach((legacyId) => {
      const legacy = document.getElementById(legacyId)
      if (legacy) legacy.remove()
    })
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = serializeJsonLd(buildSchemaGraph(SITE_URL))
  }, [pathname])

  return null
}

/**
 * Global Header Component
 */
export function Header({
  activeSection,
  onNavClick,
  onOpenShortlistModal,
  mobileMenuOpen,
  setMobileMenuOpen
}: {
  activeSection?: string
  onNavClick?: (e: React.MouseEvent, targetId: string) => void
  onOpenShortlistModal?: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}) {
  const currentActive = activeSection || 'hero'

  const handleLink = (e: React.MouseEvent, targetId: string) => {
    if (onNavClick) {
      onNavClick(e, targetId)
    } else {
      e.preventDefault()
      setMobileMenuOpen(false)
      scrollToSection(targetId, true)
    }
  }

  const handleShortlist = (e: React.MouseEvent) => {
    if (onNavClick) {
      onNavClick(e, 'contact')
    } else {
      e.preventDefault()
      setMobileMenuOpen(false)
      scrollToSection('contact', true)
    }
  }

  return (
    <>
      <header className="talento-header">
        <a
          href="#hero"
          className="talento-brand"
          onClick={(e) => handleLink(e, 'hero')}
          aria-label="SMRIKAAM WORKFORCE — BRIDGING TALENT AND OPPORTUNITY"
        >
          <img
            src="/assets/Smrikaam_Workforce_Logo_Transparent.svg"
            alt="SMRIKAAM WORKFORCE — BRIDGING TALENT AND OPPORTUNITY"
            className="header-brand-logo"
            width="325"
            height="28"
            decoding="async"
            loading="eager"
          />
        </a>

        <div className="talento-header-divider" aria-hidden="true"></div>

        <nav className="talento-nav" aria-label="Main Navigation">
          <a
            href="#staffing-models"
            className={currentActive === 'staffing-models' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'staffing-models')}
          >
            STAFFING MODELS
          </a>
          <a
            href="#permanent-placement"
            className={currentActive === 'permanent-placement' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'permanent-placement')}
          >
            PERMANENT PLACEMENT
          </a>
          <a
            href="#executive-search"
            className={currentActive === 'executive-search' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'executive-search')}
          >
            EXECUTIVE SEARCH
          </a>
          <a
            href="#practice-areas"
            className={currentActive === 'practice-areas' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'practice-areas')}
          >
            PRACTICE AREAS
          </a>
          <a
            href="#key-job-functions"
            className={currentActive === 'key-job-functions' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'key-job-functions')}
          >
            JOB FUNCTIONS
          </a>
          <a
            href="#offshore-teams"
            className={currentActive === 'offshore-teams' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'offshore-teams')}
          >
            OFFSHORE TEAMS
          </a>
          <a
            href="#payroll"
            className={currentActive === 'payroll' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'payroll')}
          >
            PAYROLL
          </a>
          <a
            href="#locations"
            className={currentActive === 'locations' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'locations')}
          >
            LOCATIONS
          </a>
          <a
            href="#faq"
            className={currentActive === 'faq' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'faq')}
          >
            FAQ
          </a>
          <a
            href="#contact"
            className={currentActive === 'contact' ? 'active' : ''}
            onClick={(e) => handleLink(e, 'final-cta')}
          >
            CONTACT
          </a>
        </nav>

        <div className="talento-header-actions">
          <button
            type="button"
            className={`talento-btn-nav ${currentActive === 'contact' ? 'is-active' : ''}`}
            data-track="request_shortlist_click" onClick={handleShortlist}
          >
            REQUEST SHORTLIST <span className="talento-arrow">↗</span>
          </button>
          <button
            type="button"
            className="talento-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`talento-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="talento-drawer-top">
          <span>SMRIKAAM WORKFORCE NAVIGATION</span>
          <button type="button" onClick={() => setMobileMenuOpen(false)}>✕</button>
        </div>
        <div className="talento-drawer-links">
          <a href="#hero" className={currentActive === 'hero' ? 'active' : ''} onClick={(e) => handleLink(e, 'hero')}>01 HOME</a>
          <a href="#staffing-models" className={currentActive === 'staffing-models' ? 'active' : ''} onClick={(e) => handleLink(e, 'staffing-models')}>02 OUR MODELS</a>
          <a href="#permanent-placement" className={currentActive === 'permanent-placement' ? 'active' : ''} onClick={(e) => handleLink(e, 'permanent-placement')}>03 PERMANENT PLACEMENT</a>
          <a href="#executive-search" className={currentActive === 'executive-search' ? 'active' : ''} onClick={(e) => handleLink(e, 'executive-search')}>04 EXECUTIVE SEARCH</a>
          <a href="#practice-areas" className={currentActive === 'practice-areas' ? 'active' : ''} onClick={(e) => handleLink(e, 'practice-areas')}>05 PRACTICE AREAS</a>
          <a href="#key-job-functions" className={currentActive === 'key-job-functions' ? 'active' : ''} onClick={(e) => handleLink(e, 'key-job-functions')}>06 JOB FUNCTIONS</a>
          <a href="#offshore-teams" className={currentActive === 'offshore-teams' ? 'active' : ''} onClick={(e) => handleLink(e, 'offshore-teams')}>07 OFFSHORE TEAMS</a>
          <a href="#payroll" className={currentActive === 'payroll' ? 'active' : ''} onClick={(e) => handleLink(e, 'payroll')}>08 PAYROLL &amp; COMPLIANCE</a>
          <a href="#locations" className={currentActive === 'locations' ? 'active' : ''} onClick={(e) => handleLink(e, 'locations')}>09 WHERE WE WORK</a>
          <a href="#faq" className={currentActive === 'faq' ? 'active' : ''} onClick={(e) => handleLink(e, 'faq')}>10 FAQS</a>
          <a href="#contact" className={currentActive === 'contact' ? 'active' : ''} onClick={(e) => handleLink(e, 'final-cta')}>11 CONTACT US</a>
        </div>
        <button
          type="button"
          className="talento-btn talento-btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
          data-track="request_shortlist_click" onClick={handleShortlist}
        >
          REQUEST TALENT SHORTLIST ↗
        </button>
      </div>
    </>
  )
}

/**
 * Global Footer Component
 */
export function Footer({ onNavClick }: { onNavClick?: (e: React.MouseEvent, targetId: string) => void }) {
  const handleLink = (e: React.MouseEvent, targetId: string) => {
    if (onNavClick) {
      onNavClick(e, targetId)
    } else {
      e.preventDefault()
      scrollToSection(targetId, true)
    }
  }

  return (
    <footer className="talento-footer">
      <div className="talento-footer-grid">
        <div className="talento-footer-brand">
          <img
            src="/assets/Smrikaam_Workforce_Logo_Transparent.svg"
            alt="SMRIKAAM WORKFORCE — BRIDGING TALENT AND OPPORTUNITY"
            className="footer-brand-logo"
            width="260"
            height="23"
            loading="lazy"
            decoding="async"
          />
          <p>
            Specialized IT, Executive &amp; Engineering Staffing Solutions. Connecting ambitious technology enterprises with verified high-caliber engineering talent across India and global markets.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888888' }}>
            Coimbatore, Tamil Nadu, India
          </p>
        </div>

        <div className="talento-footer-col">
          <h5>STAFFING MODELS</h5>
          <ul>
            <li><a href="#permanent-placement" onClick={(e) => handleLink(e, 'permanent-placement')}>Permanent Placement</a></li>
            <li><a href="#executive-search" onClick={(e) => handleLink(e, 'executive-search')}>Executive Search</a></li>
            <li><a href="#offshore-teams" onClick={(e) => handleLink(e, 'offshore-teams')}>Dedicated Offshore Teams</a></li>
            <li><a href="#payroll" onClick={(e) => handleLink(e, 'payroll')}>Payroll &amp; Compliance</a></li>
          </ul>
        </div>

        <div className="talento-footer-col">
          <h5>PRACTICE AREAS</h5>
          <ul>
            <li><a href="#practice-areas" onClick={(e) => handleLink(e, 'practice-areas')}>Software Engineering</a></li>
            <li><a href="#practice-areas" onClick={(e) => handleLink(e, 'practice-areas')}>AI &amp; Machine Learning</a></li>
            <li><a href="#practice-areas" onClick={(e) => handleLink(e, 'practice-areas')}>Data Engineering &amp; Analytics</a></li>
            <li><a href="#practice-areas" onClick={(e) => handleLink(e, 'practice-areas')}>Cloud &amp; DevOps</a></li>
            <li><a href="#practice-areas" onClick={(e) => handleLink(e, 'practice-areas')}>Cybersecurity &amp; IIoT</a></li>
          </ul>
        </div>

        <div className="talento-footer-col">
          <h5>TALENT DESK</h5>
          <ul>
            <li><a href="mailto:contact@smrikaam.com" data-track="email_click">contact@smrikaam.com</a></li>
            <li><a href="tel:+919150684601" data-track="phone_click">+91 9150684601</a></li>
            <li><a href="#locations" onClick={(e) => handleLink(e, 'locations')}>India &amp; Global Delivery</a></li>
            <li><a href="#contact" onClick={(e) => handleLink(e, 'contact')}>Request Candidate Profiles</a></li>
          </ul>
        </div>
      </div>

      <div className="talento-footer-bottom">
        <span>© 2026 SMRIKAAM WORKFORCE, a SMRIKAAM Technologies company. All rights reserved. Staffing &amp; Recruitment Solutions.</span>
        <span>PROGRESS THROUGH INNOVATION</span>
      </div>
    </footer>
  )
}

/**
 * In-page link that scrolls to a section and keeps a clean `/#hash` URL
 * (replaces router links to legacy section URLs such as /contact).
 */
export function SectionLink({
  sectionId,
  hash,
  className,
  track,
  children
}: {
  sectionId: string
  hash: string
  className?: string
  track?: string
  children: React.ReactNode
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.history.pushState(null, '', `#${hash}`)
    scrollToSection(sectionId, true)
  }
  return (
    <a href={`#${hash}`} className={className} data-track={track} onClick={handleClick}>
      {children}
    </a>
  )
}

/**
 * Hero Section
 */
export function HeroSection({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return (
    <section id="hero" className="talento-hero anim-scroll">
      <div className="talento-hero-bg-black" aria-hidden="true"></div>
      <div className="talento-hero-bg-facet" aria-hidden="true"></div>
      <div className="talento-hero-bg-mid-grey" aria-hidden="true"></div>
      <div className="talento-hero-bg-light-grey" aria-hidden="true"></div>

      <div className="talento-hero-left">
        <h1 className="talento-hero-title">
          <span className="talento-title-line">TECHNICAL TALENT.</span>
          <span className="talento-title-line">BUILT FOR SPEED.</span>
        </h1>
        <h2 className="talento-hero-subtitle">
          IT and Specialized Staffing Services in Coimbatore, India
        </h2>
        <div className="talento-hero-desc">
          <p>
            Hiring the right tech people takes time. Good engineers are hard to find, and a slow search can delay your whole project.
          </p>
          <p>
            SMRIKAAM WORKFORCE is one of India's leading recruitment companies, based in Coimbatore. We help companies hire faster through <strong>permanent placement and executive search services</strong>. Our expertise covers <strong>AI, Data, Cloud, DevOps, IIoT and enterprise transformation.</strong>
          </p>
        </div>
        <div className="talento-hero-actions">
          <button
            type="button"
            className="talento-btn talento-btn-primary"
            data-track="request_shortlist_click" onClick={onOpenShortlist}
          >
            REQUEST TALENT SHORTLIST
            <span className="talento-arrow">↗</span>
          </button>
          <SectionLink
            sectionId="final-cta"
            hash="contact"
            track="contact_cta"
            className="talento-btn talento-btn-secondary"
          >
            TALK TO OUR TEAM
            <span className="talento-arrow">→</span>
          </SectionLink>
        </div>
      </div>

      <div className="talento-hero-right">
        <div className="talento-hero-img-wrap">
          <svg className="talento-hero-decor-svg" viewBox="0 0 1024 576" preserveAspectRatio="none" aria-hidden="true">
            <polygon
              className="talento-frame-secondary-border"
              points="38,377 177,138 245,138 270,96 662,96 676,121 986,121 883,347 942,347 864,495 792,495 720,463 690,501 115,501"
              fill="none"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.5"
              transform="translate(-6, -6)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="talento-hero-img-inner">
            <picture>
              <source
                srcSet="/images/staffing/hero-interview-800.webp 800w, /images/staffing/hero-interview-1200.webp 1200w, /images/staffing/hero-interview-1600.webp 1600w, /images/staffing/hero-interview.webp 2400w"
                sizes="(max-width: 1024px) 100vw, 50vw"
                type="image/webp"
              />
              <img
                src="/images/staffing/hero-interview.jpg"
                alt="SMRIKAAM WORKFORCE recruitment leadership interviewing specialized technical candidates in a contemporary boardroom"
                className="talento-hero-img"
                width="2400"
                height="1339"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>

          <svg className="talento-hero-border-svg" viewBox="0 0 1024 576" preserveAspectRatio="none" aria-hidden="true">
            <polygon
              className="talento-frame-primary-border"
              points="38,377 177,138 245,138 270,96 662,96 676,121 986,121 883,347 942,347 864,495 792,495 720,463 690,501 115,501"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

/**
 * Permanent Placement Component
 */
export function PermanentPlacementBlock({ onOpenShortlist }: { onOpenShortlist?: () => void }) {
  return (
    <div id="permanent-placement" className="talento-model-block talento-model-block-perm anim-scroll">
      <div className="talento-model-content">
        <div className="talento-model-header-line">
          <span className="talento-model-num">01</span>
          <h3 className="talento-model-name">PERMANENT<br />PLACEMENT</h3>
        </div>
        <p className="talento-model-pitch">
          Want someone to join your company for good? We find and screen full-time employees for your team.
        </p>
        <p className="talento-model-tagline">
          End-to-end hiring for full-time technology roles.
        </p>
        <p className="talento-model-desc">
          Hire senior engineers, data scientists, architects and product specialists who stay and grow with you. Our technical and behavioral screening checks compatibility with your tech stack and company culture.
        </p>

        <ul className="talento-checklist">
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Best for:</strong> Replacing key roles, growing your team and building new functions.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Our process:</strong> Role briefing → Talent search → Screening → Shortlist → Interview support → Offer.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Replacement assurance:</strong> Available within the agreed tenure period.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Technical screening:</strong> Conducted by engineers who understand the domain.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Culture-fit check:</strong> Skills get people hired; values make them stay.</div>
          </li>
        </ul>

        {onOpenShortlist && (
          <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="talento-btn talento-btn-primary" data-track="request_shortlist_click" onClick={onOpenShortlist}>
              REQUEST TALENT SHORTLIST <span className="talento-arrow">↗</span>
            </button>
            <SectionLink sectionId="final-cta" hash="contact" track="contact_cta" className="talento-btn talento-btn-secondary">
              TALK TO OUR TEAM <span className="talento-arrow">→</span>
            </SectionLink>
          </div>
        )}
      </div>
      <div className="talento-model-visual">
        <div className="talento-model-img-wrap">
          <picture>
            <source srcSet="/images/staffing/permanent-placement.webp" type="image/webp" />
            <img
              src="/images/staffing/permanent-placement.jpg"
              alt="Permanent placement technical interview and candidate evaluation"
              className="talento-model-img"
              width="1600"
              height="1067"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </div>
  )
}

/**
 * Executive Search Component
 */
export function ExecutiveSearchBlock({ onOpenShortlist, isDedicatedPage }: { onOpenShortlist?: () => void, isDedicatedPage?: boolean }) {
  return (
    <div id="executive-search" className="talento-model-block talento-model-block-exec anim-scroll">
      <div className="talento-model-visual">
        <div className="talento-model-img-wrap">
          <picture>
            <source srcSet="/images/staffing/executive-search.webp" type="image/webp" />
            <img
              src="/images/staffing/executive-search.jpg"
              alt="Executive search confidential consultation with senior technology leader"
              className="talento-model-img"
              width="1600"
              height="1067"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </div>
      <div className="talento-model-content">
        <div className="talento-model-header-line">
          <span className="talento-model-num">02</span>
          <h3 className="talento-model-name">EXECUTIVE<br />SEARCH</h3>
        </div>
        <p className="talento-model-pitch">
          Need a senior leader or a rare expert? We search for top-level talent for key roles.
        </p>
        <p className="talento-model-tagline">
          Confidential hiring for CXO, VP and Director-level technology leaders.
        </p>
        <p className="talento-model-desc">
          Hiring a CTO, Head of Data, VP of Engineering or transformation leader? We conduct discreet searches across India and key global markets, using domain mapping and reference checks.
        </p>

        <ul className="talento-checklist">
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Best for:</strong> C-suite, leadership teams, general management and senior specialist roles.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Approach:</strong> Discreet, targeted searches of active and passive candidates.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Assessment:</strong> Leadership competency reviews and culture-fit profiling.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Vetting:</strong> Background, credentials and executive reference checks.</div>
          </li>
          <li>
            <span className="talento-check">✓</span>
            <div><strong>Retention focus:</strong> Candidates matched to your long-term vision.</div>
          </li>
        </ul>

        {onOpenShortlist && (
          <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="talento-btn talento-btn-primary" data-track="request_shortlist_click" onClick={onOpenShortlist}>
              REQUEST EXECUTIVE SEARCH <span className="talento-arrow">↗</span>
            </button>
            <SectionLink sectionId="final-cta" hash="contact" track="contact_cta" className="talento-btn talento-btn-secondary">
              SCHEDULE CONFIDENTIAL CALL <span className="talento-arrow">→</span>
            </SectionLink>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Staffing Models Section
 */
export function StaffingModelsSection() {
  return (
    <section id="staffing-models" className="talento-models-section anim-scroll">
      <div id="models" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
      <div className="talento-models-header">
        <h2 className="talento-section-title">OUR STAFFING MODULES</h2>
        <span className="talento-title-divider anim-line"></span>
        <p className="talento-header-intro">
          Every company has different needs. Choose the staffing model that best fits yours.
        </p>
      </div>
      <PermanentPlacementBlock />
      <ExecutiveSearchBlock />
    </section>
  )
}

type JobFunctionKey =
  | 'engineering'
  | 'it'
  | 'finance'
  | 'sales'
  | 'hr'
  | 'operations'
  | 'procurement'
  | 'customer'
  | 'leadership'

const JOB_FUNCTIONS: { id: number; num: string; key: JobFunctionKey; label: string; isFocal?: boolean }[] = [
  { id: 1, num: '01', key: 'engineering', label: 'Engineering & Technical' },
  { id: 2, num: '02', key: 'it', label: 'IT & Digital' },
  { id: 3, num: '03', key: 'finance', label: 'Finance & Accounting' },
  { id: 4, num: '04', key: 'sales', label: 'Sales & Marketing' },
  { id: 5, num: '05', key: 'hr', label: 'Human Resources & Recruitment', isFocal: true },
  { id: 6, num: '06', key: 'operations', label: 'Operations & Administration' },
  { id: 7, num: '07', key: 'procurement', label: 'Procurement & Supply Chain' },
  { id: 8, num: '08', key: 'customer', label: 'Customer Service' },
  { id: 9, num: '09', key: 'leadership', label: 'Leadership & Executive Search' }
]

function JobFunctionIcon({ kind }: { kind: JobFunctionKey }) {
  const common = {
    viewBox: '0 0 32 32',
    width: 30,
    height: 30,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    shapeRendering: 'geometricPrecision' as const
  }

  switch (kind) {
    case 'engineering':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="talento-eng-metal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {/* Blueprint registration marks & calibrated drafting arc */}
          <path d="M3.5 7.5V4.5h3M3.5 24.5v3h3" strokeWidth="1.05" opacity="0.38" />
          <path d="M13.5 3.3a10.2 10.2 0 0 1 10.2 10.2" strokeWidth="1.0" strokeDasharray="2 2.4" opacity="0.45" />
          {/* Precision 8-tooth machined gear */}
          <g className="it-anim-gear" style={{ transformOrigin: '13.5px 13.5px' }}>
            <path
              d="M 19.16 12.23 L 21.23 12.49 L 21.23 14.51 L 19.16 14.77 L 18.40 16.61 L 19.68 18.25 L 18.25 19.68 L 16.61 18.40 L 14.77 19.16 L 14.51 21.23 L 12.49 21.23 L 12.23 19.16 L 10.39 18.40 L 8.75 19.68 L 7.32 18.25 L 8.60 16.61 L 7.84 14.77 L 5.77 14.51 L 5.77 12.49 L 7.84 12.23 L 8.60 10.39 L 7.32 8.75 L 8.75 7.32 L 10.39 8.60 L 12.23 7.84 L 12.49 5.77 L 14.51 5.77 L 14.77 7.84 L 16.61 8.60 L 18.25 7.32 L 19.68 8.75 L 18.40 10.39 Z"
              fill="url(#talento-eng-metal)"
              strokeWidth="1.45"
            />
            <circle cx="13.5" cy="13.5" r="3.5" strokeWidth="1.2" opacity="0.85" />
            <circle cx="13.5" cy="13.5" r="1.25" fill="currentColor" stroke="none" />
          </g>
          {/* Calibrated precision caliper / drafting stylus */}
          <path className="it-anim-wf-top" d="M18.8 17.4l9.1 9.1a1.45 1.45 0 0 1-2.05 2.05l-9.1-9.1" fill="url(#talento-eng-metal)" strokeWidth="1.5" />
          <path className="it-anim-wf-top" d="M16.2 19.8l3.6-3.6" strokeWidth="1.55" />
          <path className="it-anim-wf-mid" d="M21 21.8l1.6-1.6M23.2 24l1.6-1.6M25.4 26.2l1.2-1.2" strokeWidth="1.15" opacity="0.6" />
        </svg>
      )
    case 'it':
      return (
        <svg {...common}>
          {/* Architectural display with subtle screen plane */}
          <rect x="3.5" y="5.5" width="20" height="14.5" rx="2.2" fill="currentColor" fillOpacity="0.07" />
          <line x1="8.5" y1="24.5" x2="18.5" y2="24.5" />
          <line x1="13.5" y1="20" x2="13.5" y2="24.5" />
          <line x1="3.5" y1="16.5" x2="23.5" y2="16.5" strokeWidth="1.1" opacity="0.4" />
          {/* Interface & terminal lines */}
          <polyline className="it-anim-wf-top" points="7.5 9.5 10.5 11.8 7.5 14" strokeWidth="1.55" />
          <line className="it-anim-wf-mid" x1="12.5" y1="14" x2="17.5" y2="14" strokeWidth="1.5" />
          {/* Connected infrastructure nodes */}
          <path d="M23.5 10.5h3.2M23.5 15h2.5" strokeWidth="1.2" opacity="0.55" />
          <circle className="it-anim-iot-sensor" cx="27.5" cy="10.5" r="1.6" fill="currentColor" fillOpacity="0.18" strokeWidth="1.4" />
          <circle cx="27" cy="15" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'finance':
      return (
        <svg {...common}>
          {/* Executive ledger axis & subtle grid */}
          <path d="M4.5 5v21.5h23" />
          <line x1="4.5" y1="14" x2="27.5" y2="14" strokeWidth="1.05" opacity="0.28" />
          <line x1="4.5" y1="20" x2="27.5" y2="20" strokeWidth="1.05" opacity="0.28" />
          {/* Stepped analytical bars */}
          <rect className="it-anim-wf-bot" x="7.8" y="18.5" width="3.4" height="8" rx="0.6" />
          <rect className="it-anim-wf-mid" x="14" y="14" width="3.4" height="12.5" rx="0.6" />
          <rect className="it-anim-wf-top" x="20.2" y="9.5" width="3.4" height="17" rx="0.6" fill="currentColor" fillOpacity="0.14" />
          {/* Market trajectory & apex node */}
          <polyline className="it-anim-wf-top" points="7.5 14 14 9.5 19 11.5 25.5 5.5" strokeWidth="1.45" />
          <circle className="it-anim-iot-sensor" cx="25.5" cy="5.5" r="1.7" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'sales':
      return (
        <svg {...common}>
          {/* Strategic expansion target base */}
          <circle cx="10.5" cy="21" r="6.2" fill="currentColor" fillOpacity="0.07" strokeWidth="1.35" opacity="0.65" />
          <circle cx="10.5" cy="21" r="2.6" strokeWidth="1.4" />
          <circle cx="10.5" cy="21" r="1.1" fill="currentColor" stroke="none" />
          {/* Growth vector & strategic trajectory */}
          <path className="it-anim-wf-top" d="M12.5 19L25.5 6" strokeWidth="1.75" />
          <polyline className="it-anim-wf-top" points="19.5 6 25.5 6 25.5 12" strokeWidth="1.75" />
          {/* Market signal arcs */}
          <path className="it-anim-iot-wave-inner" d="M18.5 22.5a7.5 7.5 0 0 0 6-6" strokeWidth="1.25" opacity="0.65" />
          <path className="it-anim-wf-mid" d="M5 9.5h4.5M5 12.5h3" strokeWidth="1.3" opacity="0.55" />
        </svg>
      )
    case 'hr':
      return (
        <svg {...common}>
          {/* Central executive/candidate silhouette */}
          <circle className="it-anim-iot-sensor" cx="16" cy="9.5" r="3.3" fill="currentColor" fillOpacity="0.12" />
          <path d="M10.2 25.5v-2.2a5.8 5.8 0 0 1 11.6 0v2.2" fill="currentColor" fillOpacity="0.08" />
          {/* Flanking workforce members */}
          <circle cx="7" cy="13" r="2.3" strokeWidth="1.45" />
          <path d="M3.5 25.5v-1.6a3.8 3.8 0 0 1 4.4-3.7" strokeWidth="1.45" />
          <circle cx="25" cy="13" r="2.3" strokeWidth="1.45" />
          <path d="M28.5 25.5v-1.6a3.8 3.8 0 0 0-4.4-3.7" strokeWidth="1.45" />
          {/* Organizational relationship arc & nodes */}
          <path className="it-anim-wf-top" d="M8.5 7.5a9.5 9.5 0 0 1 15 0" strokeWidth="1.2" opacity="0.55" />
          <circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="23.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'operations':
      return (
        <svg {...common}>
          {/* Top governance hub */}
          <rect x="11" y="4" width="10" height="6" rx="1.4" fill="currentColor" fillOpacity="0.12" />
          <line x1="13.5" y1="7" x2="18.5" y2="7" strokeWidth="1.3" opacity="0.7" />
          {/* Orthogonal workflow bus */}
          <path className="it-anim-wf-top" d="M16 10v5.5M6.5 20.5v-2.5a2.5 2.5 0 0 1 2.5-2.5h14a2.5 2.5 0 0 1 2.5 2.5v2.5" strokeWidth="1.4" />
          <line className="it-anim-wf-top" x1="16" y1="15.5" x2="16" y2="20.5" strokeWidth="1.4" />
          {/* Three synchronized operational stages */}
          <rect className="it-anim-wf-bot" x="3.8" y="20.5" width="5.4" height="6" rx="1.1" />
          <rect className="it-anim-wf-mid" x="13.3" y="20.5" width="5.4" height="6" rx="1.1" fill="currentColor" fillOpacity="0.1" />
          <rect className="it-anim-wf-bot" x="22.8" y="20.5" width="5.4" height="6" rx="1.1" />
        </svg>
      )
    case 'procurement':
      return (
        <svg {...common}>
          {/* Isometric logistics container */}
          <polygon points="16 4.5 25 9.5 16 14.5 7 9.5" fill="currentColor" fillOpacity="0.1" stroke="none" />
          <path d="M16 4.5L25 9.5v10L16 24.5 7 19.5v-10L16 4.5z" />
          <polyline className="it-anim-wf-top" points="7 9.5 16 14.5 25 9.5" strokeWidth="1.45" />
          <line className="it-anim-wf-mid" x1="16" y1="14.5" x2="16" y2="24.5" strokeWidth="1.45" />
          <line x1="11.5" y1="7" x2="20.5" y2="12" strokeWidth="1.15" opacity="0.55" />
          {/* Connected supply-chain network nodes */}
          <path d="M7 19.5l-2.5 2.5M25 19.5l2.5 2.5M16 24.5v2.5" strokeWidth="1.2" opacity="0.55" />
          <circle cx="4" cy="23.5" r="1.6" fill="currentColor" fillOpacity="0.2" strokeWidth="1.35" />
          <circle className="it-anim-iot-sensor" cx="28" cy="23.5" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="16" cy="28" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'customer':
      return (
        <svg {...common}>
          {/* Precision acoustic headband & dual earcups */}
          <path d="M6.5 16.5V14a9.5 9.5 0 0 1 19 0v2.5" />
          <path d="M9.5 13.5a6.5 6.5 0 0 1 13 0" strokeWidth="1.1" opacity="0.4" />
          <rect x="4" y="15.5" width="4.5" height="7" rx="1.8" fill="currentColor" fillOpacity="0.12" />
          <rect x="23.5" y="15.5" width="4.5" height="7" rx="1.8" fill="currentColor" fillOpacity="0.12" />
          {/* Articulated boom mic & support indicator */}
          <path className="it-anim-wf-top" d="M25.5 22.5v1.5a3.2 3.2 0 0 1-3.2 3.2h-5.3" strokeWidth="1.5" />
          <rect className="it-anim-iot-sensor" x="13.5" y="25.7" width="4" height="2.8" rx="1.4" fill="currentColor" />
          <path className="it-anim-iot-wave-inner" d="M12.5 16a4.8 4.8 0 0 1 7 0" strokeWidth="1.35" opacity="0.7" />
        </svg>
      )
    case 'leadership':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="talento-lead-metal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Subtle executive stature arc */}
          <path d="M8.5 8.5a9.2 9.2 0 0 1 15 0" strokeWidth="1.0" strokeDasharray="1.8 2.4" opacity="0.35" />
          {/* Architectural 3-peak executive crown */}
          <path className="it-anim-wf-top" d="M9.4 12.6L8.2 6.8l4.4 2.8L16 4.6l3.4 5 4.4-2.8-1.2 5.8H9.4z" fill="url(#talento-lead-metal)" strokeWidth="1.55" />
          <circle className="it-anim-iot-sensor" cx="16" cy="3.6" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="8" cy="6.2" r="0.95" fill="currentColor" stroke="none" opacity="0.75" />
          <circle cx="24" cy="6.2" r="0.95" fill="currentColor" stroke="none" opacity="0.75" />
          <line x1="10.2" y1="14.3" x2="21.8" y2="14.3" strokeWidth="1.05" opacity="0.45" />
          {/* Executive bust with tailored lapel silhouette */}
          <circle cx="16" cy="18.2" r="2.85" fill="url(#talento-lead-metal)" strokeWidth="1.55" />
          <path d="M7.2 28v-1.4a8.8 8.8 0 0 1 17.6 0V28" fill="url(#talento-lead-metal)" strokeWidth="1.6" />
          <path className="it-anim-wf-mid" d="M13 21.8L16 26.4l3-4.6" strokeWidth="1.2" opacity="0.78" />
          <line x1="16" y1="26.4" x2="16" y2="28" strokeWidth="1.15" opacity="0.55" />
          <line x1="5.8" y1="28" x2="26.2" y2="28" strokeWidth="1.15" opacity="0.35" />
        </svg>
      )
  }
}

/**
 * Practice Areas Section
 */
export function PracticeAreasSection({
  activeTechCard,
  setActiveTechCard
}: {
  activeTechCard: number | null
  setActiveTechCard: React.Dispatch<React.SetStateAction<number | null>>
}) {
  const [activeFunctionCard, setActiveFunctionCard] = useState<number | null>(null)
  return (
    <>
      <section id="practice-areas" className="talento-tech-section anim-scroll" aria-label="Technology Areas We Hire For">
        <div id="technology-areas" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
        <div className="talento-tech-bg" aria-hidden="true">
          <div className="talento-tech-bg-building">
            <picture>
              <source srcSet="/images/staffing/architectural-glass-building.webp" type="image/webp" />
              <img
                src="/images/staffing/architectural-glass-building.jpg"
                alt=""
                className="talento-tech-building-img"
                width="2400"
                height="1200"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>

          <svg
            className="talento-tech-ribbon-svg"
            viewBox="0 0 1024 576"
            preserveAspectRatio="xMaxYMin meet"
            shapeRendering="geometricPrecision"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="silver-ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#eaecf0" stopOpacity="0.88" />
                <stop offset="70%" stopColor="#c5c8cf" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#9ba0aa" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="silver-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="50%" stopColor="#f4f5f8" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#d6d8df" stopOpacity="0.7" />
              </linearGradient>
              <filter id="ribbon-shadow" x="-10%" y="-10%" width="130%" height="150%">
                <feDropShadow dx="-2" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.22" />
              </filter>
            </defs>
            <path
              d="M 460 250 C 530 255, 570 170, 640 185 C 720 202, 850 250, 1024 190 L 1024 285 C 880 340, 750 260, 650 230 C 560 205, 520 270, 460 250 Z"
              fill="url(#silver-ribbon-grad)"
              filter="url(#ribbon-shadow)"
            />
            <path
              d="M 460 250 C 530 255, 570 170, 640 185 C 720 202, 850 250, 1024 190"
              stroke="url(#silver-highlight)"
              strokeWidth="3.5"
              fill="none"
            />
            <path
              d="M 520 270 C 600 240, 720 220, 850 275 C 930 305, 980 290, 1024 270 L 1024 310 C 960 330, 880 320, 780 280 C 680 240, 580 290, 520 270 Z"
              fill="rgba(255,255,255,0.7)"
            />
          </svg>

          <div className="talento-tech-bottom-swoosh" />
        </div>

        <div className="talento-tech-content">
          <div className="talento-tech-header-wrap">
            <div className="talento-eyebrow">
              <span className="talento-eyebrow-line" aria-hidden="true"></span>
              SPECIALIZED ENGINEERING TALENT
            </div>
            <h2 className="talento-tech-title">
              TECHNOLOGY AREAS<br />WE HIRE FOR
            </h2>
            <p className="talento-tech-sub">
              We find talent in these areas:
            </p>
          </div>

          <div className="talento-tech-grid">
            {/* 1. Software Engineering */}
            <div
              className={`talento-tech-card ${activeTechCard === 1 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 1 ? null : 1))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 1 ? null : 1))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="Software Engineering practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline className="it-anim-bracket-right" points="16 18 22 12 16 6"></polyline>
                    <polyline className="it-anim-bracket-left" points="8 6 2 12 8 18"></polyline>
                    <line className="it-anim-code-cursor" x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">01</span>
              </div>
              <h3 className="talento-tech-card-title">SOFTWARE ENGINEERING</h3>
              <p className="talento-tech-card-desc">
                Full-stack engineers, backend system architects, microservices specialists, distributed systems developers, and mobile platform engineers.
              </p>
            </div>

            {/* 2. AI and Machine Learning */}
            <div
              className={`talento-tech-card ${activeTechCard === 2 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 2 ? null : 2))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 2 ? null : 2))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="AI and Machine Learning practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect className="it-anim-chip-core" x="4" y="4" width="16" height="16" rx="2" />
                    <rect className="it-anim-neural-node" x="9" y="9" width="6" height="6" />
                    <line className="it-anim-neural-pin" x1="9" y1="1" x2="9" y2="4" />
                    <line className="it-anim-neural-pin" x1="12" y1="1" x2="12" y2="4" />
                    <line className="it-anim-neural-pin" x1="15" y1="1" x2="15" y2="4" />
                    <line className="it-anim-neural-pin" x1="9" y1="20" x2="9" y2="23" />
                    <line className="it-anim-neural-pin" x1="12" y1="20" x2="12" y2="23" />
                    <line className="it-anim-neural-pin" x1="15" y1="20" x2="15" y2="23" />
                    <line className="it-anim-neural-pin" x1="20" y1="9" x2="23" y2="9" />
                    <line className="it-anim-neural-pin" x1="20" y1="12" x2="23" y2="12" />
                    <line className="it-anim-neural-pin" x1="20" y1="15" x2="23" y2="15" />
                    <line className="it-anim-neural-pin" x1="1" y1="9" x2="4" y2="9" />
                    <line className="it-anim-neural-pin" x1="1" y1="12" x2="4" y2="12" />
                    <line className="it-anim-neural-pin" x1="1" y1="15" x2="4" y2="15" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">02</span>
              </div>
              <h3 className="talento-tech-card-title">AI AND MACHINE LEARNING</h3>
              <p className="talento-tech-card-desc">
                Generative AI specialists, LLM fine-tuning architects, computer vision engineers, NLP researchers, and MLOps deployment practitioners.
              </p>
            </div>

            {/* 3. Data Engineering and Analytics */}
            <div
              className={`talento-tech-card ${activeTechCard === 3 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 3 ? null : 3))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 3 ? null : 3))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="Data Engineering and Analytics practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse className="it-anim-data-stream" cx="12" cy="5" rx="9" ry="3" />
                    <path className="it-anim-data-stream" d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path className="it-anim-data-stream" d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    <circle className="it-anim-data-particle" cx="12" cy="8" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">03</span>
              </div>
              <h3 className="talento-tech-card-title">DATA ENGINEERING AND ANALYTICS</h3>
              <p className="talento-tech-card-desc">
                Lakehouse architects, real-time streaming pipeline engineers (Spark, Kafka), Snowflake/Databricks experts, and analytics dashboard leaders.
              </p>
            </div>

            {/* 4. Cloud and DevOps */}
            <div
              className={`talento-tech-card ${activeTechCard === 4 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 4 ? null : 4))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 4 ? null : 4))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="Cloud and DevOps practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path className="it-anim-pipeline-line" d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    <circle className="it-anim-server-status" cx="19" cy="11" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">04</span>
              </div>
              <h3 className="talento-tech-card-title">CLOUD AND DEVOPS</h3>
              <p className="talento-tech-card-desc">
                Kubernetes administrators, Terraform infrastructure-as-code architects, AWS and Azure platform engineers, and CI/CD automation specialists.
              </p>
            </div>

            {/* 5. Cybersecurity */}
            <div
              className={`talento-tech-card ${activeTechCard === 5 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 5 ? null : 5))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 5 ? null : 5))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="Cybersecurity practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path className="it-anim-shield-check" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                    <line className="it-anim-scan-line" x1="6" y1="11" x2="18" y2="11" strokeWidth="1.5" stroke="#ffffff" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">05</span>
              </div>
              <h3 className="talento-tech-card-title">CYBERSECURITY</h3>
              <p className="talento-tech-card-desc">
                Information security managers, cloud security posture engineers, penetration testers, SOC analysts, and IAM compliance architects.
              </p>
            </div>

            {/* 6. IoT and Industrial IoT (IIoT) */}
            <div
              className={`talento-tech-card ${activeTechCard === 6 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 6 ? null : 6))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 6 ? null : 6))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="IoT and Industrial IoT (IIoT) practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path className="it-anim-iot-wave-outer" d="M7 6a7.5 7.5 0 0 1 10 0" />
                    <path className="it-anim-iot-wave-inner" d="M9.5 8.5a4 4 0 0 1 5 0" />
                    <rect x="3" y="10" width="18" height="12" rx="2" />
                    <circle className="it-anim-iot-sensor" cx="12" cy="16" r="1.5" fill="currentColor" />
                    <line x1="12" y1="10" x2="12" y2="8.5" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">06</span>
              </div>
              <h3 className="talento-tech-card-title">IOT AND INDUSTRIAL IOT (IIOT)</h3>
              <p className="talento-tech-card-desc">
                Edge computing developers, sensor integration specialists, SCADA/PLC interface engineers, MQTT firmware architects, and factory connectivity leads.
              </p>
            </div>

            {/* 7. Enterprise Applications */}
            <div
              className={`talento-tech-card ${activeTechCard === 7 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 7 ? null : 7))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 7 ? null : 7))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="Enterprise Applications practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon className="it-anim-wf-top" points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline className="it-anim-wf-mid" points="2 17 12 22 22 17" />
                    <polyline className="it-anim-wf-bot" points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">07</span>
              </div>
              <h3 className="talento-tech-card-title">ENTERPRISE APPLICATIONS</h3>
              <p className="talento-tech-card-desc">
                SAP S/4HANA implementation consultants, Salesforce platform architects, ServiceNow workflow leads, and Workday enterprise integrators.
              </p>
            </div>

            {/* 8. Other Specialized Technology Fields */}
            <div
              className={`talento-tech-card ${activeTechCard === 8 ? 'is-active' : ''}`}
              onClick={() => setActiveTechCard((prev) => (prev === 8 ? null : 8))}
              onMouseLeave={() => { if (activeTechCard !== null) setActiveTechCard(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTechCard((prev) => (prev === 8 ? null : 8))
                }
              }}
              tabIndex={0}
              role="article"
              aria-label="Other Specialized Technology Fields practice area"
            >
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path className="it-anim-gear" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <span className="talento-tech-card-num">08</span>
              </div>
              <h3 className="talento-tech-card-title">OTHER SPECIALIZED TECHNOLOGY FIELDS</h3>
              <p className="talento-tech-card-desc">
                Embedded C/C++ automotive systems, high-frequency trading platforms, bioinformatics, robotics, and custom domain hardware-software integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Job Functions We Support */}
      <section id="key-job-functions" className="talento-functions-section anim-scroll" aria-label="Key Job Functions We Support">
        <div className="talento-functions-container">
          <div className="talento-functions-header">
            <div className="talento-eyebrow">
              <span className="talento-eyebrow-line" aria-hidden="true"></span>
              FUNCTIONAL EXPERTISE
            </div>
            <h2 className="talento-tech-title">
              KEY JOB FUNCTIONS<br />WE SUPPORT
            </h2>
            <p className="talento-tech-sub">
              Across industries, we help you hire the right talent for critical business functions.
            </p>
          </div>

          <div className="talento-functions-stage">
            <svg
              className="talento-functions-curves"
              viewBox="0 0 1440 340"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className="talento-fn-curve-path"
                d="M 40 270 C 260 270, 420 190, 720 220 C 1020 250, 1180 185, 1400 245"
                fill="none"
                stroke="rgba(17, 17, 17, 0.24)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="talento-fn-curve-path talento-fn-curve-secondary"
                d="M 90 180 C 350 110, 560 72, 720 92 C 930 118, 1150 165, 1360 135"
                fill="none"
                stroke="rgba(17, 17, 17, 0.12)"
                strokeWidth="1.15"
                vectorEffect="non-scaling-stroke"
              />
              <circle className="talento-fn-curve-dot" cx="720" cy="220" r="4.5" fill="#111111" />
              <circle className="talento-fn-curve-dot" cx="565" cy="142" r="4" fill="#ffffff" stroke="rgba(17, 17, 17, 0.35)" strokeWidth="1.5" />
            </svg>

            <div className="talento-fn-orbit">
              {JOB_FUNCTIONS.map((fn) => {
                const isActive = activeFunctionCard === fn.id
                return (
                  <div
                    key={fn.key}
                    className={`talento-fn-circle talento-fn-pos-${fn.id} ${fn.isFocal ? 'is-focal' : ''} ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveFunctionCard((prev) => (prev === fn.id ? null : fn.id))}
                    onMouseLeave={() => { if (activeFunctionCard !== null) setActiveFunctionCard(null) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setActiveFunctionCard((prev) => (prev === fn.id ? null : fn.id))
                      }
                    }}
                    tabIndex={0}
                    role="article"
                    aria-label={`${fn.num} – ${fn.label}`}
                  >
                    <div className="talento-fn-circle-inner">
                      <span className="talento-fn-num">{fn.num}</span>
                      <div className="talento-fn-icon" aria-hidden="true">
                        <JobFunctionIcon kind={fn.key} />
                      </div>
                      <h3 className="talento-fn-label">{fn.label}</h3>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Non-Tech Strip */}
      <section id="non-technology-areas" className="talento-nontech-strip anim-scroll" aria-label="Non-Technology Recruitment Support">
        <div className="talento-nontech-box">
          <div className="talento-nontech-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="talento-nontech-text-wrap">
            <h3 className="talento-nontech-title">NON-TECHNOLOGY AREAS WE HIRE FOR</h3>
            <p className="talento-nontech-statement">
              SMRIKAAM WORKFORCE also provides recruitment services across non-technology fields, based on individual client requirements.
            </p>
          </div>
          <span className="talento-nontech-badge">BROAD-SPECTRUM PLACEMENT</span>
        </div>
      </section>
    </>
  )
}

/**
 * Dual Section (Offshore Teams & Payroll Compliance)
 */
export function DualSection() {
  return (
    <section className="talento-dual-section anim-scroll" aria-label="Dedicated Offshore Team and Workforce Administration">
      <div className="talento-dual-bg-decor" aria-hidden="true">
        <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="talento-dual-svg">
          <polygon points="1060,0 1440,0 1440,240 1310,255 1020,110" fill="#f0f0f0" opacity="0.8" />
          <polygon points="1440,360 1160,600 1440,600" fill="#f4f4f4" opacity="0.7" />
          <polygon points="0,80 130,40 170,180 0,260" fill="#f7f7f7" opacity="0.6" />
        </svg>
      </div>
      <div className="talento-dual-grid">
        {/* Dedicated Offshore Team */}
        <div id="offshore-teams" className="talento-card-half anim-scroll">
          <div className="talento-half-img-wrap">
            <picture>
              <source srcSet="/images/staffing/offshore-team.webp" type="image/webp" />
              <img
                src="/images/staffing/offshore-team.jpg"
                alt="SMRIKAAM dedicated offshore engineering team collaborating in high-tech development office"
                className="talento-half-img"
                width="1600"
                height="720"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
          <div className="talento-half-content">
            <div className="talento-eyebrow">
              <span className="talento-eyebrow-line" aria-hidden="true"></span>
              <span>DEDICATED CAPACITY</span>
            </div>
            <h3 className="talento-half-title">
              BUILD A DEDICATED<br />
              OFFSHORE TEAM
            </h3>
            <p className="talento-half-desc">
              <strong>Want a team that works exclusively for you?</strong> We can set up a dedicated engineering team that fits your technology requirements, working methods and business goals. We also help you grow and manage the team over time.
            </p>
          </div>
        </div>

        {/* Payroll and Compliance Support */}
        <div id="payroll" className="talento-card-half anim-scroll">
          <div id="payroll-compliance" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
          <div className="talento-half-img-wrap">
            <picture>
              <source srcSet="/images/staffing/payroll-compliance.webp" type="image/webp" />
              <img
                src="/images/staffing/payroll-compliance.jpg"
                alt="HR operations specialist reviewing payroll documentation, statutory records and contracts"
                className="talento-half-img"
                width="1600"
                height="720"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
          <div className="talento-half-content">
            <div className="talento-eyebrow">
              <span className="talento-eyebrow-line" aria-hidden="true"></span>
              <span>WORKFORCE ADMINISTRATION</span>
            </div>
            <h3 className="talento-half-title">
              PAYROLL AND<br />
              COMPLIANCE SUPPORT
            </h3>
            <p className="talento-payroll-sub">
              SMRIKAAM WORKFORCE can also handle workforce administration and related paperwork. This can include:
            </p>
            <ul className="talento-payroll-list">
              <li><span className="talento-check">✓</span> Payroll</li>
              <li><span className="talento-check">✓</span> Legal and statutory compliance</li>
              <li><span className="talento-check">✓</span> Onboarding</li>
              <li><span className="talento-check">✓</span> Documents and records</li>
              <li><span className="talento-check">✓</span> Day-to-day workforce coordination</li>
            </ul>
            <p className="talento-payroll-note">
              This support applies to eligible staffing engagements.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Where We Work Section (Locations)
 */
export function WhereWeWorkSection() {
  return (
    <section id="locations" className="talento-work-section anim-scroll" aria-label="Geographical Coverage">
      <div id="where-we-work" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
      <div className="talento-work-grid">
        <div className="talento-work-info">
          <span className="talento-eyebrow">DELIVERY FOOTPRINT</span>
          <h2 className="talento-section-title">WHERE WE WORK</h2>
          <p className="talento-work-text">
            We support technology hiring and project delivery across <strong>India and international markets.</strong> The exact setup depends on the role, the engagement model and your needs.
          </p>
          <p className="talento-work-text">
            SMRIKAAM WORKFORCE operates from Coimbatore, India, and supports eligible international staffing engagements for companies in markets such as the USA, UK, Canada, Australia, the UAE and Singapore. This includes offshore engineering teams, permanent placement and executive search.
          </p>
          <div className="talento-location-tags">
            <span className="talento-tag talento-tag-hub"><span className="talento-radar-dot" aria-hidden="true"></span>COIMBATORE (TALENT HUB)</span>
          </div>
        </div>
        <div className="talento-work-visual-wrap">
          <picture>
            <source srcSet="/images/staffing/where-we-work.webp" type="image/webp" />
            <img
              src="/images/staffing/where-we-work.jpg"
              alt="Modern technology office campus in Coimbatore representing SMRIKAAM WORKFORCE recruitment and staffing network"
              className="talento-work-visual-img"
              width="1024"
              height="576"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </section>
  )
}

/**
 * FAQ Section
 */
export function FaqSection({
  activeFaq,
  setActiveFaq
}: {
  activeFaq: number | null
  setActiveFaq: React.Dispatch<React.SetStateAction<number | null>>
}) {
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  return (
    <section id="faq" className="talento-faq-section anim-scroll" aria-label="Frequently Asked Questions">
      <div id="faqs" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
      <div className="talento-faq-grid">
        <div className="talento-faq-left">
          <span className="talento-faq-dash anim-line"></span>
          <h2 className="talento-faq-title">
            FREQUENTLY<br />
            ASKED<br />
            QUESTIONS
          </h2>
        </div>

        <div className="talento-faq-right">
          <div className="talento-accordion">
            {FAQ_ITEMS.map((item, index) => (
              <div key={item.q} className={`talento-faq-item ${activeFaq === index ? 'active' : ''}`}>
                <button
                  type="button"
                  className="talento-faq-trigger"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeFaq === index}
                  aria-controls={`faq-p-${index}`}
                  id={`faq-h-${index}`}
                >
                  <span className="talento-faq-q">{item.q}</span>
                  <span className="talento-faq-toggle" aria-hidden="true">
                    {activeFaq === index ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={`faq-p-${index}`}
                  role="region"
                  aria-labelledby={`faq-h-${index}`}
                  className="talento-faq-panel"
                  style={{ display: activeFaq === index ? 'block' : 'none' }}
                >
                  <p className="talento-faq-answer">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Final Call To Action Section
 */
export function FinalCtaSection({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return (
    <section id="final-cta" className="talento-final-cta anim-scroll" aria-label="Ready to Hire Talent CTA">
      <div id="contact-cta" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
      <div className="talento-final-wrap">
        <div className="talento-final-left">
          <span className="talento-final-eyebrow">TALENT ACQUISITION DESK</span>
          <h2 className="talento-final-title">
            READY TO HIRE<br />
            SPECIALIZED TALENT?
          </h2>
        </div>
        <div className="talento-final-center">
          <p className="talento-final-text">
            Talk to our talent solutions team in Coimbatore. We will send you pre-screened profiles within 48 to 72 hours.
          </p>
        </div>
        <div className="talento-final-right">
          <button
            type="button"
            className="talento-btn talento-btn-cta"
            data-track="request_shortlist_click" onClick={onOpenShortlist}
          >
            REQUEST TALENT SHORTLIST
            <span className="talento-arrow">↗</span>
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * Contact & Shortlist Enquiry Form Section
 */
export function ContactSection({
  formState,
  setFormState,
  formStatus,
  formMessage,
  onSubmit
}: {
  formState: ShortlistFormState
  setFormState: React.Dispatch<React.SetStateAction<ShortlistFormState>>
  formStatus: 'idle' | 'submitting' | 'success' | 'error'
  formMessage: string
  onSubmit: (e: FormEvent) => void
}) {
  return (
    <section id="contact" className="talento-contact-section anim-scroll">
      <div id="shortlist-form" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}></div>
      <div className="talento-contact-grid">
        <div className="talento-contact-info">
          <span className="talento-eyebrow">TALENT ACQUISITION DESK</span>
          <h3>START YOUR HIRING SPRINT</h3>
          <p>
            Share your open roles, specialized technical skill sets, or executive leadership requirements. Our Coimbatore recruitment team will review your mandate and initiate talent mapping immediately.
          </p>

          <div className="talento-contact-details">
            <div className="talento-contact-item">
              <span>OFFICIAL EMAIL</span>
              <b><a href="mailto:contact@smrikaam.com" data-track="email_click">contact@smrikaam.com</a></b>
            </div>
            <div className="talento-contact-item">
              <span>PHONE / WHATSAPP</span>
              <b><a href="tel:+919150684601" data-track="phone_click">+91-9150684601</a></b>
            </div>
            <div className="talento-contact-item">
              <span>TALENT HUB LOCATION</span>
              <b>No. 19, Nataraj Nagar, Koundampalayam, Coimbatore, Tamil Nadu, India</b>
            </div>
            <div className="talento-contact-item">
              <span>DELIVERY SLA</span>
              <b>Pre-screened profiles delivered within 48 to 72 hours</b>
            </div>
          </div>
        </div>

        <div className="talento-contact-form-box">
          <form onSubmit={onSubmit}>
            <div className="talento-form-grid">
              <div className="talento-field">
                <label htmlFor="inlineFullName">Full Name *</label>
                <input
                  id="inlineFullName"
                  type="text"
                  required
                  placeholder="e.g. Anand Sundaram"
                  value={formState.fullName}
                  onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="inlineCompanyName">Company Name *</label>
                <input
                  id="inlineCompanyName"
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies"
                  value={formState.companyName}
                  onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="inlineEmail">Official Email *</label>
                <input
                  id="inlineEmail"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="inlinePhone">Mobile Number *</label>
                <input
                  id="inlinePhone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formState.phone}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="inlineHiringModel">Hiring Requirement</label>
                <select
                  id="inlineHiringModel"
                  value={formState.hiringModel}
                  onChange={(e) => setFormState({ ...formState, hiringModel: e.target.value })}
                >
                  <option value="Permanent Placement">Permanent Placement (Full-time)</option>
                  <option value="Executive Search">Executive Search (CXO / VP / Director)</option>
                  <option value="Dedicated Offshore Team">Dedicated Offshore Team</option>
                  <option value="Payroll & Compliance">Payroll and Compliance Support</option>
                  <option value="Non-Technology Roles">Non-Technology Recruitment</option>
                </select>
              </div>

              <div className="talento-field">
                <label htmlFor="inlinePositions">Number of Positions</label>
                <select
                  id="inlinePositions"
                  value={formState.positions}
                  onChange={(e) => setFormState({ ...formState, positions: e.target.value })}
                >
                  <option value="1-2">1–2 Positions</option>
                  <option value="3-5">3–5 Positions</option>
                  <option value="6-10">6–10 Positions</option>
                  <option value="10+">10+ Positions (Team Build)</option>
                </select>
              </div>

              <div className="talento-field talento-field-full">
                <label htmlFor="inlineRequiredSkills">Required Skills &amp; Tech Stack</label>
                <input
                  id="inlineRequiredSkills"
                  type="text"
                  placeholder="e.g. Python, Azure, IIoT, React, Data Engineering, LLMs"
                  value={formState.requiredSkills}
                  onChange={(e) => setFormState({ ...formState, requiredSkills: e.target.value })}
                />
              </div>

              <div className="talento-field talento-field-full">
                <label htmlFor="inlineDetails">Additional Details / Role Brief</label>
                <textarea
                  id="inlineDetails"
                  rows={4}
                  placeholder="Share specific experience levels, certifications, timeline constraints, or job descriptions..."
                  value={formState.details}
                  onChange={(e) => setFormState({ ...formState, details: e.target.value })}
                ></textarea>
              </div>
            </div>

            {formMessage && (
              <div className={`talento-alert ${formStatus === 'error' ? 'talento-alert-error' : 'talento-alert-success'}`}>
                {formMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={formStatus === 'submitting'}
              className="talento-btn talento-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {formStatus === 'submitting' ? 'TRANSMITTING REQUIREMENT...' : 'SUBMIT SHORTLIST ENQUIRY ↗'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

/**
 * Shortlist Modal Component
 */
export function ShortlistModal({
  open,
  onClose,
  formState,
  setFormState,
  formStatus,
  formMessage,
  onSubmit
}: {
  open: boolean
  onClose: () => void
  formState: ShortlistFormState
  setFormState: React.Dispatch<React.SetStateAction<ShortlistFormState>>
  formStatus: 'idle' | 'submitting' | 'success' | 'error'
  formMessage: string
  onSubmit: (e: FormEvent) => void
}) {
  if (!open) return null

  return (
    <div className="talento-modal-backdrop" onClick={onClose}>
      <div
        className="talento-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-head"
      >
        <div className="talento-modal-header">
          <div>
            <span className="talento-modal-eyebrow">SMRIKAAM WORKFORCE TALENT SOLUTIONS</span>
            <h3 id="modal-head" className="talento-modal-title">Request Talent Shortlist</h3>
            <p className="talento-modal-sub">
              Tell us your technical requirements. We will send curated candidate profiles in 48–72 hours.
            </p>
          </div>
          <button
            type="button"
            className="talento-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="talento-modal-body">
          <form onSubmit={onSubmit}>
            <div className="talento-form-grid">
              <div className="talento-field">
                <label htmlFor="modalFullName">Full Name *</label>
                <input
                  id="modalFullName"
                  type="text"
                  required
                  placeholder="e.g. Anand Sundaram"
                  value={formState.fullName}
                  onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="modalCompanyName">Company Name *</label>
                <input
                  id="modalCompanyName"
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies"
                  value={formState.companyName}
                  onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="modalEmail">Official Email *</label>
                <input
                  id="modalEmail"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="modalPhone">Mobile Number *</label>
                <input
                  id="modalPhone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formState.phone}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                />
              </div>

              <div className="talento-field">
                <label htmlFor="modalHiringModel">Hiring Requirement</label>
                <select
                  id="modalHiringModel"
                  value={formState.hiringModel}
                  onChange={(e) => setFormState({ ...formState, hiringModel: e.target.value })}
                >
                  <option value="Permanent Placement">Permanent Placement (Full-time)</option>
                  <option value="Executive Search">Executive Search (CXO / VP / Director)</option>
                  <option value="Dedicated Offshore Team">Dedicated Offshore Team</option>
                  <option value="Payroll & Compliance">Payroll and Compliance Support</option>
                  <option value="Non-Technology Roles">Non-Technology Recruitment</option>
                </select>
              </div>

              <div className="talento-field">
                <label htmlFor="modalPositions">Number of Positions</label>
                <select
                  id="modalPositions"
                  value={formState.positions}
                  onChange={(e) => setFormState({ ...formState, positions: e.target.value })}
                >
                  <option value="1-2">1–2 Positions</option>
                  <option value="3-5">3–5 Positions</option>
                  <option value="6-10">6–10 Positions</option>
                  <option value="10+">10+ Positions (Team Build)</option>
                </select>
              </div>

              <div className="talento-field talento-field-full">
                <label htmlFor="modalRequiredSkills">Required Skills &amp; Tech Stack</label>
                <input
                  id="modalRequiredSkills"
                  type="text"
                  placeholder="e.g. Python, Azure, IIoT, React, Data Engineering, LLMs"
                  value={formState.requiredSkills}
                  onChange={(e) => setFormState({ ...formState, requiredSkills: e.target.value })}
                />
              </div>

              <div className="talento-field talento-field-full">
                <label htmlFor="modalDetails">Additional Details / Role Brief</label>
                <textarea
                  id="modalDetails"
                  rows={4}
                  placeholder="Share specific experience levels, timeline constraints, or job descriptions..."
                  value={formState.details}
                  onChange={(e) => setFormState({ ...formState, details: e.target.value })}
                ></textarea>
              </div>
            </div>

            {formMessage && (
              <div className={`talento-alert ${formStatus === 'error' ? 'talento-alert-error' : 'talento-alert-success'}`}>
                {formMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="talento-btn talento-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formStatus === 'submitting'}
                className="talento-btn talento-btn-primary"
              >
                {formStatus === 'submitting' ? 'SUBMITTING...' : 'SUBMIT SHORTLIST REQUEST ↗'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   PAGE ROUTE COMPONENTS
   ========================================================================== */

/**
 * 1. Home Page (/ and /IT-staffing-services-in-Coimbatore)
 * Renders complete experience with all sections
 */
export function HomePage({
  onOpenShortlist,
  activeFaq,
  setActiveFaq,
  activeTechCard,
  setActiveTechCard,
  formState,
  setFormState,
  formStatus,
  formMessage,
  onFormSubmit
}: {
  onOpenShortlist: () => void
  activeFaq: number | null
  setActiveFaq: React.Dispatch<React.SetStateAction<number | null>>
  activeTechCard: number | null
  setActiveTechCard: React.Dispatch<React.SetStateAction<number | null>>
  formState: ShortlistFormState
  setFormState: React.Dispatch<React.SetStateAction<ShortlistFormState>>
  formStatus: 'idle' | 'submitting' | 'success' | 'error'
  formMessage: string
  onFormSubmit: (e: FormEvent) => void
}) {
  return (
    <>
      <HeroSection onOpenShortlist={onOpenShortlist} />
      <StaffingModelsSection />
      <PracticeAreasSection activeTechCard={activeTechCard} setActiveTechCard={setActiveTechCard} />
      <DualSection />
      <WhereWeWorkSection />
      <FaqSection activeFaq={activeFaq} setActiveFaq={setActiveFaq} />
      <FinalCtaSection onOpenShortlist={onOpenShortlist} />
      <ContactSection
        formState={formState}
        setFormState={setFormState}
        formStatus={formStatus}
        formMessage={formMessage}
        onSubmit={onFormSubmit}
      />
    </>
  )
}

/**
 * Backwards-compatible page component exports (render single-page continuous layout)
 */
export function StaffingModelsPage({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function PermanentPlacementPage({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function ExecutiveSearchPage({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function PracticeAreasPage({ onOpenShortlist }: { onOpenShortlist: () => void, activeTechCard?: number | null, setActiveTechCard?: any }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function OffshoreTeamsPage({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function PayrollCompliancePage({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function LocationsPage({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function FaqPage({ onOpenShortlist }: { onOpenShortlist: () => void, activeFaq?: any, setActiveFaq?: any }) {
  return <HomePage onOpenShortlist={onOpenShortlist} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={initialFormState} setFormState={() => { }} formStatus="idle" formMessage="" onFormSubmit={() => { }} />
}

export function ContactPage(props: any) {
  return <HomePage onOpenShortlist={() => { }} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={props.formState || initialFormState} setFormState={props.setFormState || (() => { })} formStatus={props.formStatus || "idle"} formMessage={props.formMessage || ""} onFormSubmit={props.onFormSubmit || (() => { })} />
}

export function RequestShortlistPage(props: any) {
  return <HomePage onOpenShortlist={() => { }} activeFaq={0} setActiveFaq={() => { }} activeTechCard={null} setActiveTechCard={() => { }} formState={props.formState || initialFormState} setFormState={props.setFormState || (() => { })} formStatus={props.formStatus || "idle"} formMessage={props.formMessage || ""} onFormSubmit={props.onFormSubmit || (() => { })} />
}

/**
 * Enterprise Scroll Reveal & Viewport Intersection Hook
 */
function useScrollReveal() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return

    document.body.classList.add('talento-animated')

    let observer: IntersectionObserver | null = null

    const selector =
      '.anim-scroll, #hero, #staffing-models, #permanent-placement, #executive-search, #practice-areas, #non-technology-areas, #offshore-teams, #payroll, #locations, #faq, #final-cta, #contact, .talento-tech-section, .talento-models-section, .talento-dual-section, .talento-work-section, .talento-where-we-work, .talento-faq-section, .talento-final-cta, .talento-contact-section, .talento-dedicated-section, .talento-nontech-strip, .talento-model-block, .talento-card-half'

    const checkTargets = () => {
      const targets = document.querySelectorAll(selector)
      targets.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight - 20 && rect.bottom > 20) {
          if (!el.classList.contains('is-revealed')) {
            el.classList.add('is-revealed')
            el.querySelectorAll('.anim-scroll').forEach((child) => child.classList.add('is-revealed'))
          }
        }
      })
    }

    const setupObserver = () => {
      const targets = document.querySelectorAll(selector)

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed')
                entry.target.querySelectorAll('.anim-scroll').forEach((child) => {
                  child.classList.add('is-revealed')
                })
                observer?.unobserve(entry.target)
              }
            })
          },
          {
            threshold: 0.05,
            rootMargin: '0px 0px -20px 0px'
          }
        )

        targets.forEach((el) => {
          observer?.observe(el)
        })
      }

      checkTargets()
    }

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkTargets()
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const timer = setTimeout(() => {
      setupObserver()
    }, 40)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [location.pathname])
}

/**
 * Enterprise Active Section Intersection & Scroll Tracking Hook
 */
export function useActiveSectionScroll({
  setActiveSection,
  isScrollingFromClickRef
}: {
  setActiveSection: (sec: string) => void
  isScrollingFromClickRef: React.MutableRefObject<boolean>
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      if (isScrollingFromClickRef.current) return

      const header = document.querySelector('.talento-header') as HTMLElement | null
      const headerHeight = header ? header.offsetHeight : (window.innerWidth <= 768 ? 72 : 82)
      const scrollPos = window.scrollY + headerHeight + 60

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        setActiveSection('contact')
        return
      }

      if (window.scrollY < 200) {
        setActiveSection('hero')
        return
      }

      const sections = [
        { id: 'contact', navKey: 'contact' },
        { id: 'final-cta', navKey: 'contact' },
        { id: 'faq', navKey: 'faq' },
        { id: 'locations', navKey: 'locations' },
        { id: 'payroll', navKey: 'payroll' },
        { id: 'offshore-teams', navKey: 'offshore-teams' },
        { id: 'key-job-functions', navKey: 'key-job-functions' },
        { id: 'practice-areas', navKey: 'practice-areas' },
        { id: 'executive-search', navKey: 'executive-search' },
        { id: 'permanent-placement', navKey: 'permanent-placement' },
        { id: 'staffing-models', navKey: 'staffing-models' }
      ]

      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el) {
          const top = getElementDocumentTop(el)
          if (scrollPos >= top) {
            setActiveSection(s.navKey)
            break
          }
        }
      }
    }

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [setActiveSection, isScrollingFromClickRef])
}

export function AppContent({
  modalOpen,
  setModalOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeFaq,
  setActiveFaq,
  activeTechCard,
  setActiveTechCard,
  formState,
  setFormState,
  formStatus,
  formMessage,
  onFormSubmit,
  activeSection,
  setActiveSection,
  isScrollingFromClickRef,
  clickTimerRef
}: {
  modalOpen: boolean
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  mobileMenuOpen: boolean
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  activeFaq: number | null
  setActiveFaq: React.Dispatch<React.SetStateAction<number | null>>
  activeTechCard: number | null
  setActiveTechCard: React.Dispatch<React.SetStateAction<number | null>>
  formState: ShortlistFormState
  setFormState: React.Dispatch<React.SetStateAction<ShortlistFormState>>
  formStatus: 'idle' | 'submitting' | 'success' | 'error'
  formMessage: string
  onFormSubmit: (e: FormEvent) => void
  activeSection: string
  setActiveSection: (sec: string) => void
  isScrollingFromClickRef: React.MutableRefObject<boolean>
  clickTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
}) {
  useScrollReveal()

  useActiveSectionScroll({
    setActiveSection,
    isScrollingFromClickRef
  })

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    const navKeyMap: Record<string, string> = {
      hero: 'hero',
      'staffing-models': 'staffing-models',
      models: 'staffing-models',
      'permanent-placement': 'permanent-placement',
      'executive-search': 'executive-search',
      'practice-areas': 'practice-areas',
      'technology-areas': 'practice-areas',
      'key-job-functions': 'key-job-functions',
      'job-functions': 'key-job-functions',
      'offshore-teams': 'offshore-teams',
      payroll: 'payroll',
      'payroll-compliance': 'payroll',
      locations: 'locations',
      'where-we-work': 'locations',
      faq: 'faq',
      faqs: 'faq',
      'final-cta': 'contact',
      contact: 'contact',
      'shortlist-form': 'contact'
    }

    const navKey = navKeyMap[targetId] || targetId
    setActiveSection(navKey)

    isScrollingFromClickRef.current = true
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      isScrollingFromClickRef.current = false
    }, 850)

    if (targetId === 'hero') {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname)
      }
      scrollToSection('hero', true)
    } else {
      const canonicalHash = targetId === 'final-cta' ? 'contact' : targetId
      window.history.pushState(null, '', `#${canonicalHash}`)
      scrollToSection(targetId, true)
    }
  }

  return (
    <>
      <Header
        activeSection={activeSection}
        onNavClick={handleNavClick}
        onOpenShortlistModal={() => setModalOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="talento-main">
        <Routes>
          <Route
            path="*"
            element={
              <HomePage
                onOpenShortlist={() => setModalOpen(true)}
                activeFaq={activeFaq}
                setActiveFaq={setActiveFaq}
                activeTechCard={activeTechCard}
                setActiveTechCard={setActiveTechCard}
                formState={formState}
                setFormState={setFormState}
                formStatus={formStatus}
                formMessage={formMessage}
                onFormSubmit={onFormSubmit}
              />
            }
          />
        </Routes>
      </main>

      <Footer onNavClick={handleNavClick} />

      <ShortlistModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        formState={formState}
        setFormState={setFormState}
        formStatus={formStatus}
        formMessage={formMessage}
        onSubmit={onFormSubmit}
      />
    </>
  )
}

/**
 * Universal Router Provider
 */
export function RouterWrapper({
  children,
  initialPath = TARGET_PATH
}: {
  children: React.ReactNode
  initialPath?: string
}) {
  if (typeof window === 'undefined') {
    return <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  }
  return <BrowserRouter>{children}</BrowserRouter>
}

/**
 * Top-Level App Component
 */
export function App({ initialPath }: { initialPath?: string }) {
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [activeTechCard, setActiveTechCard] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formState, setFormState] = useState<ShortlistFormState>(initialFormState)
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formMessage, setFormMessage] = useState('')
  const isScrollingFromClickRef = React.useRef(false)
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleTrackedClick)
    return () => document.removeEventListener('click', handleTrackedClick)
  }, [])

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formStatus === 'submitting') return
    setFormStatus('submitting')
    setFormMessage('')

    const fullName = formState.fullName.trim()
    const companyName = formState.companyName.trim()
    const email = formState.email.trim()
    const phone = formState.phone.trim()

    if (!fullName || !companyName || !email || !phone) {
      setFormStatus('error')
      setFormMessage('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFormStatus('error')
      setFormMessage('Please enter a valid official business email address.')
      return
    }

    const submitted = { ...formState, fullName, companyName, email, phone }
    const eventParams = {
      form_name: 'request_talent_shortlist',
      hiring_model: submitted.hiringModel,
      positions: submitted.positions,
      enquiry_region: getEnquiryRegion(submitted.phone)
    }
    const endpoint = ((import.meta.env.VITE_FORM_ENDPOINT as string | undefined) || '').trim()

    if (endpoint) {
      // Production delivery: POST to the configured form backend (VITE_FORM_ENDPOINT)
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...submitted, source: SITE_URL })
        })
        if (!res.ok) throw new Error(`Form endpoint responded with ${res.status}`)
        trackEvent('generate_lead', { ...eventParams, delivery: 'form_endpoint' })
        setFormStatus('success')
        setFormMessage(
          'Thank you! Your hiring requirement has been recorded. Our talent solutions team in Coimbatore will review your specifications and share pre-screened candidate profiles within 48 to 72 hours.'
        )
        setFormState(initialFormState)
      } catch {
        setFormStatus('error')
        setFormMessage(
          `We could not send your request just now. Please email ${BUSINESS.email} or call ${BUSINESS.telephone}.`
        )
      }
      return
    }

    // No form backend configured: open a pre-filled e-mail to the talent desk so the enquiry is never lost.
    const body = [
      `Full name: ${submitted.fullName}`,
      `Company: ${submitted.companyName}`,
      `Email: ${submitted.email}`,
      `Phone: ${submitted.phone}`,
      `Hiring model: ${submitted.hiringModel}`,
      `Required skills: ${submitted.requiredSkills}`,
      `Positions: ${submitted.positions}`,
      `Details: ${submitted.details.slice(0, 800)}`
    ].join('\n')
    const subject = `Talent shortlist request - ${submitted.companyName}`
    window.location.href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    trackEvent('lead_email_draft_opened', { ...eventParams, delivery: 'mailto' })
    setFormStatus('success')
    setFormMessage(
      `Your email app has opened with your hiring requirement pre-filled. Please press send to deliver it to ${BUSINESS.email}. If nothing opened, email us directly or call ${BUSINESS.telephone}.`
    )
    setFormState(initialFormState)
  }

  return (
    <RouterWrapper initialPath={initialPath}>
      <ScrollManager
        setActiveSection={setActiveSection}
        isScrollingFromClickRef={isScrollingFromClickRef}
      />
      <SEOManager />
      <AppContent
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeFaq={activeFaq}
        setActiveFaq={setActiveFaq}
        activeTechCard={activeTechCard}
        setActiveTechCard={setActiveTechCard}
        formState={formState}
        setFormState={setFormState}
        formStatus={formStatus}
        formMessage={formMessage}
        onFormSubmit={handleFormSubmit}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isScrollingFromClickRef={isScrollingFromClickRef}
        clickTimerRef={clickTimerRef}
      />
    </RouterWrapper>
  )
}

if (typeof document !== 'undefined') {
  const container = document.getElementById('root')
  if (container) {
    if (container.hasChildNodes()) {
      hydrateRoot(container, <App />)
    } else {
      createRoot(container).render(<App />)
    }
  }
}
