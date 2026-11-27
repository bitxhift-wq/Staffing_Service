/**
 * SMRIKAAM WORKFORCE – single source of truth for SEO.
 *
 * This module is pure (no DOM, no import.meta.env) so it can be used by:
 *   - the Vite config (index.html head injection in dev + build),
 *   - the prerender script (via the SSR bundle),
 *   - the client-side SEOManager and FAQ section.
 */
export const BRAND_NAME = 'SMRIKAAM WORKFORCE';
export const BRAND_TAGLINE = 'BRIDGING TALENT AND OPPORTUNITY';
export const PARENT_ORG_NAME = 'SMRIKAAM Technologies';
export const DEFAULT_SITE_URL = 'https://smrikaam.com';
/** Business facts. Only information that is already published on the website. */
export const BUSINESS = {
    email: 'contact@smrikaam.com',
    telephone: '+91-9150684601',
    address: {
        streetAddress: 'No. 19, Nataraj Nagar, Koundampalayam',
        addressLocality: 'Coimbatore',
        addressRegion: 'Tamil Nadu',
        postalCode: '641030',
        addressCountry: 'IN'
    },
    linkedin: 'https://www.linkedin.com/company/smrikaam',
    twitterHandle: '@smrikaam'
};
/** Countries targeted by international search intent (service area only – NOT offices). */
export const SERVICE_AREA_COUNTRIES = [
    'India',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'United Arab Emirates',
    'Singapore'
];
export const OG_IMAGE_PATH = '/assets/Smrikaam_Workforce_OG_1200x630.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT = `${BRAND_NAME} — ${BRAND_TAGLINE}`;
export const SCHEMA_LOGO_PATH = '/assets/Smrikaam_Workforce_Logo_512.png';
export const HOME_META = {
    title: `IT & Non-IT Staffing Services in Coimbatore | ${BRAND_NAME}`,
    description: 'SMRIKAAM WORKFORCE is a recruitment agency in Coimbatore offering IT & non-IT staffing, permanent placement, executive search & offshore teams in 48–72 hours.'
};
/**
 * Legacy section URLs. They are kept so previously shared links keep working
 * (the client scrolls to the matching section), but every one of them declares
 * the home page as its canonical URL and none is listed in the sitemap.
 */
