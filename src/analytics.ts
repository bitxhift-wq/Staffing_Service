/**
 * Lightweight, privacy-conscious conversion tracking.
 *
 * Events are sent to Google Tag Manager (dataLayer) or GA4 (gtag) only when one of
 * them has been configured through VITE_GTM_ID / VITE_GA4_MEASUREMENT_ID.
 * When neither is configured the events are only queued in `window.dataLayer`
 * and nothing is sent anywhere. No personal data (name, e-mail, phone) is ever
 * included in event parameters.
 */

export type AnalyticsParams = Record<string, string | number | boolean | undefined>

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

export function trackEvent(name: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return
  const w = window as AnalyticsWindow
  const clean: Record<string, string | number | boolean> = {}
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v !== undefined) clean[k] = v
  })

  if (typeof w.gtag === 'function') {
    w.gtag('event', name, clean)
  } else {
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({ event: name, ...clean })
  }
}

/** "india" for +91 numbers, "international" for any other country code, otherwise "unknown". */
export function getEnquiryRegion(phone: string): 'india' | 'international' | 'unknown' {
  const p = (phone || '').replace(/[\s()-]/g, '')
  if (!p) return 'unknown'
  if (p.startsWith('+91') || p.startsWith('0091')) return 'india'
  if (p.startsWith('+') || p.startsWith('00')) return 'international'
  return 'unknown'
}

/** Identifies where on the page a tracked element lives. */
export function getCtaLocation(el: Element): string {
  if (el.closest('.talento-mobile-drawer')) return 'mobile_menu'
  if (el.closest('.talento-modal-overlay, .talento-modal')) return 'shortlist_modal'
  if (el.closest('header')) return 'header'
  if (el.closest('footer')) return 'footer'
  const section = el.closest('section[id], div[id].talento-model-block')
  return (section && section.id) || 'page'
}

/** Delegated click tracking for elements carrying data-track="<event_name>". */
export function handleTrackedClick(e: MouseEvent): void {
  const target = e.target as Element | null
  if (!target || !target.closest) return
  const el = target.closest('[data-track]') as HTMLElement | null
  if (!el) return
  const name = el.getAttribute('data-track')
  if (!name) return
  trackEvent(name, { cta_location: getCtaLocation(el) })
}
