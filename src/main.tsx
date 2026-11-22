import React, { useState, useEffect, FormEvent } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom'
import './styles.css'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://smrikaam.com').replace(/\/$/, '')
export const TARGET_PATH = '/IT-staffing-services-in-Coimbatore'
export const CANONICAL_URL = `${SITE_URL}${TARGET_PATH}`
export const OG_IMAGE_URL = `${SITE_URL}/images/staffing/hero-interview.jpg`

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
 * SEO Manager for Head tags
 */
export function SEOManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const setMetaProperty = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const setMetaName = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }

    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }

    const scriptId = 'smrikaam-talento-schema'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }

    const isHome = pathname === '/' || pathname === TARGET_PATH || pathname === ''

    if (isHome) {
      document.title = 'IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM'
      metaDesc.setAttribute(
        'content',
        'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.'
      )
      metaKeywords.setAttribute(
        'content',
        'IT Staffing Services in Coimbatore, Technical Staffing, AI and Data Staffing, IIoT Staffing, Permanent Placement, Executive Search, Cloud and DevOps Recruitment, Dedicated Offshore Team'
      )
      canonical.setAttribute('href', CANONICAL_URL)

      setMetaProperty('og:url', CANONICAL_URL)
      setMetaProperty('og:title', 'IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM')
      setMetaProperty(
        'og:description',
        'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.'
      )
      setMetaProperty('og:image', OG_IMAGE_URL)

      setMetaName('twitter:title', 'IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM')
      setMetaName(
        'twitter:description',
        'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.'
      )
      setMetaName('twitter:image', OG_IMAGE_URL)

      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: 'SMRIKAAM TALENTO',
            legalName: 'SMRIKAAM',
            url: SITE_URL,
            logo: {
              '@type': 'ImageObject',
              '@id': `${SITE_URL}/#logo`,
              url: `${SITE_URL}/images/staffing/emblem.png`,
              caption: 'SMRIKAAM TALENTO'
            },
            image: OG_IMAGE_URL,
            email: 'contact@smrikaam.com',
            telephone: '+91-9150684601',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'No. 19, Nataraj Nagar, Koundampalayam',
              addressLocality: 'Coimbatore',
              addressRegion: 'Tamil Nadu',
              postalCode: '641030',
              addressCountry: 'IN'
            },
            sameAs: ['https://www.linkedin.com/company/smrikaam']
          },
          {
            '@type': ['LocalBusiness', 'ProfessionalService'],
            '@id': `${SITE_URL}/#localbusiness`,
            name: 'SMRIKAAM TALENTO - IT Staffing & Recruitment Services',
            parentOrganization: {
              '@id': `${SITE_URL}/#organization`
            },
            url: CANONICAL_URL,
            telephone: '+91-9150684601',
            email: 'contact@smrikaam.com',
            priceRange: '$$',
            image: OG_IMAGE_URL,
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'No. 19, Nataraj Nagar, Koundampalayam',
              addressLocality: 'Coimbatore',
              addressRegion: 'Tamil Nadu',
              postalCode: '641030',
              addressCountry: 'IN'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 11.0425,
              longitude: 76.9405
            },
            areaServed: [
              { '@type': 'City', name: 'Coimbatore' },
              { '@type': 'State', name: 'Tamil Nadu' },
              { '@type': 'Country', name: 'India' },
              { '@type': 'AdministrativeArea', name: 'Global' }
            ],
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '09:00',
                closes: '18:00'
              }
            ]
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: 'SMRIKAAM',
            publisher: {
              '@id': `${SITE_URL}/#organization`
            },
            inLanguage: 'en-IN'
          },
          {
            '@type': 'WebPage',
            '@id': `${CANONICAL_URL}#webpage`,
            url: CANONICAL_URL,
            name: 'IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM',
            description:
              'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.',
            isPartOf: {
              '@id': `${SITE_URL}/#website`
            },
            about: {
              '@id': `${SITE_URL}/#localbusiness`
            },
            inLanguage: 'en-IN',
            breadcrumb: {
              '@id': `${CANONICAL_URL}#breadcrumb`
            }
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${CANONICAL_URL}#breadcrumb`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'IT Staffing Services in Coimbatore',
                item: CANONICAL_URL
              }
            ]
          },
          {
            '@type': 'FAQPage',
            '@id': `${CANONICAL_URL}#faq`,
            isPartOf: {
              '@id': `${CANONICAL_URL}#webpage`
            },
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How fast can you shortlist candidates?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We can usually share an initial shortlist quickly. The exact time depends on the role, the skills needed, the seniority level and the type of engagement. Urgent roles receive a faster search process. In most cases, we share pre-screened profiles within 48 to 72 hours.'
                }
              },
              {
                '@type': 'Question',
                name: 'Do you handle payroll and compliance for staff?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. For eligible staff, we can manage payroll, legal compliance, onboarding, documents and ongoing coordination.'
                }
              },
              {
                '@type': 'Question',
                name: 'What technology areas do you specialize in?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We hire for software engineering, AI and machine learning, data engineering, cloud and DevOps, cybersecurity, IoT, enterprise applications and analytics. We also cover other specialized technology fields.'
                }
              },
              {
                '@type': 'Question',
                name: 'Can you build a dedicated offshore team for us?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. We can build a dedicated engineering team that matches your technology, delivery style and business goals. We can also help you scale and manage the team as you grow.'
                }
              },
              {
                '@type': 'Question',
                name: 'Do you offer a replacement guarantee?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'It depends on the type of engagement and your agreement with us. Where applicable, we can provide a replacement if a candidate leaves or cannot continue during the agreed period.'
                }
              },
              {
                '@type': 'Question',
                name: 'Which locations do you serve?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We serve clients across India and in international markets. This depends on the role, the engagement model and the client\'s needs.'
                }
              }
            ]
          }
        ]
      })
    } else {
      const pageTitles: Record<string, string> = {
        '/staffing-models': 'Staffing Models | IT Staffing Services in Coimbatore | SMRIKAAM TALENTO',
        '/models': 'Staffing Models | IT Staffing Services in Coimbatore | SMRIKAAM TALENTO',
        '/permanent-placement': 'Permanent Placement Services | IT Staffing in Coimbatore | SMRIKAAM TALENTO',
        '/executive-search': 'Executive Search Services | CXO & Leadership Hiring | SMRIKAAM TALENTO',
        '/practice-areas': 'Technical Practice Areas & Talent Ecosystem | SMRIKAAM TALENTO',
        '/offshore-teams': 'Dedicated Offshore Engineering Teams | SMRIKAAM TALENTO',
        '/payroll': 'Payroll & Compliance Support | SMRIKAAM TALENTO',
        '/payroll-compliance': 'Payroll & Compliance Support | SMRIKAAM TALENTO',
        '/locations': 'Where We Work - Delivery Footprint | SMRIKAAM TALENTO Coimbatore',
        '/where-we-work': 'Where We Work - Delivery Footprint | SMRIKAAM TALENTO Coimbatore',
        '/faq': 'Frequently Asked Questions | SMRIKAAM TALENTO',
        '/contact': 'Contact Talent Acquisition Desk | SMRIKAAM TALENTO',
        '/request-shortlist': 'Request Talent Shortlist | SMRIKAAM TALENTO'
      }

      const title = pageTitles[pathname] || `SMRIKAAM TALENTO | ${pathname.replace('/', '').replace(/-/g, ' ').toUpperCase()}`
      document.title = title
      const pageCanonical = `${SITE_URL}${pathname}`
      canonical.setAttribute('href', pageCanonical)
      setMetaProperty('og:url', pageCanonical)
      setMetaProperty('og:title', title)
      setMetaName('twitter:title', title)
    }
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
        >
          <Emblem />
          <div className="talento-brand-text">
            <span className="talento-brand-name">SMRIKAAM TALENTO</span>
            <span className="talento-brand-sub">STAFFING &amp; RECRUITMENT SOLUTIONS</span>
          </div>
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
            onClick={handleShortlist}
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
          <span>SMRIKAAM TALENTO NAVIGATION</span>
          <button type="button" onClick={() => setMobileMenuOpen(false)}>✕</button>
        </div>
        <div className="talento-drawer-links">
          <a href="#hero" className={currentActive === 'hero' ? 'active' : ''} onClick={(e) => handleLink(e, 'hero')}>01 HOME</a>
          <a href="#staffing-models" className={currentActive === 'staffing-models' ? 'active' : ''} onClick={(e) => handleLink(e, 'staffing-models')}>02 OUR MODELS</a>
          <a href="#permanent-placement" className={currentActive === 'permanent-placement' ? 'active' : ''} onClick={(e) => handleLink(e, 'permanent-placement')}>03 PERMANENT PLACEMENT</a>
          <a href="#executive-search" className={currentActive === 'executive-search' ? 'active' : ''} onClick={(e) => handleLink(e, 'executive-search')}>04 EXECUTIVE SEARCH</a>
          <a href="#practice-areas" className={currentActive === 'practice-areas' ? 'active' : ''} onClick={(e) => handleLink(e, 'practice-areas')}>05 PRACTICE AREAS</a>
          <a href="#offshore-teams" className={currentActive === 'offshore-teams' ? 'active' : ''} onClick={(e) => handleLink(e, 'offshore-teams')}>06 OFFSHORE TEAMS</a>
          <a href="#payroll" className={currentActive === 'payroll' ? 'active' : ''} onClick={(e) => handleLink(e, 'payroll')}>07 PAYROLL &amp; COMPLIANCE</a>
          <a href="#locations" className={currentActive === 'locations' ? 'active' : ''} onClick={(e) => handleLink(e, 'locations')}>08 WHERE WE WORK</a>
          <a href="#faq" className={currentActive === 'faq' ? 'active' : ''} onClick={(e) => handleLink(e, 'faq')}>09 FAQS</a>
          <a href="#contact" className={currentActive === 'contact' ? 'active' : ''} onClick={(e) => handleLink(e, 'final-cta')}>10 CONTACT US</a>
        </div>
        <button
          type="button"
          className="talento-btn talento-btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
          onClick={handleShortlist}
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
          <h4>SMRIKAAM TALENTO</h4>
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
            <li><a href="mailto:contact@smrikaam.com">contact@smrikaam.com</a></li>
            <li><a href="tel:+919150684601">+91 9150684601</a></li>
            <li><a href="#locations" onClick={(e) => handleLink(e, 'locations')}>India &amp; Global Delivery</a></li>
            <li><a href="#contact" onClick={(e) => handleLink(e, 'contact')}>Request Candidate Profiles</a></li>
          </ul>
        </div>
      </div>

      <div className="talento-footer-bottom">
        <span>© 2026 SMRIKAAM TALENTO. All rights reserved. Staffing &amp; Recruitment Solutions.</span>
        <span>PROGRESS THROUGH INNOVATION</span>
      </div>
    </footer>
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
        <div className="talento-eyebrow">
          <span className="talento-eyebrow-line"></span>
          <span>SMRIKAAM STAFFING SERVICES</span>
        </div>
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
            SMRIKAAM is one of India's leading recruitment companies, based in Coimbatore. We help companies hire faster through <strong>permanent placement and executive search services</strong>. Our expertise covers <strong>AI, Data, Cloud, DevOps, IIoT and enterprise transformation.</strong>
          </p>
        </div>
        <div className="talento-hero-actions">
          <button
            type="button"
            className="talento-btn talento-btn-primary"
            onClick={onOpenShortlist}
          >
            REQUEST TALENT SHORTLIST
            <span className="talento-arrow">↗</span>
          </button>
          <Link
            to="/contact"
            className="talento-btn talento-btn-secondary"
          >
            TALK TO OUR TEAM
            <span className="talento-arrow">→</span>
          </Link>
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
              <source srcSet="/images/staffing/hero-interview.webp" type="image/webp" />
              <img
                src="/images/staffing/hero-interview.jpg"
                alt="SMRIKAAM Talent Solutions recruitment leadership interviewing specialized technical candidates in contemporary boardroom"
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
            <button type="button" className="talento-btn talento-btn-primary" onClick={onOpenShortlist}>
              REQUEST TALENT SHORTLIST <span className="talento-arrow">↗</span>
            </button>
            <Link to="/contact" className="talento-btn talento-btn-secondary">
              TALK TO OUR TEAM <span className="talento-arrow">→</span>
            </Link>
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
          {isDedicatedPage ? (
            <h1 className="talento-model-name">EXECUTIVE<br />SEARCH</h1>
          ) : (
            <h3 className="talento-model-name">EXECUTIVE<br />SEARCH</h3>
          )}
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
            <button type="button" className="talento-btn talento-btn-primary" onClick={onOpenShortlist}>
              REQUEST EXECUTIVE SEARCH <span className="talento-arrow">↗</span>
            </button>
            <Link to="/contact" className="talento-btn talento-btn-secondary">
              SCHEDULE CONFIDENTIAL CALL <span className="talento-arrow">→</span>
            </Link>
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
        <h2 className="talento-section-title">OUR STAFFING MODELS</h2>
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
              SMRIKAAM also provides recruitment services across non-technology fields, based on individual client requirements.
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
              SMRIKAAM can also handle workforce administration and related paperwork. This can include:
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
          <div className="talento-location-tags">
            <span className="talento-tag talento-tag-hub"><span className="talento-radar-dot" aria-hidden="true"></span>COIMBATORE (TALENT HUB)</span>
          </div>
        </div>
        <div className="talento-work-visual-wrap">
          <picture>
            <source srcSet="/images/staffing/where-we-work.webp" type="image/webp" />
            <img
              src="/images/staffing/where-we-work.jpg"
              alt="Modern technology office campus in Coimbatore representing SMRIKAAM TALENTO recruitment and staffing network"
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
            {/* FAQ 1 */}
            <div className={`talento-faq-item ${activeFaq === 0 ? 'active' : ''}`}>
              <button
                type="button"
                className="talento-faq-trigger"
                onClick={() => toggleFaq(0)}
                aria-expanded={activeFaq === 0}
                aria-controls="faq-p-0"
                id="faq-h-0"
              >
                <span className="talento-faq-q">How fast can you shortlist candidates?</span>
                <span className="talento-faq-toggle" aria-hidden="true">
                  {activeFaq === 0 ? '−' : '+'}
                </span>
              </button>
              <div
                id="faq-p-0"
                role="region"
                aria-labelledby="faq-h-0"
                className="talento-faq-panel"
                style={{ display: activeFaq === 0 ? 'block' : 'none' }}
              >
                <p className="talento-faq-answer">
                  We can usually share an initial shortlist quickly. The exact time depends on the role, the skills needed, the seniority level and the type of engagement. Urgent roles receive a faster search process. In most cases, we share pre-screened profiles within 48 to 72 hours.
                </p>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className={`talento-faq-item ${activeFaq === 1 ? 'active' : ''}`}>
              <button
                type="button"
                className="talento-faq-trigger"
                onClick={() => toggleFaq(1)}
                aria-expanded={activeFaq === 1}
                aria-controls="faq-p-1"
                id="faq-h-1"
              >
                <span className="talento-faq-q">Do you handle payroll and compliance for staff?</span>
                <span className="talento-faq-toggle" aria-hidden="true">
                  {activeFaq === 1 ? '−' : '+'}
                </span>
              </button>
              <div
                id="faq-p-1"
                role="region"
                aria-labelledby="faq-h-1"
                className="talento-faq-panel"
                style={{ display: activeFaq === 1 ? 'block' : 'none' }}
              >
                <p className="talento-faq-answer">
                  Yes. For eligible staff, we can manage payroll, legal compliance, onboarding, documents and ongoing coordination.
                </p>
              </div>
            </div>

            {/* FAQ 3 */}
            <div className={`talento-faq-item ${activeFaq === 2 ? 'active' : ''}`}>
              <button
                type="button"
                className="talento-faq-trigger"
                onClick={() => toggleFaq(2)}
                aria-expanded={activeFaq === 2}
                aria-controls="faq-p-2"
                id="faq-h-2"
              >
                <span className="talento-faq-q">What technology areas do you specialize in?</span>
                <span className="talento-faq-toggle" aria-hidden="true">
                  {activeFaq === 2 ? '−' : '+'}
                </span>
              </button>
              <div
                id="faq-p-2"
                role="region"
                aria-labelledby="faq-h-2"
                className="talento-faq-panel"
                style={{ display: activeFaq === 2 ? 'block' : 'none' }}
              >
                <p className="talento-faq-answer">
                  We hire for software engineering, AI and machine learning, data engineering, cloud and DevOps, cybersecurity, IoT, enterprise applications and analytics. We also cover other specialized technology fields.
                </p>
              </div>
            </div>

            {/* FAQ 4 */}
            <div className={`talento-faq-item ${activeFaq === 3 ? 'active' : ''}`}>
              <button
                type="button"
                className="talento-faq-trigger"
                onClick={() => toggleFaq(3)}
                aria-expanded={activeFaq === 3}
                aria-controls="faq-p-3"
                id="faq-h-3"
              >
                <span className="talento-faq-q">Can you build a dedicated offshore team for us?</span>
                <span className="talento-faq-toggle" aria-hidden="true">
                  {activeFaq === 3 ? '−' : '+'}
                </span>
              </button>
              <div
                id="faq-p-3"
                role="region"
                aria-labelledby="faq-h-3"
                className="talento-faq-panel"
                style={{ display: activeFaq === 3 ? 'block' : 'none' }}
              >
                <p className="talento-faq-answer">
                  Yes. We can build a dedicated engineering team that matches your technology, delivery style and business goals. We can also help you scale and manage the team as you grow.
                </p>
              </div>
            </div>

            {/* FAQ 5 */}
            <div className={`talento-faq-item ${activeFaq === 4 ? 'active' : ''}`}>
              <button
                type="button"
                className="talento-faq-trigger"
                onClick={() => toggleFaq(4)}
                aria-expanded={activeFaq === 4}
                aria-controls="faq-p-4"
                id="faq-h-4"
              >
                <span className="talento-faq-q">Do you offer a replacement guarantee?</span>
                <span className="talento-faq-toggle" aria-hidden="true">
                  {activeFaq === 4 ? '−' : '+'}
                </span>
              </button>
              <div
                id="faq-p-4"
                role="region"
                aria-labelledby="faq-h-4"
                className="talento-faq-panel"
                style={{ display: activeFaq === 4 ? 'block' : 'none' }}
              >
                <p className="talento-faq-answer">
                  It depends on the type of engagement and your agreement with us. Where applicable, we can provide a replacement if a candidate leaves or cannot continue during the agreed period.
                </p>
              </div>
            </div>

            {/* FAQ 6 */}
            <div className={`talento-faq-item ${activeFaq === 5 ? 'active' : ''}`}>
              <button
                type="button"
                className="talento-faq-trigger"
                onClick={() => toggleFaq(5)}
                aria-expanded={activeFaq === 5}
                aria-controls="faq-p-5"
                id="faq-h-5"
              >
                <span className="talento-faq-q">Which locations do you serve?</span>
                <span className="talento-faq-toggle" aria-hidden="true">
                  {activeFaq === 5 ? '−' : '+'}
                </span>
              </button>
              <div
                id="faq-p-5"
                role="region"
                aria-labelledby="faq-h-5"
                className="talento-faq-panel"
                style={{ display: activeFaq === 5 ? 'block' : 'none' }}
              >
                <p className="talento-faq-answer">
                  We serve clients across India and in international markets. This depends on the role, the engagement model and the client's needs.
                </p>
              </div>
            </div>
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
            onClick={onOpenShortlist}
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
              <b>contact@smrikaam.com</b>
            </div>
            <div className="talento-contact-item">
              <span>PHONE / WHATSAPP</span>
              <b>+91-9150684601</b>
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
            <span className="talento-modal-eyebrow">SMRIKAAM TALENTO TALENT SOLUTIONS</span>
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

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormStatus('submitting')
    setFormMessage('')

    if (!formState.fullName || !formState.companyName || !formState.email || !formState.phone) {
      setFormStatus('error')
      setFormMessage('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formState.email)) {
      setFormStatus('error')
      setFormMessage('Please enter a valid official business email address.')
      return
    }

    setTimeout(() => {
      setFormStatus('success')
      setFormMessage(
        'Thank you! Your hiring requirement has been recorded. Our talent solutions team in Coimbatore will review your specifications and share pre-screened candidate profiles within 48 to 72 hours.'
      )
      setFormState(initialFormState)
    }, 700)
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
