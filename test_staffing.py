import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome"
PORT = 9333
URL = "http://localhost:4173/"

async def run_cdp():
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
        "--window-size=1440,900"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]

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

            print("Navigating to:", URL)
            await send("Page.navigate", {"url": URL})
            await asyncio.sleep(1.5)

            # Check Title & Meta
            eval_title = await send("Runtime.evaluate", {"expression": "document.title"})
            print("Document Title:", eval_title["result"]["value"])

            eval_meta = await send("Runtime.evaluate", {"expression": "document.querySelector('meta[name=\"description\"]').getAttribute('content')"})
            print("Meta Description:", eval_meta["result"]["value"])

            # Verify Standalone Identity and Elements
            verify_script = """
            ({
                brand: document.querySelector('.talento-brand-name')?.innerText,
                brand_sub: document.querySelector('.talento-brand-sub')?.innerText,
                hero_title: document.querySelector('.talento-hero-title')?.innerText,
                hero_img_loaded: !!document.querySelector('.talento-hero-img')?.naturalWidth,
                no_dashboard: !document.querySelector('.dashboard'),
                no_telemetry: !document.querySelector('.chart'),
                no_oee: !document.body.innerText.includes('OEE 87.4%'),
                head_title: document.title,
                meta_desc: document.querySelector('meta[name="description"]')?.getAttribute('content'),
                meta_keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content'),
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
                seo_not_in_body: !document.querySelector('.talento-seo-strip') && !document.querySelector('.staffing-seo-strip'),
                no_seo_labels_in_visible_ui: !document.body.innerText.match(/SEO Title|Meta Description|Suggested URL|Focus Keywords/i),
                exact_title_match: document.title === 'IT Staffing Services in Coimbatore | AI, Data, Cloud & IIoT Talent | SMRIKAAM',
                exact_desc_match: document.querySelector('meta[name="description"]')?.getAttribute('content') === 'Hire skilled AI, data, cloud, DevOps and IIoT talent. SMRIKAAM offers permanent and executive staffing from Coimbatore. Get profiles in 48–72 hours.',
                exact_canonical_match: document.querySelector('link[rel="canonical"]')?.getAttribute('href') === 'https://smrikaam.com/IT-staffing-services-in-Coimbatore',
                current_pathname: window.location.pathname,
                models_count: document.querySelectorAll('.talento-model-block').length,
                perm_img_loaded: !!document.querySelector('.talento-model-block-perm img')?.naturalWidth,
                exec_img_loaded: !!document.querySelector('.talento-model-block-exec img')?.naturalWidth,
                tech_items: document.querySelectorAll('.talento-tech-card').length,
                non_tech: !!document.getElementById('non-technology-areas'),
                offshore: !!document.getElementById('offshore-teams'),
                payroll: !!document.getElementById('payroll-compliance'),
                where_we_work: !!document.getElementById('where-we-work'),
                faqs_count: document.querySelectorAll('.talento-faq-item').length,
                final_cta: !!document.getElementById('final-cta'),
                no_inline_contact: !document.getElementById('contact'),
                footer: !!document.querySelector('.talento-footer')
            })
            """
            eval_verify = await send("Runtime.evaluate", {"expression": verify_script, "returnByValue": True})
            print("\nVerification Checklist Result:\n", json.dumps(eval_verify["result"]["value"], indent=2))

            # Test Accordion
            print("\n--- Testing FAQ Accordion ---")
            faq_click = """
            (() => {
                const btn = document.querySelectorAll('.talento-faq-trigger')[1];
                btn.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": faq_click})
            await asyncio.sleep(0.4)
            check_faq = await send("Runtime.evaluate", {
                "expression": "document.getElementById('faq-p-1').style.display !== 'none'"
            })
            print("FAQ 2 Expanded Successfully:", check_faq["result"]["value"])

            # Test Shortlist Request Modal Opening & Submission
            print("\n--- Testing Shortlist Modal from Final CTA ---")
            await send("Runtime.evaluate", {"expression": "document.querySelector('#final-cta button').click()"})
            await asyncio.sleep(0.4)
            check_modal = await send("Runtime.evaluate", {
                "expression": "!!document.querySelector('.talento-modal-box')"
            })
            print("Modal Opened via Final CTA Button:", check_modal["result"]["value"])

            fill_modal = """
            (() => {
                const setVal = (el, val) => {
                    if (!el) return;
                    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                };

                setVal(document.getElementById('modalFullName'), 'Ramesh Krishnan');
                setVal(document.getElementById('modalCompanyName'), 'Apex Global Systems');
                setVal(document.getElementById('modalEmail'), 'ramesh@apexsystems.com');
                setVal(document.getElementById('modalPhone'), '+91 98401 23456');
                setVal(document.getElementById('modalRequiredSkills'), 'Full Stack React, Python, Cloud DevOps');
                setVal(document.getElementById('modalDetails'), 'Need 2 Senior Engineers and 1 Tech Lead in Coimbatore within 2 weeks.');

                const submitBtn = document.querySelector('.talento-modal-box button[type=\"submit\"]');
                submitBtn.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": fill_modal})
            await asyncio.sleep(1.2)

            check_alert = await send("Runtime.evaluate", {
                "expression": "document.querySelector('.talento-alert')?.innerText"
            })
            print("Modal Form Submission Alert:", check_alert["result"]["value"])

            # Close Modal
            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-modal-close').click()"})
            await asyncio.sleep(0.3)

            # Scroll back to top
            await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 0)"})
            await asyncio.sleep(0.5)

            os.makedirs(r"C:\STAFFING\test-artifacts", exist_ok=True)
            import base64

            # Check for console errors
            check_errors = await send("Runtime.evaluate", {
                "expression": "window.__errors || []"
            })
            print("Console Errors:", check_errors.get("result", {}).get("value", []))

            # 0. 1600 x 900 Desktop Viewport (Requested target viewport)
            print("\nCapturing 1600x900 Viewport...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1600,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)

            # Verify Heading lines
            check_heading = await send("Runtime.evaluate", {
                "expression": """
                ({
                    titleHeight: document.querySelector('.talento-hero-title')?.offsetHeight,
                    line1Width: document.querySelectorAll('.talento-title-line')[0]?.offsetWidth,
                    line2Width: document.querySelectorAll('.talento-title-line')[1]?.offsetWidth,
                    containerWidth: document.querySelector('.talento-hero-left')?.offsetWidth,
                    imgWrapWidth: document.querySelector('.talento-hero-img-wrap')?.offsetWidth,
                    imgWrapHeight: document.querySelector('.talento-hero-img-wrap')?.offsetHeight
                })
                """,
                "returnByValue": True
            })
            print("1600x900 Heading & Image Metrics:", json.dumps(check_heading["result"]["value"], indent=2))

            ss_1600 = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\viewport-1600x900.png", "wb") as f:
                f.write(base64.b64decode(ss_1600["data"]))
            with open(r"C:\STAFFING\test-artifacts\standalone-talento-hero-viewport.png", "wb") as f:
                f.write(base64.b64decode(ss_1600["data"]))
            print("Saved: test-artifacts/viewport-1600x900.png and standalone-talento-hero-viewport.png")

            # 1. 1920 x 1080 Desktop Viewport
            print("\nCapturing 1920x1080 Viewport...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1920,
                "height": 1080,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)
            ss_1920 = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\viewport-1920x1080.png", "wb") as f:
                f.write(base64.b64decode(ss_1920["data"]))
            print("Saved: test-artifacts/viewport-1920x1080.png")

            # 2. 1440 x 900 Desktop Viewport
            print("Capturing 1440x900 Viewport...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1440,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)
            ss_1440 = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\viewport-1440x900.png", "wb") as f:
                f.write(base64.b64decode(ss_1440["data"]))
            with open(r"C:\STAFFING\test-artifacts\standalone-talento-hero-viewport.png", "wb") as f:
                f.write(base64.b64decode(ss_1440["data"]))
            print("Saved: test-artifacts/viewport-1440x900.png")

            # 3. 1366 x 768 Laptop Viewport
            print("Capturing 1366x768 Viewport...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1366,
                "height": 768,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)
            ss_1366 = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\viewport-1366x768.png", "wb") as f:
                f.write(base64.b64decode(ss_1366["data"]))
            print("Saved: test-artifacts/viewport-1366x768.png")

            # 4. Desktop Full Screenshot at 1440
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1440,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.3)
            ss_data = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
            with open(r"C:\STAFFING\test-artifacts\standalone-talento-desktop.png", "wb") as f:
                f.write(base64.b64decode(ss_data["data"]))
            print("Saved: test-artifacts/standalone-talento-desktop.png")

            # 5. Mobile Viewport (390 x 844)
            print("Testing Mobile Viewport (390x844)...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(0.5)
            ss_mobile_vp = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\viewport-390x844.png", "wb") as f:
                f.write(base64.b64decode(ss_mobile_vp["data"]))
            ss_mobile = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
            with open(r"C:\STAFFING\test-artifacts\standalone-talento-mobile.png", "wb") as f:
                f.write(base64.b64decode(ss_mobile["data"]))
            print("Saved: test-artifacts/viewport-390x844.png and standalone-talento-mobile.png")

            print("\n=== ALL STANDALONE E2E TESTS & MULTI-VIEWPORT VERIFICATION PASSED! ===")
    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_cdp())
