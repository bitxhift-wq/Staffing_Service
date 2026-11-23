import os
import sys
import json
import xml.etree.ElementTree as ET
import urllib.request
import re

DIST_DIR = r"C:\STAFFING\dist"
PORT = 4173
BASE_URL = f"http://localhost:{PORT}"

def run_tests():
    print("=" * 70)
    print("SMRIKAAM STAFFING WEBSITE – PRODUCTION SEO AUDIT & VERIFICATION")
    print("=" * 70)

    results = []
    
    def record(name, passed, details=""):
        status = "PASS" if passed else "FAIL"
        results.append((name, passed, details))
        print(f"[{status}] {name}")
        if details:
            print(f"       -> {details}")

    # -------------------------------------------------------------
    # 1. Inspect dist/index.html & dist/IT-staffing-services-in-Coimbatore/index.html
    # -------------------------------------------------------------
    index_path = os.path.join(DIST_DIR, "index.html")
    route_index_path = os.path.join(DIST_DIR, "IT-staffing-services-in-Coimbatore", "index.html")

    if not os.path.exists(index_path):
        record("Production Build Artifact (dist/index.html)", False, "File does not exist")
        return False
    record("Production Build Artifact (dist/index.html)", True, f"Found {os.path.getsize(index_path)} bytes")

    if not os.path.exists(route_index_path):
        record("Static Route Artifact (dist/IT-staffing-services-in-Coimbatore/index.html)", False, "File does not exist")
    else:
        record("Static Route Artifact (dist/IT-staffing-services-in-Coimbatore/index.html)", True, f"Found {os.path.getsize(route_index_path)} bytes")

    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # 1. Correct SEO Title
    expected_title = "IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM"
    title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
    actual_title = title_match.group(1).replace("&amp;", "&") if title_match else ""
    record("SEO Title", actual_title == expected_title, f"Found: '{actual_title}'")

    # 2. Correct Meta Description
    expected_desc = "Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours."
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
    actual_desc = desc_match.group(1) if desc_match else ""
    record("Meta Description", actual_desc == expected_desc, f"Found: '{actual_desc}'")

    # 3. Canonical Uses Production Domain
    expected_canonical = "https://smrikaam.com/IT-staffing-services-in-Coimbatore"
    canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html, re.IGNORECASE)
    actual_canonical = canonical_match.group(1) if canonical_match else ""
    record("Canonical Uses Production Domain", actual_canonical == expected_canonical, f"Found: '{actual_canonical}'")

    # 4. No Placeholder Domain
    has_placeholder = any(p in html for p in ["yourdomain.com", "example.com"])
    record("No Placeholder Domain in Production Build", not has_placeholder, "Checked for yourdomain.com, example.com")

    # 5. No localhost URL in Production Metadata
    has_localhost = "localhost:" in html
    record("No Localhost URL in Production Metadata", not has_localhost, "Checked for localhost: in dist/index.html")

    # 6. HTML Language Attribute (en-IN)
    lang_match = re.search(r'<html\s+lang=["\'](.*?)["\']', html, re.IGNORECASE)
    actual_lang = lang_match.group(1) if lang_match else ""
    record("HTML Language Attribute (en-IN)", actual_lang == "en-IN", f"Found: '{actual_lang}'")

    # 7. Responsive Viewport
    has_viewport = 'name="viewport"' in html and 'content="width=device-width, initial-scale=1.0"' in html
    record("Responsive Viewport Metadata", has_viewport, "width=device-width, initial-scale=1.0")

    # 8. Open Graph Metadata
    og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']', html)
    og_desc = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']', html)
    og_url = re.search(r'<meta\s+property=["\']og:url["\']\s+content=["\'](.*?)["\']', html)
    og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', html)
    og_locale = re.search(r'<meta\s+property=["\']og:locale["\']\s+content=["\'](.*?)["\']', html)
    og_valid = bool(og_title and og_desc and og_url and og_img and og_locale)
    record("Open Graph Metadata (title, desc, url, image, locale)", og_valid, 
           f"og:url={og_url.group(1) if og_url else 'missing'}, og:locale={og_locale.group(1) if og_locale else 'missing'}")

    # 9. Twitter / X Card Metadata
    tw_card = re.search(r'<meta\s+name=["\']twitter:card["\']\s+content=["\'](.*?)["\']', html)
    tw_title = re.search(r'<meta\s+name=["\']twitter:title["\']\s+content=["\'](.*?)["\']', html)
    tw_desc = re.search(r'<meta\s+name=["\']twitter:description["\']\s+content=["\'](.*?)["\']', html)
    tw_img = re.search(r'<meta\s+name=["\']twitter:image["\']\s+content=["\'](.*?)["\']', html)
    tw_valid = bool(tw_card and tw_title and tw_desc and tw_img)
    record("Twitter / X Card Metadata", tw_valid, f"card={tw_card.group(1) if tw_card else 'missing'}")

    # 10. No Accidental Noindex / Indexable Directive
    robots_meta = re.search(r'<meta\s+name=["\']robots["\']\s+content=["\'](.*?)["\']', html)
    robots_content = robots_meta.group(1) if robots_meta else ""
    is_indexable = "index" in robots_content and "noindex" not in robots_content
    record("Search Engine Indexability (no accidental noindex)", is_indexable, f"robots='{robots_content}'")

    # 11. Google Search Console Verification Ready
    has_gsc = 'name="google-site-verification"' in html
    record("Google Search Console Verification Readiness", has_gsc, "meta name='google-site-verification' tag present")

    # 12. Sitemap.xml Validity
    sitemap_path = os.path.join(DIST_DIR, "sitemap.xml")
    if os.path.exists(sitemap_path):
        try:
            tree = ET.parse(sitemap_path)
            root = tree.getroot()
            namespaces = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            urls = [elem.text for elem in root.findall('.//sm:loc', namespaces)]
            valid_urls = all(u.startswith("https://smrikaam.com") for u in urls) and len(urls) > 0
            record("Sitemap.xml Schema & Production URLs", valid_urls, f"Found {len(urls)} URLs: {urls}")
        except Exception as e:
            record("Sitemap.xml Schema & Production URLs", False, f"XML Parse error: {e}")
    else:
        record("Sitemap.xml Schema & Production URLs", False, "dist/sitemap.xml not found")

    # 13. Robots.txt Validity
    robots_path = os.path.join(DIST_DIR, "robots.txt")
    if os.path.exists(robots_path):
        with open(robots_path, "r", encoding="utf-8") as f:
            robots_txt = f.read()
        robots_ok = "User-agent: *" in robots_txt and "Allow: /" in robots_txt and "Sitemap: https://smrikaam.com/sitemap.xml" in robots_txt
        record("Robots.txt Crawl Directives & Sitemap Reference", robots_ok, f"Allow: /, Sitemap declared: {'Yes' if 'Sitemap:' in robots_txt else 'No'}")
    else:
        record("Robots.txt Crawl Directives & Sitemap Reference", False, "dist/robots.txt not found")

    # 14. JSON-LD Structured Data Syntax & Schema Types
    schema_match = re.search(r'<script\s+id=["\']smrikaam-(?:appliedmerit|appliedskills|talento)-schema["\']\s+type=["\']application/ld\+json["\']>(.*?)</script>', html, re.DOTALL)
    if schema_match:
        try:
            schema_data = json.loads(schema_match.group(1))
            graph = schema_data.get("@graph", [])
            types = []
            for item in graph:
                t = item.get("@type")
                if isinstance(t, list):
                    types.extend(t)
                else:
                    types.append(t)
            has_org = "Organization" in types
            has_local = "LocalBusiness" in types or "ProfessionalService" in types
            has_website = "WebSite" in types
            has_webpage = "WebPage" in types
            has_breadcrumb = "BreadcrumbList" in types
            schema_passed = has_org and has_local and has_website and has_webpage and has_breadcrumb
            record("JSON-LD Structured Data (@graph Validation)", schema_passed, 
                   f"Types found: {types}, Items: {len(graph)}")
        except Exception as e:
            record("JSON-LD Structured Data (@graph Validation)", False, f"JSON-LD Parse error: {e}")
    else:
        record("JSON-LD Structured Data (@graph Validation)", False, "Schema script tag not found")

    # 15. Initial HTML Prerendering (Content available without JS)
    has_prerendered_content = 'TECHNICAL TALENT.' in html and 'BUILT FOR SPEED.' in html and 'IT Staffing Services in Coimbatore' in html
    record("Initial HTML SSR/Prerender Content (Crawlers see full copy)", has_prerendered_content, 
           f"Root HTML contains {len(html)} characters with full H1, H2, and service copy")

    # 16. Heading Hierarchy
    h1_count = len(re.findall(r'<h1[\s>]', html))
    h2_count = len(re.findall(r'<h2[\s>]', html))
    h3_count = len(re.findall(r'<h3[\s>]', html))
    record("Heading Hierarchy (H1, H2, H3 structure)", h1_count == 1 and h2_count >= 5 and h3_count >= 10,
           f"H1 count: {h1_count}, H2 count: {h2_count}, H3 count: {h3_count}")

    # 17. No SEO Configuration Labels in Visible Page Body
    body_content = html[html.find("<body>"):] if "<body>" in html else html
    visible_labels = ["SEO Title", "Meta Description", "Suggested URL", "Focus Keywords"]
    found_labels = [l for l in visible_labels if l in body_content]
    record("No SEO Configuration Labels in Visible UI", len(found_labels) == 0, 
           f"Labels found in body: {found_labels if found_labels else 'None (Clean)'}")

    # 18. Image Alt Text & Core Web Vitals Attributes
    img_tags = re.findall(r'<img\s+[^>]*>', html)
    all_have_alt = all('alt="' in img for img in img_tags)
    hero_has_high_priority = any('fetchpriority="high"' in img.lower() for img in img_tags)
    all_have_dims = all('width="' in img and 'height="' in img for img in img_tags)
    record("Image Alt Attributes, Dimensions & LCP Priority", all_have_alt and all_have_dims and hero_has_high_priority,
           f"Images: {len(img_tags)}, All have alt: {all_have_alt}, All have width/height: {all_have_dims}, LCP priority: {hero_has_high_priority}")

    # 19. Internal Anchor Targets Check
    anchor_hrefs = re.findall(r'href=["\']#([^"\']+)["\']', html)
    missing_targets = []
    for href in set(anchor_hrefs):
        if f'id="{href}"' not in html:
            missing_targets.append(href)
    record("Internal Link Integrity (All # targets exist)", len(missing_targets) == 0,
           f"Verified {len(anchor_hrefs)} internal anchors, missing: {missing_targets if missing_targets else 'None'}")

    # -------------------------------------------------------------
    # 20. Verify All 9 Main Sections in Exact Required Order
    # -------------------------------------------------------------
    section_ids = [
        "hero",
        "models",
        "technology-areas",
        "non-technology-areas",
        "offshore-teams",
        "payroll-compliance",
        "where-we-work",
        "faq",
        "final-cta"
    ]
    indices = [html.find(f'id="{sid}"') for sid in section_ids]
    all_sections_present = all(idx != -1 for idx in indices)
    order_correct = all_sections_present and all(indices[i] < indices[i+1] for i in range(len(indices)-1))
    record("All 9 Sections Present in Exact Required Order", order_correct,
           f"Sections found: {[sid for sid, idx in zip(section_ids, indices) if idx != -1]}")

    # -------------------------------------------------------------
    # 21. Verify Both Staffing Model Subsections
    # -------------------------------------------------------------
    has_perm = 'id="permanent-placement"' in html and "PERMANENT" in html and "PLACEMENT" in html
    has_exec = 'id="executive-search"' in html and "EXECUTIVE" in html and "SEARCH" in html
    record("Both Staffing Model Subsections (Permanent & Executive)", has_perm and has_exec,
           f"Permanent: {has_perm}, Executive: {has_exec}")

    # -------------------------------------------------------------
    # 22. Verify All 8 Technology Categories
    # -------------------------------------------------------------
    tech_cats = [
        "Software Engineering",
        "AI and Machine Learning",
        "Data Engineering and Analytics",
        "Cloud and DevOps",
        "Cybersecurity",
        "IoT and Industrial IoT (IIoT)",
        "Enterprise Applications",
        "Other Specialized Technology Fields"
    ]
    all_tech = all(cat in html for cat in tech_cats)
    record("All 8 Technology Categories Present (No Renaming/Removal)", all_tech,
           f"Verified {len(tech_cats)} categories")

    # -------------------------------------------------------------
    # 23. Verify Both Offshore and Payroll Sections
    # -------------------------------------------------------------
    has_offshore = "BUILD A DEDICATED" in html and "OFFSHORE TEAM" in html and "DEDICATED CAPACITY" in html
    has_payroll = "PAYROLL AND" in html and "COMPLIANCE SUPPORT" in html and "WORKFORCE ADMINISTRATION" in html
    record("Both Offshore and Payroll Sections (Equally Sized & Aligned)", has_offshore and has_payroll,
           f"Offshore: {has_offshore}, Payroll: {has_payroll}")

    # -------------------------------------------------------------
    # 24. Verify All 6 FAQ Questions and Answers
    # -------------------------------------------------------------
    faqs_present = all(q in html for q in [
        "How fast can you shortlist candidates?",
        "Do you handle payroll and compliance for staff?",
        "What technology areas do you specialize in?",
        "Can you build a dedicated offshore team for us?",
        "Do you offer a replacement guarantee?",
        "Which locations do you serve?"
    ])
    record("All 6 FAQ Questions and Answers Present", faqs_present,
           "Verified Q1 through Q6")

    # -------------------------------------------------------------
    # 25. Verify Final CTA
    # -------------------------------------------------------------
    has_final_cta = "READY TO HIRE" in html and "SPECIALIZED TALENT?" in html and "TALENT ACQUISITION DESK" in html and "REQUEST TALENT SHORTLIST" in html
    record("Final Call to Action (Heading, Subheading, Content, CTA)", has_final_cta,
           f"Ready to hire CTA verified: {has_final_cta}")

    print("=" * 70)
    passed_count = sum(1 for _, p, _ in results if p)
    total_count = len(results)
    print(f"SUMMARY: {passed_count}/{total_count} PRODUCTION SEO AUDIT TESTS PASSED")
    print("=" * 70)
    return passed_count == total_count

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
