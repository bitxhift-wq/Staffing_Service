import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-spa-test"
PORT = 9555
BASE_URL = "http://localhost:4173"

async def run_tests():
    os.makedirs(USER_DATA, exist_ok=True)
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--window-size=1440,900"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        page_targets = [t for t in targets if t.get("type") == "page"]
        ws_url = page_targets[0]["webSocketDebuggerUrl"] if page_targets else targets[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == msg_id:
                        return resp.get("result")

            await send("Page.enable")
            await send("Runtime.enable")

            print("=" * 80)
            print("APPLIED MERIT — POWERED BY SMRIKAAM – SINGLE-PAGE NAVIGATION ARCHITECTURE VERIFICATION")
            print("=" * 80)

            results = []
            def record(test_name, passed, details=""):
                status = "PASS" if passed else "FAIL"
                results.append((test_name, passed, details))
                print(f"[{status}] {test_name}")
                if details:
                    print(f"       -> {details}")

            # -------------------------------------------------------------
            # TEST 1: Main Page Continuous Single-Page DOM Structure
            # -------------------------------------------------------------
            print("\n--- TEST 1: Single-Page Structure Check ---")
            await send("Page.navigate", {"url": f"{BASE_URL}/"})
            await asyncio.sleep(2.0)

            dom_check = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sections = [
                        { name: '1. Hero', el: document.getElementById('hero') },
                        { name: '2. Staffing Models', el: document.getElementById('staffing-models') },
                        { name: '   2a. Permanent Placement', el: document.getElementById('permanent-placement') },
                        { name: '   2b. Executive Search', el: document.getElementById('executive-search') },
                        { name: '3. Technology Areas', el: document.getElementById('practice-areas') },
                        { name: '4. Non-Technology Areas', el: document.getElementById('non-technology-areas') },
                        { name: '5. Offshore Teams', el: document.getElementById('offshore-teams') },
                        { name: '6. Payroll', el: document.getElementById('payroll') },
                        { name: '7. Where We Work', el: document.getElementById('locations') },
                        { name: '8. FAQ', el: document.getElementById('faq') },
                        { name: '9a. Final CTA', el: document.getElementById('final-cta') },
                        { name: '9b. Contact Form', el: document.getElementById('contact') }
                    ];

                    return {
                        allPresent: sections.every(s => !!s.el),
                        counts: sections.map(s => ({ name: s.name, found: !!s.el })),
                        totalModelBlocks: document.querySelectorAll('.talento-model-block').length,
                        totalTechCards: document.querySelectorAll('.talento-tech-card').length,
                        totalFaqs: document.querySelectorAll('.talento-faq-item').length
                    };
                })()
                """,
                "returnByValue": True
            })
            dom_val = dom_check["result"]["value"]
            record("1. All 9 Sections Present Concurrently in DOM", dom_val["allPresent"],
                   f"Model blocks: {dom_val['totalModelBlocks']}, Tech cards: {dom_val['totalTechCards']}, FAQs: {dom_val['totalFaqs']}")

            # -------------------------------------------------------------
            # TEST 2: Navbar Click Smooth Scrolling & Position
            # -------------------------------------------------------------
            print("\n--- TEST 2: Navbar Item Smooth Scrolling & Heading Visibility ---")
            
            nav_items_to_test = [
                ("STAFFING MODELS", "staffing-models", "OUR STAFFING MODELS"),
                ("PERMANENT PLACEMENT", "permanent-placement", "PERMANENT"),
                ("EXECUTIVE SEARCH", "executive-search", "EXECUTIVE"),
                ("PRACTICE AREAS", "practice-areas", "TECHNOLOGY AREAS"),
                ("OFFSHORE TEAMS", "offshore-teams", "BUILD A DEDICATED"),
                ("PAYROLL", "payroll", "PAYROLL AND"),
                ("LOCATIONS", "locations", "WHERE WE WORK"),
                ("FAQ", "faq", "FREQUENTLY"),
                ("CONTACT", "final-cta", "READY TO HIRE")
            ]

            for label, expected_id, expected_heading_text in nav_items_to_test:
                click_script = f"""
                (() => {{
                    const links = Array.from(document.querySelectorAll('.talento-nav a'));
                    const link = links.find(l => l.innerText.trim().toUpperCase() === '{label}');
                    if (link) {{
                        link.click();
                        return true;
                    }}
                    return false;
                }})()
                """
                clicked = await send("Runtime.evaluate", {"expression": click_script, "returnByValue": True})
                await asyncio.sleep(1.0) # Wait for smooth scroll

                check_pos = await send("Runtime.evaluate", {
                    "expression": f"""
                    (() => {{
                        const el = document.getElementById('{expected_id}');
                        const header = document.querySelector('.talento-header');
                        if (!el || !header) return {{ error: 'not found' }};
                        const elRect = el.getBoundingClientRect();
                        const headerRect = header.getBoundingClientRect();
                        const activeLink = document.querySelector('.talento-nav a.active')?.innerText?.trim();
                        const hash = window.location.hash;
                        const pathname = window.location.pathname;

                        return {{
                            elTop: Math.round(elRect.top),
                            headerHeight: Math.round(headerRect.height),
                            visibleBelowHeader: elRect.top >= headerRect.height - 5,
                            distanceBelowHeader: Math.round(elRect.top - headerRect.height),
                            activeLink: activeLink,
                            hash: hash,
                            pathname: pathname,
                            textSnippet: el.innerText.substring(0, 100)
                        }};
                    }})()
                    """,
                    "returnByValue": True
                })
                pos_val = check_pos["result"]["value"]
                
                heading_visible = pos_val.get("visibleBelowHeader", False)
                dist = pos_val.get("distanceBelowHeader", 0)
                active = pos_val.get("activeLink", "")
                
                record(f"Navbar click '{label}' -> scrolls to #{expected_id}",
                       heading_visible and dist >= -2 and dist <= 35,
                       f"elTop={pos_val.get('elTop')}px, HeaderHeight={pos_val.get('headerHeight')}px, SpaceBelowHeader={dist}px, ActiveLink='{active}', Hash='{pos_val.get('hash')}'")

            # -------------------------------------------------------------
            # TEST 3: Request Shortlist Button Scroll
            # -------------------------------------------------------------
            print("\n--- TEST 3: Request Shortlist Button ---")
            click_shortlist = """
            (() => {
                const btn = document.querySelector('.talento-btn-nav');
                if (btn) btn.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": click_shortlist})
            await asyncio.sleep(1.0)

            check_shortlist = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const el = document.getElementById('contact');
                    const header = document.querySelector('.talento-header');
                    const elRect = el.getBoundingClientRect();
                    const headerRect = header.getBoundingClientRect();
                    return {
                        elTop: Math.round(elRect.top),
                        dist: Math.round(elRect.top - headerRect.height),
                        visibleBelowHeader: elRect.top >= headerRect.height - 5,
                        formFound: !!document.querySelector('.talento-contact-form-box')
                    };
                })()
                """,
                "returnByValue": True
            })
            s_val = check_shortlist["result"]["value"]
            record("Request Shortlist button scrolls to contact form",
                   s_val.get("visibleBelowHeader", False) and s_val.get("formFound", False),
                   f"SpaceBelowHeader={s_val.get('dist')}px, FormFound={s_val.get('formFound')}")

            # -------------------------------------------------------------
            # TEST 4: Direct URL Hash Loading
            # -------------------------------------------------------------
            print("\n--- TEST 4: Direct URL Hash Navigation ---")
            test_hashes = [
                ("executive-search", "EXECUTIVE SEARCH"),
                ("permanent-placement", "PERMANENT PLACEMENT"),
                ("faq", "FAQ")
            ]

            for h, expected_active in test_hashes:
                url_with_hash = f"{BASE_URL}/#{h}"
                await send("Page.navigate", {"url": url_with_hash})
                await asyncio.sleep(1.2)

                check_hash = await send("Runtime.evaluate", {
                    "expression": f"""
                    (() => {{
                        const el = document.getElementById('{h}');
                        const header = document.querySelector('.talento-header');
                        if (!el || !header) return {{ error: 'not found' }};
                        const elRect = el.getBoundingClientRect();
                        const headerRect = header.getBoundingClientRect();
                        const activeLink = document.querySelector('.talento-nav a.active')?.innerText?.trim();
                        return {{
                            elTop: Math.round(elRect.top),
                            dist: Math.round(elRect.top - headerRect.height),
                            visible: elRect.top >= headerRect.height - 5 && elRect.top <= headerRect.height + 35,
                            activeLink: activeLink
                        }};
                    }})()
                    """,
                    "returnByValue": True
                })
                h_val = check_hash["result"]["value"]
                record(f"Direct Hash URL: #{h}",
                       h_val.get("visible", False),
                       f"SpaceBelowHeader={h_val.get('dist')}px, ActiveLink='{h_val.get('activeLink')}'")

            # -------------------------------------------------------------
            # TEST 5: Direct Route Compatibility (e.g. /permanent-placement)
            # -------------------------------------------------------------
            print("\n--- TEST 5: Direct Route Single-Page Mapping ---")
            await send("Page.navigate", {"url": f"{BASE_URL}/permanent-placement"})
            await asyncio.sleep(1.5)

            check_route = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const el = document.getElementById('permanent-placement');
                    const header = document.querySelector('.talento-header');
                    const allSectionsPresent = [
                        'hero', 'staffing-models', 'permanent-placement', 'executive-search',
                        'practice-areas', 'non-technology-areas', 'offshore-teams', 'payroll',
                        'locations', 'faq', 'final-cta', 'contact'
                    ].every(id => !!document.getElementById(id));

                    const elRect = el ? el.getBoundingClientRect() : { top: -999 };
                    const headerHeight = header ? header.offsetHeight : 82;

                    return {
                        allSectionsPresent: allSectionsPresent,
                        dist: Math.round(elRect.top - headerHeight),
                        visible: elRect.top >= headerHeight - 5 && elRect.top <= headerHeight + 35,
                        totalModelBlocks: document.querySelectorAll('.talento-model-block').length,
                        activeLink: document.querySelector('.talento-nav a.active')?.innerText?.trim()
                    };
                })()
                """,
                "returnByValue": True
            })
            r_val = check_route["result"]["value"]
            record("Direct /permanent-placement renders full continuous single page",
                   r_val.get("allSectionsPresent", False) and r_val.get("totalModelBlocks") == 2,
                   f"AllSectionsInDOM={r_val.get('allSectionsPresent')}, TotalModelBlocks={r_val.get('totalModelBlocks')}, SpaceBelowHeader={r_val.get('dist')}px, ActiveLink='{r_val.get('activeLink')}'")

            # -------------------------------------------------------------
            # TEST 6: Browser Back & Forward Navigation
            # -------------------------------------------------------------
            print("\n--- TEST 6: Browser Back and Forward Navigation ---")
            # Navigate to home
            await send("Page.navigate", {"url": f"{BASE_URL}/"})
            await asyncio.sleep(1.0)

            # Click STAFFING MODELS
            await send("Runtime.evaluate", {"expression": "document.querySelectorAll('.talento-nav a')[0].click()"})
            await asyncio.sleep(0.8)

            # Click FAQ
            await send("Runtime.evaluate", {"expression": "document.querySelectorAll('.talento-nav a')[7].click()"})
            await asyncio.sleep(0.8)

            # Check that we are at FAQ
            faq_check = await send("Runtime.evaluate", {
                "expression": "({ hash: window.location.hash, active: document.querySelector('.talento-nav a.active')?.innerText?.trim() })",
                "returnByValue": True
            })
            record("Navigated to FAQ", faq_check["result"]["value"]["hash"] == "#faq", f"Active: {faq_check['result']['value']['active']}")

            # Go Back
            await send("Runtime.evaluate", {"expression": "window.history.back()"})
            await asyncio.sleep(1.0)

            back_check = await send("Runtime.evaluate", {
                "expression": "({ hash: window.location.hash, active: document.querySelector('.talento-nav a.active')?.innerText?.trim() })",
                "returnByValue": True
            })
            b_val = back_check["result"]["value"]
            record("Browser Back returns to #staffing-models",
                   b_val.get("hash") == "#staffing-models",
                   f"Hash={b_val.get('hash')}, ActiveLink='{b_val.get('active')}'")

            # Go Forward
            await send("Runtime.evaluate", {"expression": "window.history.forward()"})
            await asyncio.sleep(1.0)

            fwd_check = await send("Runtime.evaluate", {
                "expression": "({ hash: window.location.hash, active: document.querySelector('.talento-nav a.active')?.innerText?.trim() })",
                "returnByValue": True
            })
            f_val = fwd_check["result"]["value"]
            record("Browser Forward returns to #faq",
                   f_val.get("hash") == "#faq",
                   f"Hash={f_val.get('hash')}, ActiveLink='{f_val.get('active')}'")

            # -------------------------------------------------------------
            # TEST 7: Mobile Viewport & Drawer Navigation
            # -------------------------------------------------------------
            print("\n--- TEST 7: Mobile Navigation & Drawer ---")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 375,
                "height": 812,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await send("Page.navigate", {"url": f"{BASE_URL}/"})
            await asyncio.sleep(1.2)

            # Check mobile menu button visible
            btn_visible = await send("Runtime.evaluate", {
                "expression": "window.getComputedStyle(document.querySelector('.talento-menu-btn')).display !== 'none'",
                "returnByValue": True
            })
            record("Mobile Menu Button Visible on 375px", btn_visible["result"]["value"])

            # Open Mobile Menu
            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-menu-btn').click()"})
            await asyncio.sleep(0.4)

            drawer_open = await send("Runtime.evaluate", {
                "expression": "document.querySelector('.talento-mobile-drawer').classList.contains('open')",
                "returnByValue": True
            })
            record("Mobile Drawer Opens", drawer_open["result"]["value"])

            # Click 03 PERMANENT PLACEMENT in drawer
            click_mobile_perm = """
            (() => {
                const links = Array.from(document.querySelectorAll('.talento-drawer-links a'));
                const link = links.find(l => l.innerText.includes('PERMANENT PLACEMENT'));
                if (link) link.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": click_mobile_perm})
            await asyncio.sleep(1.6)

            mobile_perm_check = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const drawerOpen = document.querySelector('.talento-mobile-drawer').classList.contains('open');
                    const el = document.getElementById('permanent-placement');
                    const header = document.querySelector('.talento-header');
                    const elRect = el.getBoundingClientRect();
                    const headerHeight = header.offsetHeight;
                    return {
                        drawerClosed: !drawerOpen,
                        headerHeight: headerHeight,
                        elTop: Math.round(elRect.top),
                        dist: Math.round(elRect.top - headerHeight),
                        visibleBelowHeader: elRect.top >= headerHeight - 5 && elRect.top <= headerHeight + 35
                    };
                })()
                """,
                "returnByValue": True
            })
            m_perm = mobile_perm_check["result"]["value"]
            record("Mobile Drawer click scrolls to Permanent Placement & closes drawer",
                   m_perm.get("drawerClosed", False) and m_perm.get("visibleBelowHeader", False),
                   f"DrawerClosed={m_perm.get('drawerClosed')}, HeaderHeight={m_perm.get('headerHeight')}px, SpaceBelowHeader={m_perm.get('dist')}px")

            # -------------------------------------------------------------
            # SUMMARY
            # -------------------------------------------------------------
            print("\n" + "=" * 80)
            print("TEST SUMMARY")
            print("=" * 80)
            total = len(results)
            passed_count = sum(1 for _, p, _ in results if p)
            failed_count = total - passed_count
            print(f"Total: {total} | Passed: {passed_count} | Failed: {failed_count}")
            for name, passed, details in results:
                status = "PASS" if passed else "FAIL"
                print(f"[{status}] {name}")
                if details:
                    print(f"       -> {details}")

            return failed_count == 0

    finally:
        proc.terminate()

if __name__ == "__main__":
    success = asyncio.run(run_tests())
    exit(0 if success else 1)
