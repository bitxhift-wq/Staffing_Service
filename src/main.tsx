import React, { useState, useEffect, FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

interface ShortlistFormState {
  fullName: string
  companyName: string
  email: string
  phone: string
  hiringModel: string
  requiredSkills: string
  positions: string
  details: string
}

const initialFormState: ShortlistFormState = {
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  hiringModel: 'Permanent Placement',
  requiredSkills: '',
  positions: '1-2',
  details: ''
}

function Emblem() {
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

function App() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formState, setFormState] = useState<ShortlistFormState>(initialFormState)
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formMessage, setFormMessage] = useState('')

  // Configure SEO metadata directly in HTML head, preserving all source metadata
  useEffect(() => {
    // 1. SEO Title
    document.title = 'IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM'

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      'content',
      'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.'
    )

    // 3. Focus Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute(
      'content',
      'IT staffing services in Coimbatore, technical staffing, AI and data staffing, IIoT staffing, permanent placement, dedicated offshore team'
    )

    // 4. Suggested URL / Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', 'https://smrikaam.com/services/staffing-services')

    // Structured JSON-LD Schema
    const scriptId = 'smrikaam-talento-schema'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      'name': 'SMRIKAAM TALENTO - Staffing & Recruitment Solutions',
      'url': 'https://smrikaam.com/services/staffing-services',
      'description': 'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'No. 19, Nataraj Nagar, Koundampalayam',
        'addressLocality': 'Coimbatore',
        'addressRegion': 'Tamil Nadu',
        'postalCode': '641030',
        'addressCountry': 'IN'
      },
      'telephone': '+91-9150684601',
      'email': 'contact@smrikaam.com'
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ====================================================================
          STANDALONE RECRUITMENT HEADER
          ==================================================================== */}
      <header className="talento-header">
        <a href="#hero" className="talento-brand" onClick={(e) => { e.preventDefault(); scrollToSection('hero') }}>
          <Emblem />
          <div className="talento-brand-text">
            <span className="talento-brand-name">SMRIKAAM TALENTO</span>
            <span className="talento-brand-sub">STAFFING &amp; RECRUITMENT SOLUTIONS</span>
          </div>
        </a>

        <nav className="talento-nav" aria-label="Main Navigation">
          <a href="#models" onClick={(e) => { e.preventDefault(); scrollToSection('models') }}>STAFFING MODELS</a>
          <a href="#permanent-placement" onClick={(e) => { e.preventDefault(); scrollToSection('permanent-placement') }}>PERMANENT PLACEMENT</a>
          <a href="#executive-search" onClick={(e) => { e.preventDefault(); scrollToSection('executive-search') }}>EXECUTIVE SEARCH</a>
          <a href="#practice-areas" onClick={(e) => { e.preventDefault(); scrollToSection('practice-areas') }}>PRACTICE AREAS</a>
          <a href="#offshore-teams" onClick={(e) => { e.preventDefault(); scrollToSection('offshore-teams') }}>OFFSHORE TEAMS</a>
          <a href="#payroll-compliance" onClick={(e) => { e.preventDefault(); scrollToSection('payroll-compliance') }}>PAYROLL</a>
          <a href="#where-we-work" onClick={(e) => { e.preventDefault(); scrollToSection('where-we-work') }}>LOCATIONS</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq') }}>FAQ</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>CONTACT</a>
        </nav>

        <div className="talento-header-actions">
          <button
            type="button"
            className="talento-btn-nav"
            onClick={() => setModalOpen(true)}
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
          <a href="#hero" onClick={() => scrollToSection('hero')}>01 HOME</a>
          <a href="#models" onClick={() => scrollToSection('models')}>02 OUR MODELS</a>
          <a href="#permanent-placement" onClick={() => scrollToSection('permanent-placement')}>03 PERMANENT PLACEMENT</a>
          <a href="#executive-search" onClick={() => scrollToSection('executive-search')}>04 EXECUTIVE SEARCH</a>
          <a href="#practice-areas" onClick={() => scrollToSection('practice-areas')}>05 PRACTICE AREAS</a>
          <a href="#offshore-teams" onClick={() => scrollToSection('offshore-teams')}>06 OFFSHORE TEAMS</a>
          <a href="#payroll-compliance" onClick={() => scrollToSection('payroll-compliance')}>07 PAYROLL &amp; COMPLIANCE</a>
          <a href="#where-we-work" onClick={() => scrollToSection('where-we-work')}>08 WHERE WE WORK</a>
          <a href="#faq" onClick={() => scrollToSection('faq')}>09 FAQS</a>
          <a href="#contact" onClick={() => scrollToSection('contact')}>10 CONTACT US</a>
        </div>
        <button
          type="button"
          className="talento-btn talento-btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
          onClick={() => { setMobileMenuOpen(false); setModalOpen(true); }}
        >
          REQUEST TALENT SHORTLIST ↗
        </button>
      </div>

      <main className="talento-main">
        {/* ====================================================================
            1. HOME / HERO SECTION (BALANCED 56% / 44% SPLIT)
            ==================================================================== */}
        <section id="hero" className="talento-hero">
          <div className="talento-hero-left">
            <div className="talento-eyebrow">
              <span className="talento-eyebrow-line"></span>
              <span>SMRIKAAM STAFFING SERVICES</span>
            </div>
            <h1 className="talento-hero-title">
              TECHNICAL TALENT.<br />
              BUILT FOR SPEED.
            </h1>
            <h2 className="talento-hero-subtitle">
              IT and Specialized Staffing Services in Coimbatore, India.
            </h2>
            <div className="talento-hero-desc">
              <p>
                Hiring the right tech people takes time. Good engineers are hard to find, and a slow search can delay your whole project.
              </p>
              <p>
                SMRIKAAM is one of the India's leading recruitment companies located in Coimbatore. SMRIKAAM helps companies hire fast. We offer permanent placement and executive search. We cover AI, Data, Cloud, DevOps, IIoT and enterprise transformation.
              </p>
            </div>
            <div className="talento-hero-actions">
              <button
                type="button"
                className="talento-btn talento-btn-primary"
                onClick={() => setModalOpen(true)}
              >
                REQUEST TALENT SHORTLIST
                <span className="talento-arrow">↗</span>
              </button>
              <a
                href="#contact"
                className="talento-btn talento-btn-secondary"
                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
              >
                TALK TO OUR TEAM
                <span className="talento-arrow">→</span>
              </a>
            </div>
          </div>

          <div className="talento-hero-right">
            <div className="talento-hero-img-wrap">
              <picture>
                <source srcSet="/images/staffing/hero-team.webp" type="image/webp" />
                <img
                  src="/images/staffing/hero-team.jpg"
                  alt="Modern Indian recruitment consultants and technology team collaborating in contemporary corporate office"
                  className="talento-hero-img"
                  width="1800"
                  height="1201"
                  loading="eager"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* ====================================================================
            2. ABOUT STAFFING SERVICES / THE SPEED ADVANTAGE (EDITORIAL)
            ==================================================================== */}
        <section className="talento-advantage-strip" aria-label="Why Partner With SMRIKAAM Talento">
          <div className="talento-advantage-header">
            <span className="talento-eyebrow">THE RECRUITMENT ADVANTAGE</span>
            <h3>PRECISION MATCHING. ZERO DRAG. PROVEN HIRING OUTCOMES.</h3>
          </div>
          <div className="talento-advantage-grid">
            <div className="talento-advantage-card">
              <span className="talento-adv-index">01 / TECHNICAL EXPERTISE</span>
              <h4>Domain-Expert Technical Vetting</h4>
              <p>
                Every candidate profile is evaluated by practicing software engineers and technical leads who understand systems architecture, modern cloud workflows, and data pipelines.
              </p>
            </div>
            <div className="talento-advantage-card">
              <span className="talento-adv-index">02 / RAPID EXECUTION</span>
              <h4>48 to 72-Hour Candidate Shortlist</h4>
              <p>
                Our targeted search framework maps active and passive technical talent across Coimbatore, Tamil Nadu, and pan-India hubs to supply verified profiles without project delay.
              </p>
            </div>
            <div className="talento-advantage-card">
              <span className="talento-adv-index">03 / RETENTION FOCUS</span>
              <h4>Contractual Replacement Assurance</h4>
              <p>
                Comprehensive culture-fit checks and verified background assessments ensure candidates stay and grow. Every permanent placement includes replacement assurance.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================================
            3, 4, 5. OUR STAFFING MODELS
            ==================================================================== */}
        <section id="models" className="talento-models-section">
          <div className="talento-models-header">
            <h2 className="talento-section-title">OUR STAFFING MODELS</h2>
            <span className="talento-title-divider"></span>
            <p className="talento-header-intro">
              Every company has different needs. Pick the model that fits yours.
            </p>
          </div>

          {/* 4. PERMANENT PLACEMENT */}
          <div id="permanent-placement" className="talento-model-block talento-model-block-perm">
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
                Hire senior engineers, data scientists, architects and product specialists who stay and grow with you. Our technical and behavioral screening checks fit with your tech stack and culture.
              </p>

              <ul className="talento-checklist">
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Best for:</strong> Replacing key roles, growing your team, building new functions</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Our process:</strong> Role briefing → Talent search → Screening → Shortlist → Interview support → Offer</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Replacement assurance:</strong> Available within the agreed tenure period</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Technical screening:</strong> Done by engineers who know the domain</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Culture-fit check:</strong> Skills get people hired; values make them stay</div>
                </li>
              </ul>
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

          {/* 5. EXECUTIVE SEARCH */}
          <div id="executive-search" className="talento-model-block talento-model-block-exec">
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
                Confidential hiring for CXO, VP and Director-level tech leaders.
              </p>
              <p className="talento-model-desc">
                Hiring a CTO, Head of Data, VP Engineering or transformation leader? We run a discreet search across India and key global markets, using domain mapping and reference checks.
              </p>

              <ul className="talento-checklist">
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Best for:</strong> C-suite, leadership teams, general management, senior specialist roles</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Approach:</strong> Targeted search of active and passive candidates</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Assessment:</strong> Leadership competency review and culture-fit profiling</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Vetting:</strong> Background, credentials and executive reference checks</div>
                </li>
                <li>
                  <span className="talento-check">✓</span>
                  <div><strong>Retention focus:</strong> Matched to your long-term vision</div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ====================================================================
            6. TECHNOLOGY AREAS WE HIRE FOR (TALENT ECOSYSTEM)
            ==================================================================== */}
        <section id="practice-areas" className="talento-tech-section">
          <div className="talento-tech-header-wrap">
            <span className="talento-eyebrow">SPECIALIZED ENGINEERING TALENT</span>
            <h2 className="talento-tech-title">TECHNOLOGY AREAS WE HIRE FOR</h2>
            <p className="talento-tech-sub">
              Our recruitment practice covers the entire enterprise intelligence and modern software engineering spectrum with proven placement depth.
            </p>
          </div>

          <div className="talento-tech-grid">
            {/* 1. Software Engineering */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                </div>
                <span className="talento-tech-card-num">01</span>
              </div>
              <h3 className="talento-tech-card-title">Software Engineering</h3>
              <p className="talento-tech-card-desc">
                Full-stack engineers, backend system architects, microservices specialists, distributed systems developers, and mobile platform engineers.
              </p>
            </div>

            {/* 2. AI and Machine Learning */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
                    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"></path>
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                    <circle cx="5" cy="12" r="1.5"></circle>
                    <circle cx="19" cy="12" r="1.5"></circle>
                  </svg>
                </div>
                <span className="talento-tech-card-num">02</span>
              </div>
              <h3 className="talento-tech-card-title">AI and Machine Learning</h3>
              <p className="talento-tech-card-desc">
                Generative AI specialists, LLM fine-tuning architects, computer vision engineers, NLP researchers, and MLOps deployment practitioners.
              </p>
            </div>

            {/* 3. Data Engineering and Analytics */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                </div>
                <span className="talento-tech-card-num">03</span>
              </div>
              <h3 className="talento-tech-card-title">Data Engineering and Analytics</h3>
              <p className="talento-tech-card-desc">
                Lakehouse architects, real-time streaming pipeline engineers (Spark, Kafka), Snowflake/Databricks experts, and analytics dashboard leaders.
              </p>
            </div>

            {/* 4. Cloud and DevOps */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                  </svg>
                </div>
                <span className="talento-tech-card-num">04</span>
              </div>
              <h3 className="talento-tech-card-title">Cloud and DevOps</h3>
              <p className="talento-tech-card-desc">
                Kubernetes administrators, Terraform infrastructure-as-code architects, AWS and Azure platform engineers, and CI/CD automation specialists.
              </p>
            </div>

            {/* 5. Cybersecurity */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </div>
                <span className="talento-tech-card-num">05</span>
              </div>
              <h3 className="talento-tech-card-title">Cybersecurity</h3>
              <p className="talento-tech-card-desc">
                Information security managers, cloud security posture engineers, penetration testers, SOC analysts, and IAM compliance architects.
              </p>
            </div>

            {/* 6. IoT and Industrial IoT (IIoT) */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <circle cx="12" cy="14" r="2"></circle>
                  </svg>
                </div>
                <span className="talento-tech-card-num">06</span>
              </div>
              <h3 className="talento-tech-card-title">IoT and Industrial IoT (IIoT)</h3>
              <p className="talento-tech-card-desc">
                Edge computing developers, sensor integration specialists, SCADA/PLC interface engineers, MQTT firmware architects, and factory connectivity leads.
              </p>
            </div>

            {/* 7. Enterprise Applications */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </div>
                <span className="talento-tech-card-num">07</span>
              </div>
              <h3 className="talento-tech-card-title">Enterprise Applications</h3>
              <p className="talento-tech-card-desc">
                SAP S/4HANA implementation consultants, Salesforce platform architects, ServiceNow workflow leads, and Workday enterprise integrators.
              </p>
            </div>

            {/* 8. Other Specialized Technology Fields */}
            <div className="talento-tech-card">
              <div className="talento-tech-card-top">
                <div className="talento-tech-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </div>
                <span className="talento-tech-card-num">08</span>
              </div>
              <h3 className="talento-tech-card-title">Other Specialized Technology Fields</h3>
              <p className="talento-tech-card-desc">
                Embedded C/C++ automotive systems, high-frequency trading platforms, bioinformatics, robotics, and custom domain hardware-software integration.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================================
            7. NON-TECHNOLOGY AREAS WE HIRE FOR
            ==================================================================== */}
        <section className="talento-nontech-strip" aria-label="Non-Technology Recruitment Support">
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
                SMRIKAAM also covers and recruits for most of the non-technology fields per clients' requirements.
              </p>
            </div>
            <span className="talento-nontech-badge">BROAD-SPECTRUM PLACEMENT</span>
          </div>
        </section>

        {/* ====================================================================
            8 & 9. DEDICATED OFFSHORE TEAM & PAYROLL COMPLIANCE
            ==================================================================== */}
        <section className="talento-dual-section">
          <div className="talento-dual-grid">
            {/* 8. Dedicated Offshore Team */}
            <div id="offshore-teams" className="talento-card-half">
              <div className="talento-half-img-wrap">
                <picture>
                  <source srcSet="/images/staffing/offshore-team.webp" type="image/webp" />
                  <img
                    src="/images/staffing/offshore-team.jpg"
                    alt="SMRIKAAM dedicated offshore engineering team collaborating in high-tech development office"
                    className="talento-half-img"
                    width="1600"
                    height="1067"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <div className="talento-half-content">
                <span className="talento-eyebrow">DEDICATED CAPACITY</span>
                <h3 className="talento-half-title">
                  BUILD A DEDICATED<br />
                  OFFSHORE TEAM
                </h3>
                <p className="talento-half-desc">
                  Want a team that works only for you? We can set up a dedicated engineering team that fits your technology, your way of working and your business goals. We also help you grow and manage the team over time.
                </p>
              </div>
            </div>

            {/* 9. Payroll and Compliance Support */}
            <div id="payroll-compliance" className="talento-card-half">
              <div className="talento-half-img-wrap">
                <picture>
                  <source srcSet="/images/staffing/payroll-compliance.webp" type="image/webp" />
                  <img
                    src="/images/staffing/payroll-compliance.jpg"
                    alt="HR operations specialist reviewing payroll documentation, statutory records and contracts"
                    className="talento-half-img"
                    width="1600"
                    height="2400"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <div className="talento-half-content">
                <span className="talento-eyebrow">WORKFORCE ADMINISTRATION</span>
                <h3 className="talento-half-title">
                  PAYROLL AND<br />
                  COMPLIANCE SUPPORT
                </h3>
                <p className="talento-payroll-sub">
                  SMRIKAAM can handle the paperwork too. This can include:
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

        {/* ====================================================================
            10. WHERE WE WORK
            ==================================================================== */}
        <section id="where-we-work" className="talento-work-section" aria-label="Geographical Coverage">
          <div className="talento-work-grid">
            <div className="talento-work-info">
              <span className="talento-eyebrow">DELIVERY FOOTPRINT</span>
              <h2 className="talento-section-title">WHERE WE WORK</h2>
              <p className="talento-work-text">
                We serve clients across India and in international markets. This depends on the role, the engagement model and the client's needs.
              </p>
              <div className="talento-location-tags">
                <span className="talento-tag talento-tag-hub">COIMBATORE (TALENT HUB)</span>
                <span className="talento-tag">BANGALORE</span>
                <span className="talento-tag">CHENNAI</span>
                <span className="talento-tag">HYDERABAD</span>
                <span className="talento-tag">MUMBAI</span>
                <span className="talento-tag">PUNE</span>
                <span className="talento-tag">DELHI NCR</span>
                <span className="talento-tag">GLOBAL CROSS-BORDER MARKETS</span>
              </div>
            </div>
            <div className="talento-work-visual-wrap">
              <picture>
                <source srcSet="/images/staffing/where-we-work.webp" type="image/webp" />
                <img
                  src="/images/staffing/where-we-work.jpg"
                  alt="Modern international corporate towers representing SMRIKAAM Talento global recruitment reach"
                  className="talento-work-visual-img"
                  width="1600"
                  height="1067"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* ====================================================================
            11. FREQUENTLY ASKED QUESTIONS
            ==================================================================== */}
        <section id="faq" className="talento-faq-section" aria-label="Frequently Asked Questions">
          <div className="talento-faq-grid">
            <div className="talento-faq-left">
              <span className="talento-faq-dash"></span>
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
                      We can usually share an initial shortlist quickly. The exact time depends on the role, the skills needed, the seniority level and the type of engagement. Urgent roles get a faster search process. In most cases, we share pre-screened profiles within 48 to 72 hours.
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
                      Yes, for eligible staffing models and engagements. We can take care of payroll, statutory benefits, employment contracts and ongoing HR support, so your remote or on-site team is fully compliant with local labour regulations.
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
                      We specialize in core and emerging technologies including Software Engineering (full stack, mobile, systems), AI and Machine Learning, Data Engineering and Analytics, Cloud Infrastructure and DevOps, Cybersecurity, IoT and Industrial IoT (IIoT), Enterprise Applications (SAP, ERP, Salesforce), and niche specialized technology domains.
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
                      Yes. We set up custom-built, dedicated engineering pods and technology centers that work exclusively for your organization, aligned to your toolchain, communication cadences, security policies, and long-term roadmap.
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
                      Yes. For our permanent placement engagements, we offer a replacement assurance period within an agreed tenure timeframe. If a hired candidate departs or does not meet performance requirements during this period, we provide a replacement shortlist at no additional recruitment cost.
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

        {/* ====================================================================
            12. FINAL CALL TO ACTION & INLINE CONTACT SECTION
            ==================================================================== */}
        <section className="talento-final-cta" aria-label="Ready to Hire Talent CTA">
          <div className="talento-final-wrap">
            <div className="talento-final-left">
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
                onClick={() => setModalOpen(true)}
              >
                REQUEST TALENT SHORTLIST
                <span className="talento-arrow">↗</span>
              </button>
            </div>
          </div>
        </section>

        {/* INLINE CONTACT & SHORTLIST ENQUIRY SECTION */}
        <section id="contact" className="talento-contact-section">
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
              <form onSubmit={handleFormSubmit}>
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
      </main>

      {/* ====================================================================
          STANDALONE RECRUITMENT FOOTER
          ==================================================================== */}
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
              <li><a href="#permanent-placement" onClick={(e) => { e.preventDefault(); scrollToSection('permanent-placement') }}>Permanent Placement</a></li>
              <li><a href="#executive-search" onClick={(e) => { e.preventDefault(); scrollToSection('executive-search') }}>Executive Search</a></li>
              <li><a href="#offshore-teams" onClick={(e) => { e.preventDefault(); scrollToSection('offshore-teams') }}>Dedicated Offshore Teams</a></li>
              <li><a href="#payroll-compliance" onClick={(e) => { e.preventDefault(); scrollToSection('payroll-compliance') }}>Payroll &amp; Compliance</a></li>
            </ul>
          </div>

          <div className="talento-footer-col">
            <h5>PRACTICE AREAS</h5>
            <ul>
              <li><a href="#practice-areas" onClick={(e) => { e.preventDefault(); scrollToSection('practice-areas') }}>Software Engineering</a></li>
              <li><a href="#practice-areas" onClick={(e) => { e.preventDefault(); scrollToSection('practice-areas') }}>AI &amp; Machine Learning</a></li>
              <li><a href="#practice-areas" onClick={(e) => { e.preventDefault(); scrollToSection('practice-areas') }}>Data Engineering &amp; Analytics</a></li>
              <li><a href="#practice-areas" onClick={(e) => { e.preventDefault(); scrollToSection('practice-areas') }}>Cloud &amp; DevOps</a></li>
              <li><a href="#practice-areas" onClick={(e) => { e.preventDefault(); scrollToSection('practice-areas') }}>Cybersecurity &amp; IIoT</a></li>
            </ul>
          </div>

          <div className="talento-footer-col">
            <h5>TALENT DESK</h5>
            <ul>
              <li><a href="mailto:contact@smrikaam.com">contact@smrikaam.com</a></li>
              <li><a href="tel:+919150684601">+91 9150684601</a></li>
              <li><a href="#where-we-work" onClick={(e) => { e.preventDefault(); scrollToSection('where-we-work') }}>India &amp; Global Delivery</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>Request Candidate Profiles</a></li>
            </ul>
          </div>
        </div>

        <div className="talento-footer-bottom">
          <span>© 2026 SMRIKAAM TALENTO. All rights reserved. Staffing &amp; Recruitment Solutions.</span>
          <span>PROGRESS THROUGH INNOVATION</span>
        </div>
      </footer>

      {/* ====================================================================
          POPUP MODAL FOR SHORTLIST REQUEST
          ==================================================================== */}
      {modalOpen && (
        <div className="talento-modal-backdrop" onClick={() => setModalOpen(false)}>
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
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="talento-modal-body">
              <form onSubmit={handleFormSubmit}>
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
                    onClick={() => setModalOpen(false)}
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
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
