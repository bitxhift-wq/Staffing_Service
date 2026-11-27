import json
import os
import re
import subprocess
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

ROOT_DIR = r"C:\STAFFING"
PREVIEW_PORT = 4173
BASE_URL = f"http://127.0.0.1:{PREVIEW_PORT}"


def wait_for_server(url: str, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False


def run_live_audit() -> bool:
    print("=" * 72)
    print("SMRIKAAM WORKFORCE — LIVE HEADLESS CHROMIUM SEO & RESPONSIVE AUDIT")
    print("=" * 72)

    results = []

    def record(name: str, passed: bool, details: str = ""):
        status = "PASS" if passed else "FAIL"
        results.append((name, passed, details))
        print(f"[{status}] {name}")
        if details:
            print(f"       -> {details}")

    server_proc = None
    started_server = False
    if not wait_for_server(BASE_URL, timeout=1.5):
        server_proc = subprocess.Popen(
            ["cmd", "/c", "npx", "vite", "preview", "--port", str(PREVIEW_PORT), "--host", "127.0.0.1"],
            cwd=ROOT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        started_server = True
        if not wait_for_server(BASE_URL, timeout=20.0):
            record("Preview Server Startup", False, f"Failed to start on {BASE_URL}")
            if server_proc:
                server_proc.terminate()
            return False

    try:
        # 1. HTTP checks for /, sitemap.xml, robots.txt, legacy route
        for path, label in [
            ("/", "HTTP 200 /"),
            ("/sitemap.xml", "HTTP 200 /sitemap.xml"),
            ("/robots.txt", "HTTP 200 /robots.txt"),
            ("/IT-staffing-services-in-Coimbatore/", "HTTP 200 legacy route"),
        ]:
            try:
                with urllib.request.urlopen(f"{BASE_URL}{path}", timeout=5) as resp:
                    body = resp.read().decode("utf-8", errors="replace")
                    ok = resp.status == 200 and len(body) > 0
                    if path == "/sitemap.xml":
                        root = ET.fromstring(body)
                        locs = [e.text for e in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
                        ok = ok and "https://smrikaam.com/" in locs
                        record(label, ok, f"status={resp.status}, locs={locs}")
                    elif path == "/robots.txt":
                        ok = ok and "Allow: /" in body and "Sitemap: https://smrikaam.com/sitemap.xml" in body
                        record(label, ok, f"status={resp.status}, sitemap declared={('Sitemap:' in body)}")
                    else:
                        record(label, ok, f"status={resp.status}, bytes={len(body)}")
            except Exception as e:
                record(label, False, str(e))

        # 2. Playwright headless Chromium checks
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            console_errors = []
            page_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            page.goto(BASE_URL, wait_until="networkidle")

            # Head metadata & canonical
            title = page.title()
            desc = page.locator('meta[name="description"]').get_attribute("content") or ""
            canonical = page.locator('link[rel="canonical"]').get_attribute("href") or ""
            robots = page.locator('meta[name="robots"]').get_attribute("content") or ""
            record(
                "Live Head Metadata & Canonical",
                title == "IT & Non-IT Staffing Services in Coimbatore | SMRIKAAM WORKFORCE"
                and canonical == "https://smrikaam.com/"
                and "index" in robots and "noindex" not in robots
                and len(desc) > 50,
                f"title='{title}', canonical='{canonical}'",
            )

            # Single H1 and no eyebrow in hero
            h1_count = page.locator("h1").count()
            h1_text = page.locator("h1").first.inner_text().strip() if h1_count else ""
            hero_eyebrow_count = page.locator("#hero .talento-eyebrow").count()
            record(
                "Single H1 & Hero Eyebrow Removed",
                h1_count == 1 and "TECHNICAL TALENT." in h1_text and hero_eyebrow_count == 0,
                f"H1 count={h1_count}, hero_eyebrow_count={hero_eyebrow_count}",
            )

            # JSON-LD @graph validation in live DOM
            schema_raw = page.locator("#smrikaam-workforce-schema").text_content() or ""
            try:
                schema = json.loads(schema_raw)
                graph = schema.get("@graph", [])
                types = []
                for node in graph:
                    t = node.get("@type")
                    types.extend(t if isinstance(t, list) else [t])
                services = [n for n in graph if n.get("@type") == "Service"]
                faq_node = next((n for n in graph if n.get("@type") == "FAQPage"), {})
                faq_count = len(faq_node.get("mainEntity", []))
                has_unsupported = any(k in schema_raw for k in ["AggregateRating", "Review", "Award"])
                ok = (
                    "Organization" in types
                    and "EmploymentAgency" in types
                    and "WebSite" in types
                    and "WebPage" in types
                    and len(services) == 11
                    and faq_count == 9
                    and not has_unsupported
                )
                record("Live JSON-LD @graph Schema", ok, f"nodes={len(graph)}, services={len(services)}, faqs={faq_count}")
            except Exception as e:
                record("Live JSON-LD @graph Schema", False, str(e))

            # Brand consistency in visible body text
            body_text = page.locator("body").inner_text()
            has_applied_merit = bool(re.search(r"applied\s*merit|appliedmerit", body_text, re.I))
            has_brand = "SMRIKAAM WORKFORCE" in body_text and "SMRIKAAM Technologies" in body_text
            record(
                "Visible Brand Consistency (No APPLIED MERIT)",
                not has_applied_merit and has_brand,
                f"APPLIED MERIT found={has_applied_merit}, SMRIKAAM brand present={has_brand}",
            )

            # Scroll through entire page to trigger lazy-loaded images & scroll reveal
            total_height = page.evaluate("document.body.scrollHeight")
            for y in range(0, total_height + 400, 500):
                page.evaluate(f"window.scrollTo(0, {y})")
                page.wait_for_timeout(120)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(200)

            img_report = page.evaluate("""() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.map(img => ({
                    src: img.getAttribute('src'),
                    alt: img.getAttribute('alt'),
                    decorative: Boolean(img.closest('[aria-hidden="true"]')),
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    rect: img.getBoundingClientRect()
                }));
            }""")
            broken_imgs = [i["src"] for i in img_report if not i["complete"] or i["naturalWidth"] == 0]
            missing_alt = [
                i["src"] for i in img_report
                if i["alt"] is None or (not i["decorative"] and not i["alt"].strip())
            ]
            record(
                "All Images Loaded (incl. Lazy-Loaded) & Alt Text",
                len(img_report) >= 9 and len(broken_imgs) == 0 and len(missing_alt) == 0,
                f"total={len(img_report)}, broken={broken_imgs}, missing_alt={missing_alt}",
            )

            # Analytics dataLayer event tests (without PII)
            page.evaluate("""() => {
                window.dataLayer = [];
                document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').forEach(a => {
                    a.addEventListener('click', e => e.preventDefault());
                });
            }""")
            page.locator('#hero button[data-track="request_shortlist_click"]').click()
            page.wait_for_timeout(100)
            # Close modal before clicking other links
            page.locator('button.talento-modal-close').click()
            page.wait_for_timeout(100)

            page.locator('#hero a[data-track="contact_cta"]').click()
            page.wait_for_timeout(100)
            page.locator('footer a[data-track="email_click"]').click()
            page.wait_for_timeout(100)
            page.locator('footer a[data-track="phone_click"]').click()
            page.wait_for_timeout(100)

            # Test form validation & mailto fallback event
            page.locator('#hero button[data-track="request_shortlist_click"]').click()
            page.wait_for_timeout(100)
            page.fill("#modalFullName", "Test User")
            page.fill("#modalCompanyName", "Test Corp")
            page.fill("#modalEmail", "test@example.com")
            page.fill("#modalPhone", "+91 98765 43210")
            # Intercept mailto navigation so page stays open
            page.evaluate("""() => {
                window.__originalHref = null;
            }""")
            page.locator('.talento-modal-box button[type="submit"]').click()
            page.wait_for_timeout(150)

            dl = page.evaluate("window.dataLayer || []")
            events = [e.get("event") for e in dl if isinstance(e, dict)]
            dl_str = json.dumps(dl)
            pii_leaked = any(s in dl_str for s in ["Test User", "test@example.com", "98765 43210"])
            expected_events = ["request_shortlist_click", "contact_cta", "email_click", "phone_click", "lead_email_draft_opened"]
            all_events_fired = all(ev in events for ev in expected_events)
            record(
                "Analytics dataLayer Events & Zero PII",
                all_events_fired and not pii_leaked,
                f"events={events}, pii_leaked={pii_leaked}",
            )
            page.locator('button.talento-modal-close').click()

            # Responsive viewport tests
            viewports = [
                ("Desktop 1440x900", 1440, 900),
                ("Desktop 1920x1080", 1920, 1080),
                ("Tablet 768x1024", 768, 1024),
                ("Mobile 390x844", 390, 844),
                ("Mobile 360x800", 360, 800),
            ]
            for label, w, h in viewports:
                page.set_viewport_size({"width": w, "height": h})
                page.wait_for_timeout(150)
                metrics = page.evaluate("""() => ({
                    scrollWidth: document.documentElement.scrollWidth,
                    clientWidth: document.documentElement.clientWidth,
                    headerHeight: document.querySelector('header')?.getBoundingClientRect().height || 0,
                    footerHeight: document.querySelector('footer')?.getBoundingClientRect().height || 0
                })""")
                no_overflow = metrics["scrollWidth"] <= metrics["clientWidth"]
                ok = no_overflow and metrics["headerHeight"] > 0 and metrics["footerHeight"] > 0
                record(
                    f"Responsive Layout ({label})",
                    ok,
                    f"scrollWidth={metrics['scrollWidth']}, clientWidth={metrics['clientWidth']}, headerH={metrics['headerHeight']:.0f}",
                )

            # Browser zoom compatibility at 1440x900
            page.set_viewport_size({"width": 1440, "height": 900})
            for zoom_pct in [100, 125, 150, 200]:
                page.evaluate(f"document.documentElement.style.zoom = '{zoom_pct}%'")
                page.wait_for_timeout(100)
                zm = page.evaluate("""() => ({
                    scrollWidth: document.documentElement.scrollWidth,
                    clientWidth: document.documentElement.clientWidth
                })""")
                record(
                    f"Browser Zoom {zoom_pct}% (1440x900)",
                    zm["scrollWidth"] <= zm["clientWidth"],
                    f"scrollWidth={zm['scrollWidth']}, clientWidth={zm['clientWidth']}",
                )
            page.evaluate("document.documentElement.style.zoom = '100%'")

            record(
                "Zero Console / Page Errors",
                len(console_errors) == 0 and len(page_errors) == 0,
                f"console_errors={len(console_errors)}, page_errors={len(page_errors)}",
            )

            browser.close()
    finally:
        if started_server and server_proc:
            server_proc.terminate()
            try:
                server_proc.wait(timeout=5)
            except Exception:
                server_proc.kill()

    print("=" * 72)
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"SUMMARY: {passed}/{total} LIVE SEO & RESPONSIVE AUDIT CHECKS PASSED")
    print("=" * 72)
    return passed == total


if __name__ == "__main__":
    ok = run_live_audit()
    sys.exit(0 if ok else 1)