const MODELS_META = {
    title: `Staffing Models | ${BRAND_NAME}`,
    description: 'Flexible IT staffing models: permanent placement, executive search, dedicated offshore engineering teams and payroll and compliance support from India.'
};
const PAYROLL_META = {
    title: `Payroll & Compliance Support | ${BRAND_NAME}`,
    description: 'Payroll, statutory compliance, onboarding and workforce administration for eligible staffing engagements in India and international markets.'
};
const LOCATIONS_META = {
    title: `Where We Work: India & Global | ${BRAND_NAME}`,
    description: 'SMRIKAAM WORKFORCE operates from Coimbatore, India and supports eligible international staffing engagements, including clients in the USA, UK, Canada, Australia, UAE and Singapore.'
};
export const SECTION_ALIAS_META = {
    '/staffing-models': MODELS_META,
    '/models': MODELS_META,
    '/permanent-placement': {
        title: `Permanent Placement Services in India | ${BRAND_NAME}`,
        description: 'End-to-end permanent technology recruitment for senior engineers, data scientists, architects and product specialists, from India for Indian and global employers.'
    },
    '/executive-search': {
        title: `Executive Search & Leadership Hiring | ${BRAND_NAME}`,
        description: 'Confidential executive search for CTO, VP Engineering, Head of Data and other technology leaders across India and key global markets.'
    },
    '/practice-areas': {
        title: `AI, Data, Cloud & IIoT Recruitment | ${BRAND_NAME}`,
        description: 'Technical recruitment across software engineering, AI and machine learning, data engineering, cloud and DevOps, cybersecurity and industrial IoT.'
    },
    '/key-job-functions': {
        title: `Key Job Functions We Support | ${BRAND_NAME}`,
        description: 'Hiring across Engineering & Technical, IT & Digital, Finance & Accounting, Sales & Marketing, HR, Operations, Procurement, Customer Service and Leadership.'
    },
    '/job-functions': {
        title: `Key Job Functions We Support | ${BRAND_NAME}`,
        description: 'Hiring across Engineering & Technical, IT & Digital, Finance & Accounting, Sales & Marketing, HR, Operations, Procurement, Customer Service and Leadership.'
    },
    '/offshore-teams': {
        title: `Dedicated Offshore Engineering Teams | ${BRAND_NAME}`,
        description: 'Build and scale a dedicated offshore engineering team from India that fits your technology, working methods and business goals.'
    },
    '/payroll': PAYROLL_META,
    '/payroll-compliance': PAYROLL_META,
    '/locations': LOCATIONS_META,
    '/where-we-work': LOCATIONS_META,
    '/faq': {
        title: `Staffing & Recruitment FAQs | ${BRAND_NAME}`,
        description: 'Answers about shortlist speed, technology areas, offshore teams, payroll, replacement guarantees and which locations SMRIKAAM WORKFORCE serves.'
    },
    '/contact': {
        title: `Contact ${BRAND_NAME} | Talent Acquisition Desk`,
        description: 'Contact the SMRIKAAM WORKFORCE talent acquisition desk in Coimbatore, India about permanent hiring, executive search and offshore engineering teams.'
    },
    '/request-shortlist': {
        title: `Request a Talent Shortlist | ${BRAND_NAME}`,
        description: 'Share your hiring criteria and receive pre-screened technical candidate profiles, in most cases within 48 to 72 hours.'
    }
};
export function normalizePath(pathname) {
    const p = (pathname || '/').split('#')[0].split('?')[0];
    return p.length > 1 ? p.replace(/\/+$/, '') : '/';
}
export function getPageMeta(pathname) {
    return SECTION_ALIAS_META[normalizePath(pathname)] || HOME_META;
}
/** Every URL of the single-page site canonicalises to the home page. */
export function getCanonicalUrl(siteUrl) {
    return `${siteUrl}/`;
}
export const FAQ_ITEMS = [
    {
        q: 'How fast can you shortlist candidates?',
        a: 'We can usually share an initial shortlist quickly. The exact time depends on the role, the skills needed, the seniority level and the type of engagement. Urgent roles receive a faster search process. In most cases, we share pre-screened profiles within 48 to 72 hours.'
    },
    {
        q: 'Do you handle payroll and compliance for staff?',
        a: 'Yes. For eligible staff, we can manage payroll, legal compliance, onboarding, documents and ongoing coordination.'
    },
    {
        q: 'What technology areas do you specialize in?',
        a: 'We hire for software engineering, AI and machine learning, data engineering, cloud and DevOps, cybersecurity, IoT, enterprise applications and analytics. We also cover other specialized technology fields.'
    },
    {
        q: 'Can you build a dedicated offshore team for us?',
        a: 'Yes. We can build a dedicated engineering team that matches your technology, delivery style and business goals. We can also help you scale and manage the team as you grow.'
    },
    {
        q: 'Do you offer a replacement guarantee?',
        a: 'It depends on the type of engagement and your agreement with us. Where applicable, we can provide a replacement if a candidate leaves or cannot continue during the agreed period.'
    },
    {
        q: 'Which locations do you serve?',
        a: "We serve clients across India and in international markets. This depends on the role, the engagement model and the client's needs."
    },
    {
        q: 'Do you support international clients outside India?',
        a: 'Yes. SMRIKAAM WORKFORCE operates from Coimbatore, India, and supports eligible international staffing engagements such as offshore engineering teams, permanent placement and executive search for companies in markets including the USA, UK, Canada, Australia, the UAE and Singapore. The engagement model depends on the role, the location and your requirements.'
    },
    {
        q: 'Do you provide IT staffing in Coimbatore and across Tamil Nadu?',
        a: 'Yes. We are based in Coimbatore, Tamil Nadu, and recruit technical talent for companies in Coimbatore, across Tamil Nadu and the rest of India, as well as for international clients.'
    },
    {
        q: 'How do I request a talent shortlist?',
        a: 'Use the Request Talent Shortlist button or the enquiry form on this page. Share the role, the skills you need and your preferred hiring model, and our team will get back to you. In most cases we share pre-screened profiles within 48 to 72 hours.'
    }
];
export const SERVICES = [
    {
        id: 'it-specialized-staffing',
        name: 'IT and Specialized Staffing',
        serviceType: 'IT staffing',
        description: 'IT and specialized technology staffing for AI, data, cloud, DevOps, IIoT and enterprise transformation roles.',
        anchor: 'staffing-models'
    },
    {
        id: 'permanent-placement',
        name: 'Permanent Placement',
        serviceType: 'Permanent placement recruitment',
        description: 'End-to-end hiring of full-time senior engineers, data scientists, architects and product specialists, with technical and behavioral screening.',
        anchor: 'permanent-placement'
    },
    {
        id: 'executive-search',
        name: 'Executive Search',
        serviceType: 'Executive search and leadership recruitment',
        description: 'Confidential searches for CTO, VP of Engineering, Head of Data and other CXO, VP and Director-level technology leaders.',
        anchor: 'executive-search'
    },
    {
        id: 'ai-ml-recruitment',
        name: 'AI and Machine Learning Recruitment',
        serviceType: 'AI and machine learning recruitment',
        description: 'Recruitment of AI, machine learning and data science professionals.',
        anchor: 'practice-areas'
    },
    {
        id: 'data-engineering-staffing',
        name: 'Data Engineering and Analytics Staffing',
        serviceType: 'Data engineering and analytics staffing',
        description: 'Staffing of data engineering, data platform and analytics specialists.',
        anchor: 'practice-areas'
    },
    {
        id: 'cloud-devops-staffing',
        name: 'Cloud and DevOps Staffing',
        serviceType: 'Cloud and DevOps recruitment',
        description: 'Recruitment of cloud engineers, DevOps and platform engineering professionals.',
        anchor: 'practice-areas'
    },
    {
        id: 'cybersecurity-recruitment',
        name: 'Cybersecurity Recruitment',
        serviceType: 'Cybersecurity recruitment',
        description: 'Recruitment of cybersecurity professionals for technology and enterprise teams.',
        anchor: 'practice-areas'
    },
    {
        id: 'iot-iiot-staffing',
        name: 'IoT and IIoT Staffing',
        serviceType: 'IoT and industrial IoT staffing',
        description: 'Staffing of IoT and industrial IoT (IIoT) engineering talent.',
        anchor: 'practice-areas'
    },
    {
        id: 'non-technology-recruitment',
        name: 'Non-Technology Recruitment',
        serviceType: 'Non-IT and functional recruitment',
        description: 'Recruitment across Engineering & Technical, IT & Digital, Finance & Accounting, Sales & Marketing, Human Resources & Recruitment, Operations & Administration, Procurement & Supply Chain, Customer Service, and Leadership & Executive Search.',
        anchor: 'key-job-functions'
    },
    {
        id: 'dedicated-offshore-teams',
        name: 'Dedicated Offshore Teams',
        serviceType: 'Dedicated offshore engineering team staffing',
        description: 'Dedicated engineering teams that work exclusively for the client, matched to its technology requirements and working methods, with support to grow and manage the team.',
        anchor: 'offshore-teams'
    },
    {
        id: 'payroll-compliance-support',
        name: 'Payroll and Compliance Support',
        serviceType: 'Payroll and compliance support',
        description: 'Payroll, legal and statutory compliance, onboarding, documents and records, and day-to-day workforce coordination for eligible staffing engagements.',
        anchor: 'payroll'
    }
];
/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */
export function buildSchemaGraph(siteUrl) {
    const home = getCanonicalUrl(siteUrl);
    const orgId = `${siteUrl}/#organization`;
    const areaServed = SERVICE_AREA_COUNTRIES.map((name) => ({ '@type': 'Country', name }));
    const serviceNodes = SERVICES.map((s) => ({
        '@type': 'Service',
        '@id': `${siteUrl}/#service-${s.id}`,
        name: s.name,
        serviceType: s.serviceType,
        description: s.description,
        provider: { '@id': orgId },
        areaServed,
        ...(s.anchor ? { url: `${home}#${s.anchor}` } : {})
    }));
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': ['Organization', 'EmploymentAgency'],
                '@id': orgId,
                name: BRAND_NAME,
                slogan: BRAND_TAGLINE,
                url: home,
                description: HOME_META.description,
                logo: {
                    '@type': 'ImageObject',
                    '@id': `${siteUrl}/#logo`,
                    url: `${siteUrl}${SCHEMA_LOGO_PATH}`,
                    contentUrl: `${siteUrl}${SCHEMA_LOGO_PATH}`,
                    width: 512,
                    height: 512,
                    caption: `${BRAND_NAME} — ${BRAND_TAGLINE}`
                },
                image: `${siteUrl}${OG_IMAGE_PATH}`,
                email: BUSINESS.email,
                telephone: BUSINESS.telephone,
                address: { '@type': 'PostalAddress', ...BUSINESS.address },
                parentOrganization: {
                    '@type': 'Organization',
                    '@id': `${siteUrl}/#parent-organization`,
                    name: PARENT_ORG_NAME
                },
                areaServed,
                knowsAbout: [
                    'Staffing services in Coimbatore',
                    'Recruitment agency in Coimbatore',
                    'IT staffing',
                    'Non-IT staffing',
                    'Technical recruitment',
                    'Permanent placement',
                    'Executive search',
                    'AI and machine learning recruitment',
                    'Data engineering staffing',
                    'Cloud and DevOps recruitment',
                    'Cybersecurity recruitment',
                    'IoT and IIoT staffing',
                    'Engineering and technical recruitment',
                    'Finance and accounting recruitment',
                    'Sales and marketing recruitment',
                    'Human resources and operations recruitment',
                    'Procurement and supply chain recruitment',
                    'Dedicated offshore engineering teams',
                    'Payroll and compliance support'
                ],
                contactPoint: [
                    {
                        '@type': 'ContactPoint',
                        contactType: 'sales',
                        email: BUSINESS.email,
                        telephone: BUSINESS.telephone,
                        areaServed: SERVICE_AREA_COUNTRIES,
                        availableLanguage: ['English']
                    }
                ],
                sameAs: [BUSINESS.linkedin],
                hasOfferCatalog: {
                    '@type': 'OfferCatalog',
                    name: 'Staffing and Recruitment Services',
                    itemListElement: SERVICES.map((s) => ({
                        '@type': 'Offer',
                        itemOffered: { '@id': `${siteUrl}/#service-${s.id}` }
                    }))
                }
            },
            {
                '@type': 'WebSite',
                '@id': `${siteUrl}/#website`,
                url: home,
                name: BRAND_NAME,
                description: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
                publisher: { '@id': orgId },
                inLanguage: 'en-IN'
            },
            {
                '@type': 'WebPage',
                '@id': `${home}#webpage`,
                url: home,
                name: HOME_META.title,
                description: HOME_META.description,
                isPartOf: { '@id': `${siteUrl}/#website` },
                about: { '@id': orgId },
                primaryImageOfPage: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}${OG_IMAGE_PATH}`,
                    width: OG_IMAGE_WIDTH,
                    height: OG_IMAGE_HEIGHT
                },
                inLanguage: 'en-IN'
            },
            ...serviceNodes,
            {
                '@type': 'FAQPage',
                '@id': `${home}#faq`,
                isPartOf: { '@id': `${home}#webpage` },
                mainEntity: FAQ_ITEMS.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a }
                }))
            }
        ]
    };
}
/** JSON for use inside an inline <script>: "<" is escaped so the tag can never be closed early. */
export function serializeJsonLd(data) {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}
const GTM_RE = /^GTM-[A-Z0-9]{4,}$/;
const GA4_RE = /^G-[A-Z0-9]{6,}$/;
export function cleanAnalyticsConfig(raw) {
    const gtmId = (raw.gtmId || '').trim();
    const ga4Id = (raw.ga4Id || '').trim();
    const gscToken = (raw.gscToken || '').trim();
    return {
        gtmId: GTM_RE.test(gtmId) ? gtmId : undefined,
        ga4Id: GA4_RE.test(ga4Id) ? ga4Id : undefined,
        gscToken: gscToken && !/placeholder|xxxx/i.test(gscToken) ? gscToken : undefined
    };
}
/* ------------------------------------------------------------------ */
/* <head> rendering                                                    */
/* ------------------------------------------------------------------ */
export const SEO_HEAD_START = '<!--seo:start-->';
export const SEO_HEAD_END = '<!--seo:end-->';
export function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
export function renderHeadTags(opts) {
    const { siteUrl } = opts;
    const analytics = cleanAnalyticsConfig(opts.analytics || {});
    const meta = getPageMeta(opts.pathname || '/');
    const canonical = getCanonicalUrl(siteUrl);
    const ogImage = `${siteUrl}${OG_IMAGE_PATH}`;
    const t = escapeHtml(meta.title);
    const d = escapeHtml(meta.description);
    const lines = [
        SEO_HEAD_START,
        `<title>${t}</title>`,
        `<meta name="description" content="${d}" />`,
        `<meta name="author" content="${BRAND_NAME}" />`,
        `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
        `<link rel="canonical" href="${canonical}" />`,
        analytics.gscToken
            ? `<meta name="google-site-verification" content="${escapeHtml(analytics.gscToken)}" />`
            : `<!-- Google Search Console: set VITE_GOOGLE_SITE_VERIFICATION to emit the verification meta tag -->`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${BRAND_NAME}" />`,
        `<meta property="og:title" content="${t}" />`,
        `<meta property="og:description" content="${d}" />`,
        `<meta property="og:url" content="${canonical}" />`,
        `<meta property="og:image" content="${ogImage}" />`,
        `<meta property="og:image:type" content="image/png" />`,
        `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
        `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
        `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
        `<meta property="og:locale" content="en_IN" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:site" content="${BUSINESS.twitterHandle}" />`,
        `<meta name="twitter:creator" content="${BUSINESS.twitterHandle}" />`,
        `<meta name="twitter:title" content="${t}" />`,
        `<meta name="twitter:description" content="${d}" />`,
        `<meta name="twitter:image" content="${ogImage}" />`,
        `<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
        `<script id="smrikaam-workforce-schema" type="application/ld+json">${serializeJsonLd(buildSchemaGraph(siteUrl))}</script>`
    ];
    if (analytics.gtmId) {
        lines.push(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.gtmId}');</script>`);
    }
    else if (analytics.ga4Id) {
        lines.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${analytics.ga4Id}"></script>`, `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.ga4Id}');</script>`);
    }
    else {
        lines.push(`<!-- Analytics not configured: set VITE_GTM_ID (Google Tag Manager) or VITE_GA4_MEASUREMENT_ID (GA4) -->`);
    }
    lines.push(SEO_HEAD_END);
    return lines.join('\n    ');
}
/** Markup placed right after <body> (Google Tag Manager <noscript> fallback). */
export function renderBodyTags(analytics) {
    const cfg = cleanAnalyticsConfig(analytics || {});
    if (!cfg.gtmId)
        return '';
    return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${cfg.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}
/* ------------------------------------------------------------------ */
/* robots.txt / sitemap.xml                                            */
/* ------------------------------------------------------------------ */
export function renderRobotsTxt(siteUrl) {
    return [
        `# robots.txt for ${BRAND_NAME} (${siteUrl})`,
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
        ''
    ].join('\n');
}
export function renderSitemapXml(siteUrl, lastmod) {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        `    <loc>${getCanonicalUrl(siteUrl)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '  </url>',
        '</urlset>',
        ''
    ].join('\n');
}
