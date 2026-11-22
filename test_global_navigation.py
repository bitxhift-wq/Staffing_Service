import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-nav"
PORT = 9444
BASE_URL = "http://localhost:4173"

async def run_nav_tests():
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

            print("=" * 70)
            print("SMRIKAAM TALENTO – GLOBAL NAVIGATION & PAGE ALIGNMENT VERIFICATION")
            print("=" * 70)

            results = []
            def record(step_name, passed, details=""):
                status = "PASS" if passed else "FAIL"
                results.append((step_name, passed, details))
                print(f"[{status}] {step_name}")
                if details:
                    print(f"       -> {details}")

            # -------------------------------------------------------------
            # STEP 1: Open Homepage
            # -------------------------------------------------------------
            print("\n1. Navigating to Homepage:", BASE_URL + "/")
            await send("Page.navigate", {"url": BASE_URL + "/"})
            await asyncio.sleep(1.5)

            home_eval = await send("Runtime.evaluate", {
                "expression": "({ path: window.location.pathname, scrollY: window.scrollY, title: document.title })",
                "returnByValue": True
            })
            val = home_eval["result"]["value"]
            record("1. Open Homepage", val["scrollY"] == 0, f"Path: {val['path']}, ScrollY: {val['scrollY']}")

            # -------------------------------------------------------------
            # STEP 2: Scroll to Bottom of Homepage
            # -------------------------------------------------------------
            print("\n2. Scrolling to Bottom of Homepage...")
            await send("Runtime.evaluate", {"expression": "window.scrollTo(0, document.body.scrollHeight)"})
            await asyncio.sleep(0.5)

            scroll_down_eval = await send("Runtime.evaluate", {
                "expression": "window.scrollY",
                "returnByValue": True
            })
            scrollY_down = scroll_down_eval["result"]["value"]
            record("2. Scroll to Bottom", scrollY_down > 2000, f"Current scrollY: {scrollY_down}")

            # -------------------------------------------------------------
            # STEP 3 & 4: Click 'STAFFING MODELS' in Navbar -> Starts at Top
            # -------------------------------------------------------------
            print("\n3 & 4. Clicking 'STAFFING MODELS' from Bottom of Homepage...")
            click_models = """
            (() => {
                const links = Array.from(document.querySelectorAll('.talento-nav a'));
                const target = links.find(l => l.innerText.includes('STAFFING MODELS'));
                if (target) target.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": click_models})
            await asyncio.sleep(0.8)

            check_models = await send("Runtime.evaluate", {
                "expression": """
                ({
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    headerTop: document.querySelector('.talento-header')?.getBoundingClientRect().top,
                    headerHeight: document.querySelector('.talento-header')?.offsetHeight,
                    contentTop: document.querySelector('.talento-models-section')?.getBoundingClientRect().top,
                    isActive: document.querySelector('.talento-nav a.active')?.innerText
                })
                """,
                "returnByValue": True
            })
            m_val = check_models["result"]["value"]
            models_passed = (m_val["path"] == "/staffing-models" and m_val["scrollY"] == 0 and 
                             m_val["headerTop"] == 0 and abs(m_val["contentTop"] - m_val["headerHeight"]) < 1.0)
            record("3 & 4. Staffing Models Navigation & Top Position", models_passed,
                   f"Path: {m_val['path']}, ScrollY: {m_val['scrollY']}, ContentTop: {m_val['contentTop']}px (starts directly below navbar), Active: '{m_val['isActive']}'")

            # -------------------------------------------------------------
            # STEP 5 & 6: Click 'EXECUTIVE SEARCH' -> Verify Positioned at Top
            # -------------------------------------------------------------
            print("\n5 & 6. Clicking 'EXECUTIVE SEARCH' from Navbar...")
            # Scroll down first to test scroll reset
            await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 1200)"})
            await asyncio.sleep(0.3)

            click_exec = """
            (() => {
                const links = Array.from(document.querySelectorAll('.talento-nav a'));
                const target = links.find(l => l.innerText.includes('EXECUTIVE SEARCH'));
                if (target) target.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": click_exec})
            await asyncio.sleep(0.8)

            check_exec = await send("Runtime.evaluate", {
                "expression": """
                ({
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    headerTop: document.querySelector('.talento-header')?.getBoundingClientRect().top,
                    headerHeight: document.querySelector('.talento-header')?.offsetHeight,
                    pageTop: document.querySelector('.talento-models-section')?.getBoundingClientRect().top,
                    hasExec: !!document.getElementById('executive-search'),
                    hasPerm: !!document.getElementById('permanent-placement'),
                    hasHero: !!document.getElementById('hero'),
                    isActive: document.querySelector('.talento-nav a.active')?.innerText
                })
                """,
                "returnByValue": True
            })
            e_val = check_exec["result"]["value"]
            exec_passed = (e_val["path"] == "/executive-search" and e_val["scrollY"] == 0 and
                           e_val["hasExec"] and not e_val["hasPerm"] and not e_val["hasHero"] and
                           abs(e_val["pageTop"] - e_val["headerHeight"]) < 1.0)
            record("5 & 6. Executive Search Navigation & Isolation", exec_passed,
                   f"Path: {e_val['path']}, ScrollY: {e_val['scrollY']}, PageTop: {e_val['pageTop']}px, Isolated: {not e_val['hasHero'] and not e_val['hasPerm']}, Active: '{e_val['isActive']}'")

            # -------------------------------------------------------------
            # STEP 7: Repeat for EVERY Navbar Item
            # -------------------------------------------------------------
            navbar_tests = [
                ("PERMANENT PLACEMENT", "/permanent-placement", ".talento-models-section"),
                ("PRACTICE AREAS", "/practice-areas", "#practice-areas"),
                ("OFFSHORE TEAMS", "/offshore-teams", ".talento-dedicated-section"),
                ("PAYROLL", "/payroll", ".talento-dedicated-section"),
                ("LOCATIONS", "/locations", "#where-we-work"),
                ("FAQ", "/faq", "#faq"),
                ("CONTACT", "/contact", "#contact"),
            ]

            print("\n7. Testing Navigation for all remaining Navbar items...")
            for label, expected_path, expected_selector in navbar_tests:
                # Scroll down first to confirm scroll reset on every route change
                await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 1000)"})
                await asyncio.sleep(0.2)

                click_code = f"""
                (() => {{
                    const links = Array.from(document.querySelectorAll('.talento-nav a'));
                    const target = links.find(l => l.innerText.trim() === '{label}');
                    if (target) target.click();
                }})()
                """
                await send("Runtime.evaluate", {"expression": click_code})
                await asyncio.sleep(0.8)

                eval_code = f"""
                ({{
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    headerHeight: document.querySelector('.talento-header')?.offsetHeight,
                    sectionTop: document.querySelector('{expected_selector}')?.getBoundingClientRect().top,
                    activeLabel: document.querySelector('.talento-nav a.active')?.innerText?.trim()
                }})
                """
                check_item = await send("Runtime.evaluate", {"expression": eval_code, "returnByValue": True})
                res_val = check_item["result"]["value"]
                passed = (res_val["path"] == expected_path and res_val["scrollY"] == 0 and
                          res_val["activeLabel"] == label and abs(res_val["sectionTop"] - res_val["headerHeight"]) < 1.0)
                record(f"Navbar -> {label}", passed,
                       f"Path: {res_val['path']}, ScrollY: {res_val['scrollY']}, Starts below navbar: {abs(res_val['sectionTop'] - res_val['headerHeight']) < 1.0} ({res_val['sectionTop']}px), Active: '{res_val['activeLabel']}'")

            # Test Request Shortlist Button
            print("\nTesting 'REQUEST SHORTLIST' Navbar Action...")
            await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 1000)"})
            await asyncio.sleep(0.2)

            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-header-actions .talento-btn-nav').click()"})
            await asyncio.sleep(0.8)

            check_shortlist = await send("Runtime.evaluate", {
                "expression": """
                ({
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    headerHeight: document.querySelector('.talento-header')?.offsetHeight,
                    sectionTop: document.querySelector('.talento-dedicated-section')?.getBoundingClientRect().top,
                    isActive: document.querySelector('.talento-header-actions .talento-btn-nav').classList.contains('is-active')
                })
                """,
                "returnByValue": True
            })
            s_val = check_shortlist["result"]["value"]
            s_passed = s_val["path"] == "/request-shortlist" and s_val["scrollY"] == 0 and s_val["isActive"]
            record("Navbar -> REQUEST SHORTLIST", s_passed,
                   f"Path: {s_val['path']}, ScrollY: {s_val['scrollY']}, IsActive: {s_val['isActive']}")

            # Close modal if open
            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-modal-close')?.click()"})
            await asyncio.sleep(0.3)

            # -------------------------------------------------------------
            # STEP 8: Test Browser Back & Forward Navigation
            # -------------------------------------------------------------
            print("\n8. Testing Browser Back and Forward Navigation...")
            # Scroll down on current page
            await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 800)"})
            await asyncio.sleep(0.3)

            # Navigate Back
            print("Going Back in History...")
            await send("Runtime.evaluate", {"expression": "window.history.back()"})
            await asyncio.sleep(0.8)

            back_eval = await send("Runtime.evaluate", {
                "expression": "({ path: window.location.pathname, scrollY: window.scrollY })",
                "returnByValue": True
            })
            b_val = back_eval["result"]["value"]
            record("8a. Browser Back Scroll Reset", b_val["scrollY"] == 0,
                   f"Path: {b_val['path']}, ScrollY: {b_val['scrollY']}")

            # Navigate Forward
            print("Going Forward in History...")
            await send("Runtime.evaluate", {"expression": "window.history.forward()"})
            await asyncio.sleep(0.8)

            fwd_eval = await send("Runtime.evaluate", {
                "expression": "({ path: window.location.pathname, scrollY: window.scrollY })",
                "returnByValue": True
            })
            f_val = fwd_eval["result"]["value"]
            record("8b. Browser Forward Scroll Reset", f_val["scrollY"] == 0,
                   f"Path: {f_val['path']}, ScrollY: {f_val['scrollY']}")

            # -------------------------------------------------------------
            # STEP 9: Test Direct URL Entry and Browser Refresh
            # -------------------------------------------------------------
            print("\n9. Testing Direct URL Entry and Browser Refresh...")
            direct_url = BASE_URL + "/executive-search"
            await send("Page.navigate", {"url": direct_url})
            await asyncio.sleep(1.2)

            direct_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    hasExecH1: !!document.querySelector('.talento-model-name'),
                    activeNav: document.querySelector('.talento-nav a.active')?.innerText?.trim()
                })
                """,
                "returnByValue": True
            })
            d_val = direct_eval["result"]["value"]
            record("9a. Direct URL Entry (/executive-search)", d_val["path"] == "/executive-search" and d_val["scrollY"] == 0 and d_val["activeNav"] == "EXECUTIVE SEARCH",
                   f"Path: {d_val['path']}, ScrollY: {d_val['scrollY']}, ActiveNav: '{d_val['activeNav']}'")

            # Scroll down and refresh
            await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 500)"})
            await asyncio.sleep(0.2)
            print("Refreshing Browser on /executive-search...")
            await send("Page.reload")
            await asyncio.sleep(1.5)

            refresh_eval = await send("Runtime.evaluate", {
                "expression": "({ path: window.location.pathname, scrollY: window.scrollY })",
                "returnByValue": True
            })
            r_val = refresh_eval["result"]["value"]
            record("9b. Browser Refresh Scroll Position Reset", r_val["scrollY"] == 0,
                   f"Path: {r_val['path']}, ScrollY: {r_val['scrollY']}")

            # -------------------------------------------------------------
            # STEP 10: Repeat on Mobile & Tablet
            # -------------------------------------------------------------
            print("\n10. Testing Mobile (390x844) Navigation & Drawer...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(0.5)

            # Navigate to home on mobile
            await send("Page.navigate", {"url": BASE_URL + "/"})
            await asyncio.sleep(1.0)

            # Open Mobile Drawer
            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-menu-btn').click()"})
            await asyncio.sleep(0.5)

            drawer_open = await send("Runtime.evaluate", {
                "expression": "document.querySelector('.talento-mobile-drawer').classList.contains('open')"
            })
            print("Mobile Drawer Opened:", drawer_open["result"]["value"])

            # Click '04 EXECUTIVE SEARCH' in mobile drawer
            click_mobile_link = """
            (() => {
                const links = Array.from(document.querySelectorAll('.talento-drawer-links a'));
                const target = links.find(l => l.innerText.includes('EXECUTIVE SEARCH'));
                if (target) target.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": click_mobile_link})
            await asyncio.sleep(0.8)

            mobile_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    drawerClosed: !document.querySelector('.talento-mobile-drawer').classList.contains('open'),
                    headerHeight: document.querySelector('.talento-header')?.offsetHeight,
                    sectionTop: document.querySelector('.talento-models-section')?.getBoundingClientRect().top
                })
                """,
                "returnByValue": True
            })
            mob_val = mobile_eval["result"]["value"]
            mob_passed = (mob_val["path"] == "/executive-search" and mob_val["scrollY"] == 0 and
                          mob_val["drawerClosed"] and abs(mob_val["sectionTop"] - mob_val["headerHeight"]) < 1.0)
            record("10a. Mobile Drawer Navigation & Alignment", mob_passed,
                   f"Path: {mob_val['path']}, ScrollY: {mob_val['scrollY']}, DrawerClosed: {mob_val['drawerClosed']}, Starts below header: {abs(mob_val['sectionTop'] - mob_val['headerHeight']) < 1.0} ({mob_val['sectionTop']}px)")

            # Test Tablet (768x1024)
            print("\nTesting Tablet (768x1024) Alignment...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 768,
                "height": 1024,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)

            await send("Page.navigate", {"url": BASE_URL + "/payroll"})
            await asyncio.sleep(1.0)

            tablet_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    path: window.location.pathname,
                    scrollY: window.scrollY,
                    headerHeight: document.querySelector('.talento-header')?.offsetHeight,
                    sectionTop: document.querySelector('.talento-dedicated-section')?.getBoundingClientRect().top
                })
                """,
                "returnByValue": True
            })
            tab_val = tablet_eval["result"]["value"]
            tab_passed = (tab_val["path"] == "/payroll" and tab_val["scrollY"] == 0 and
                          abs(tab_val["sectionTop"] - tab_val["headerHeight"]) < 1.0)
            record("10b. Tablet Viewport Alignment & Position", tab_passed,
                   f"Path: {tab_val['path']}, ScrollY: {tab_val['scrollY']}, Starts below header: {abs(tab_val['sectionTop'] - tab_val['headerHeight']) < 1.0} ({tab_val['sectionTop']}px)")

            print("=" * 70)
            passed_count = sum(1 for _, p, _ in results if p)
            total_count = len(results)
            print(f"SUMMARY: {passed_count}/{total_count} NAVIGATION TESTS PASSED")
            print("=" * 70)
            return passed_count == total_count
    finally:
        proc.terminate()

if __name__ == "__main__":
    success = asyncio.run(run_nav_tests())
    exit(0 if success else 1)
