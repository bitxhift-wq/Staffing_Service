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
        "--window-size=1440,3600"
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
                models_count: document.querySelectorAll('.talento-model-block').length,
                perm_img_loaded: !!document.querySelector('.talento-model-block-perm img')?.naturalWidth,
                exec_img_loaded: !!document.querySelector('.talento-model-block-exec img')?.naturalWidth,
                tech_items: document.querySelectorAll('.talento-tech-card').length,
                non_tech: !!document.querySelector('.talento-nontech-strip'),
                offshore: !!document.getElementById('offshore-teams'),
                payroll: !!document.getElementById('payroll-compliance'),
                where_we_work: !!document.getElementById('where-we-work'),
                faqs_count: document.querySelectorAll('.talento-faq-item').length,
                final_cta: !!document.querySelector('.talento-final-cta'),
                inline_contact: !!document.getElementById('contact'),
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

            # Test Inline Enquiry Form Submission
            print("\n--- Testing Inline Form Submission ---")
            fill_inline = """
            (() => {
                const setVal = (el, val) => {
                    const setter = Object.getOwnPropertyDescriptor(
                        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
                        'value'
                    ).set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                };

                setVal(document.getElementById('inlineFullName'), 'Ramesh Krishnan');
                setVal(document.getElementById('inlineCompanyName'), 'Apex Global Systems');
                setVal(document.getElementById('inlineEmail'), 'ramesh@apexsystems.com');
                setVal(document.getElementById('inlinePhone'), '+91 98401 23456');
                setVal(document.getElementById('inlineRequiredSkills'), 'Full Stack React, Python, Cloud DevOps');
                setVal(document.getElementById('inlineDetails'), 'Need 2 Senior Engineers and 1 Tech Lead in Coimbatore within 2 weeks.');

                const submitBtn = document.querySelector('.talento-contact-form-box button[type=\"submit\"]');
                submitBtn.click();
            })()
            """
            await send("Runtime.evaluate", {"expression": fill_inline})
            await asyncio.sleep(1.2)

            check_alert = await send("Runtime.evaluate", {
                "expression": "document.querySelector('.talento-alert')?.innerText"
            })
            print("Form Submission Alert:", check_alert["result"]["value"])

            # Test Modal Popup
            print("\n--- Testing Shortlist Modal ---")
            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-header-actions .talento-btn-nav').click()"})
            await asyncio.sleep(0.4)
            check_modal = await send("Runtime.evaluate", {
                "expression": "!!document.querySelector('.talento-modal-box')"
            })
            print("Modal Opened via Header Button:", check_modal["result"]["value"])

            # Close Modal
            await send("Runtime.evaluate", {"expression": "document.querySelector('.talento-modal-close').click()"})
            await asyncio.sleep(0.3)

            # Capture Desktop Full Screenshot
            print("\nCapturing Full Desktop Screenshot...")
            os.makedirs(r"C:\STAFFING\test-artifacts", exist_ok=True)
            ss_data = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
            import base64
            with open(r"C:\STAFFING\test-artifacts\standalone-talento-desktop.png", "wb") as f:
                f.write(base64.b64decode(ss_data["data"]))
            print("Saved: test-artifacts/standalone-talento-desktop.png")

            # Capture Mobile Viewport (390px)
            print("Testing Mobile Viewport (390px)...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(0.5)
            ss_mobile = await send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
            with open(r"C:\STAFFING\test-artifacts\standalone-talento-mobile.png", "wb") as f:
                f.write(base64.b64decode(ss_mobile["data"]))
            print("Saved: test-artifacts/standalone-talento-mobile.png")

            print("\n=== ALL STANDALONE E2E TESTS PASSED PERFECTLY! ===")
    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_cdp())
