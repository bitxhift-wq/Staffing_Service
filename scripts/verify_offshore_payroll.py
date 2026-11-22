import asyncio, json, urllib.request, websockets, base64, subprocess, os, time
from PIL import Image
import numpy as np

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9666
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify"
URL = "http://localhost:4173/"

async def verify():
    os.makedirs(USER_DATA, exist_ok=True)
    os.makedirs(r"C:\STAFFING\test-artifacts", exist_ok=True)
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--window-size=1024,576"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)
    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            mid = 0
            async def call(m, p=None):
                nonlocal mid
                mid += 1
                await ws.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get("id") == mid: return r.get("result", {})

            await call("Page.enable")

            # 1. Capture at 1024 x 576 (exact reference resolution)
            print("Capturing at 1024x576 (Reference Resolution)...")
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1024, "height": 576, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Page.navigate", {"url": URL})
            await asyncio.sleep(2)

            # Scroll dual section into view right below header instantly
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sec = document.querySelector('.talento-dual-section');
                    const headerHeight = document.querySelector('.talento-header')?.offsetHeight || 48;
                    const r = sec.getBoundingClientRect();
                    window.scrollTo({ top: window.scrollY + r.top - headerHeight, behavior: 'instant' });
                })()
                """
            })
            await asyncio.sleep(1.0)

            # Capture 1024x576 viewport
            ss_1024 = await call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\offshore_section_1024.png", "wb") as f:
                f.write(base64.b64decode(ss_1024["data"]))
            print("Saved: test-artifacts/offshore_section_1024.png")

            # Verify computed metrics
            metrics = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sec = document.querySelector('.talento-dual-section');
                    const leftCol = document.getElementById('offshore-teams');
                    const rightCol = document.getElementById('payroll-compliance');
                    const leftImg = leftCol.querySelector('.talento-half-img-wrap');
                    const rightImg = rightCol.querySelector('.talento-half-img-wrap');
                    const leftTitle = leftCol.querySelector('.talento-half-title');
                    const rightTitle = rightCol.querySelector('.talento-half-title');
                    const leftEyebrow = leftCol.querySelector('.talento-eyebrow');
                    const rightEyebrow = rightCol.querySelector('.talento-eyebrow');

                    return {
                        sectionBg: window.getComputedStyle(sec).backgroundColor,
                        leftColWidth: leftCol.offsetWidth,
                        rightColWidth: rightCol.offsetWidth,
                        leftImgWidth: leftImg.offsetWidth,
                        leftImgHeight: leftImg.offsetHeight,
                        rightImgWidth: rightImg.offsetWidth,
                        rightImgHeight: rightImg.offsetHeight,
                        leftImgClip: window.getComputedStyle(leftImg).clipPath,
                        rightImgClip: window.getComputedStyle(rightImg).clipPath,
                        leftEyebrowTop: leftEyebrow.getBoundingClientRect().top,
                        rightEyebrowTop: rightEyebrow.getBoundingClientRect().top,
                        leftTitleTop: leftTitle.getBoundingClientRect().top,
                        rightTitleTop: rightTitle.getBoundingClientRect().top,
                        leftTitleFont: window.getComputedStyle(leftTitle).fontFamily,
                        rightTitleFont: window.getComputedStyle(rightTitle).fontFamily,
                        leftTitleSize: window.getComputedStyle(leftTitle).fontSize,
                        rightTitleSize: window.getComputedStyle(rightTitle).fontSize,
                        checksCount: rightCol.querySelectorAll('.talento-payroll-list li').length
                    };
                })()
                """,
                "returnByValue": True
            })
            print("\nComputed Metrics at 1024x576:\n", json.dumps(metrics["result"]["value"], indent=2))

            # 2. Capture at 1440x900
            print("\nCapturing at 1440x900 (Standard Desktop)...")
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await asyncio.sleep(0.5)
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sec = document.querySelector('.talento-dual-section');
                    const headerHeight = document.querySelector('.talento-header')?.offsetHeight || 50;
                    const r = sec.getBoundingClientRect();
                    window.scrollTo({ top: window.scrollY + r.top - headerHeight, behavior: 'instant' });
                })()
                """
            })
            await asyncio.sleep(0.6)
            ss_1440 = await call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\offshore_section_1440.png", "wb") as f:
                f.write(base64.b64decode(ss_1440["data"]))
            print("Saved: test-artifacts/offshore_section_1440.png")

            # 3. Capture at Tablet (834x1112)
            print("\nCapturing at Tablet (834x1112)...")
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 834, "height": 1112, "deviceScaleFactor": 1, "mobile": False
            })
            await asyncio.sleep(0.5)
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sec = document.querySelector('.talento-dual-section');
                    const headerHeight = document.querySelector('.talento-header')?.offsetHeight || 50;
                    const r = sec.getBoundingClientRect();
                    window.scrollTo({ top: window.scrollY + r.top - headerHeight, behavior: 'instant' });
                })()
                """
            })
            await asyncio.sleep(0.6)
            ss_tablet = await call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\offshore_section_tablet.png", "wb") as f:
                f.write(base64.b64decode(ss_tablet["data"]))
            print("Saved: test-artifacts/offshore_section_tablet.png")

            # 4. Capture at Mobile (390x844)
            print("\nCapturing at Mobile (390x844)...")
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True
            })
            await asyncio.sleep(0.5)
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sec = document.querySelector('.talento-dual-section');
                    const headerHeight = document.querySelector('.talento-header')?.offsetHeight || 50;
                    const r = sec.getBoundingClientRect();
                    window.scrollTo({ top: window.scrollY + r.top - headerHeight, behavior: 'instant' });
                })()
                """
            })
            await asyncio.sleep(0.6)
            ss_mobile = await call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\offshore_section_mobile.png", "wb") as f:
                f.write(base64.b64decode(ss_mobile["data"]))
            print("Saved: test-artifacts/offshore_section_mobile.png")

    finally:
        proc.terminate()

    # Create visual comparisons with the reference image
    ref_path = r"C:\Users\mukhe\.gemini\antigravity\brain\bca84de3-c612-45ee-8f2f-0227fc1de503\.user_uploaded\media_1795255868162_2a84b5c2.jpg"
    if os.path.exists(ref_path):
        ref_im = Image.open(ref_path).convert("RGB")
        view_im = Image.open(r"C:\STAFFING\test-artifacts\offshore_section_1024.png").convert("RGB")
        
        # Stacked comparison
        stacked = Image.new("RGB", (1024, 576 * 2 + 10), (200, 200, 200))
        stacked.paste(ref_im, (0, 0))
        stacked.paste(view_im, (0, 586))
        stacked.save(r"C:\STAFFING\test-artifacts\comparison_stacked_1024.png")
        
        # Side-by-side comparison
        side = Image.new("RGB", (1024 * 2 + 10, 576), (200, 200, 200))
        side.paste(ref_im, (0, 0))
        side.paste(view_im, (1034, 0))
        side.save(r"C:\STAFFING\test-artifacts\comparison_side_by_side_1024.png")
        print("\nSaved visual comparisons: comparison_stacked_1024.png and comparison_side_by_side_1024.png")

if __name__ == "__main__":
    asyncio.run(verify())
