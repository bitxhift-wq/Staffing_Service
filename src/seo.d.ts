/**
 * SMRIKAAM WORKFORCE – single source of truth for SEO.
 *
 * This module is pure (no DOM, no import.meta.env) so it can be used by:
 *   - the Vite config (index.html head injection in dev + build),
 *   - the prerender script (via the SSR bundle),
 *   - the client-side SEOManager and FAQ section.
 */
export declare const BRAND_NAME = "SMRIKAAM WORKFORCE";
export declare const BRAND_TAGLINE = "BRIDGING TALENT AND OPPORTUNITY";
export declare const PARENT_ORG_NAME = "SMRIKAAM Technologies";
export declare const DEFAULT_SITE_URL = "https://smrikaam.com";
/** Business facts. Only information that is already published on the website. */
export declare const BUSINESS: {
    email: string;
    telephone: string;
    address: {
        streetAddress: string;
        addressLocality: string;
        addressRegion: string;
        postalCode: string;
        addressCountry: string;
    };
    linkedin: string;
    twitterHandle: string;
};
/** Countries targeted by international search intent (service area only – NOT offices). */
export declare const SERVICE_AREA_COUNTRIES: string[];
export declare const OG_IMAGE_PATH = "/assets/Smrikaam_Workforce_OG_1200x630.png";
export declare const OG_IMAGE_WIDTH = 1200;
export declare const OG_IMAGE_HEIGHT = 630;
export declare const OG_IMAGE_ALT = "SMRIKAAM WORKFORCE \u2014 BRIDGING TALENT AND OPPORTUNITY";
export declare const SCHEMA_LOGO_PATH = "/assets/Smrikaam_Workforce_Logo_512.png";
export interface PageMeta {
    title: string;
    description: string;
}
export declare const HOME_META: PageMeta;
export declare const SECTION_ALIAS_META: Record<string, PageMeta>;
export declare function normalizePath(pathname: string): string;
export declare function getPageMeta(pathname: string): PageMeta;
/** Every URL of the single-page site canonicalises to the home page. */
export declare function getCanonicalUrl(siteUrl: string): string;
export interface FaqItem {
    q: string;
    a: string;
}
export declare const FAQ_ITEMS: FaqItem[];
interface ServiceDef {
    id: string;
    name: string;
    serviceType: string;
    description: string;
    anchor?: string;
}
export declare const SERVICES: ServiceDef[];
export declare function buildSchemaGraph(siteUrl: string): Record<string, unknown>;
/** JSON for use inside an inline <script>: "<" is escaped so the tag can never be closed early. */
export declare function serializeJsonLd(data: unknown): string;
export interface AnalyticsConfig {
    /** Google Tag Manager container ID, e.g. GTM-XXXXXXX */
    gtmId?: string;
    /** GA4 measurement ID, e.g. G-XXXXXXXXXX (used only when no GTM container is set) */
    ga4Id?: string;
    /** Google Search Console HTML-tag verification token */
    gscToken?: string;
}
export declare function cleanAnalyticsConfig(raw: AnalyticsConfig): AnalyticsConfig;
export declare const SEO_HEAD_START = "<!--seo:start-->";
export declare const SEO_HEAD_END = "<!--seo:end-->";
export declare function escapeHtml(value: string): string;
export declare function renderHeadTags(opts: {
    siteUrl: string;
    pathname?: string;
    analytics?: AnalyticsConfig;
}): string;
/** Markup placed right after <body> (Google Tag Manager <noscript> fallback). */
export declare function renderBodyTags(analytics?: AnalyticsConfig): string;
export declare function renderRobotsTxt(siteUrl: string): string;
export declare function renderSitemapXml(siteUrl: string, lastmod: string): string;
export {};
