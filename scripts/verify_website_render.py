import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64
from PIL import Image
import numpy as np

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify-appliedmerit"
CDP_PORT = 9899
TARGET_URL = "http://localhost:4173"
TEST_ARTIFACTS = r"C:\STAFFING\test-artifacts"

VIEWPORTS = [
    {"name": "desktop-1440", "width": 1440, "height": 900, "is_mobile": False},
    {"name": "desktop-1920", "width": 1920, "height": 1080, "is_mobile": False},
    {"name": "tablet-768", "width": 768, "height": 1024, "is_mobile": True},
    {"name": "mobile-390", "width": 390, "height": 844, "is_mobile": True},
    {"name": "mobile-360", "width": 360, "height": 740, "is_mobile": True},
]

async def verify_site():
    os.makedirs(USER_DATA, exist_ok=True)
    os.makedirs(TEST_ARTIFACTS, exist_ok=True)

    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={CDP_PORT}",
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
        res = urllib.request.urlopen(f"http://localhost:{CDP_PORT}/json")
        targets = json.loads(res.read().decode())
        page_targets = [t for t in targets if t.get("type") == "page"]
        ws_url = page_targets[0]["webSocketDebuggerUrl"] if page_targets else targets[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            msg_id = 0
            pending = {}
            network_events = []

            async def listener():
                try:
                    while True:
                        raw = await ws.recv()
                        msg = json.loads(raw)
                        if "id" in msg:
                            fut = pending.pop(msg["id"], None)
                            if fut and not fut.done():
                                fut.set_result(msg.get("result"))
                        elif msg.get("method") == "Network.responseReceived":
                            network_events.append(msg["params"]["response"])
                except Exception:
                    pass

            asyncio.create_task(listener())

            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                curr_id = msg_id
                fut = asyncio.get_running_loop().create_future()
                pending[curr_id] = fut
                await ws.send(json.dumps({"id": curr_id, "method": method, "params": params or {}}))
                return await fut

            await send("Page.enable")
            await send("Runtime.enable")
            await send("Network.enable")
            await send("Network.setCacheDisabled", {"cacheDisabled": True})

            print("\n1. NAVIGATING TO", TARGET_URL)
            await send("Page.navigate", {"url": TARGET_URL})
            await asyncio.sleep(2.5)

            # Check network responses for logo
            print("\n2. NETWORK REQUESTS CHECK:")
            logo_reqs = [r for r in network_events if "AppliedMerit" in r.get("url", "")]
            for lr in logo_reqs:
                print(f"  URL: {lr.get('url')} - Status: {lr.get('status')} - Mime: {lr.get('mimeType')}")
            assert len(logo_reqs) > 0, "No AppliedMerit logo requests detected!"
            assert logo_reqs[0].get("status") == 200, f"Logo HTTP status was {logo_reqs[0].get('status')}"
            print("  -> NETWORK CHECK: PASS (HTTP 200 SVG)")

            # Check DOM elements
            print("\n3. DOM INSPECTION:")
            eval_res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const headerLogo = document.querySelector('.header-brand-logo');
                    const footerLogo = document.querySelector('.footer-brand-logo');
                    const title = document.title;
                    const metaDesc = document.querySelector('meta[name="description"]')?.content;
                    const metaAuthor = document.querySelector('meta[name="author"]')?.content;
                    
                    const headerRect = headerLogo?.getBoundingClientRect();
                    const footerRect = footerLogo?.getBoundingClientRect();
                    
                    return {
                        title,
                        metaDesc,
                        metaAuthor,
                        headerLogo: {
                            src: headerLogo?.src,
                            alt: headerLogo?.alt,
                            naturalWidth: headerLogo?.naturalWidth,
                            naturalHeight: headerLogo?.naturalHeight,
                            width: headerRect?.width,
                            height: headerRect?.height,
                            complete: headerLogo?.complete
                        },
                        footerLogo: {
                            src: footerLogo?.src,
                            alt: footerLogo?.alt,
                            naturalWidth: footerLogo?.naturalWidth,
                            naturalHeight: footerLogo?.naturalHeight,
                            width: footerRect?.width,
                            height: footerRect?.height,
                            complete: footerLogo?.complete
                        }
                    };
                })()
                """,
                "returnByValue": True
            })

            data = eval_res.get("result", {}).get("value") if "result" in eval_res else eval_res.get("value", {})
            print("  Page Title:", data.get("title"))
            print("  Meta Author:", data.get("metaAuthor"))
            print("  Header Logo Src:", data.get("headerLogo", {}).get("src"))
            print("  Header Logo Alt:", data.get("headerLogo", {}).get("alt"))
            print("  Header Logo Display Size:", f"{data.get('headerLogo', {}).get('width')} x {data.get('headerLogo', {}).get('height')}")
            print("  Header Logo Complete:", data.get("headerLogo", {}).get("complete"))
            print("  Footer Logo Alt:", data.get("footerLogo", {}).get("alt"))

            assert "SMRIKAAM" in data.get("title"), "Page title missing SMRIKAAM!"
            assert data.get("metaAuthor") == "APPLIED MERIT — POWERED BY SMRIKAAM", "Meta author incorrect!"
            assert data.get("headerLogo", {}).get("alt") == "APPLIED MERIT — POWERED BY SMRIKAAM", "Header logo alt incorrect!"
            assert data.get("footerLogo", {}).get("alt") == "APPLIED MERIT — POWERED BY SMRIKAAM", "Footer logo alt incorrect!"
            assert "AppliedMerit_Logo_Transparent.svg" in data.get("headerLogo", {}).get("src"), "Header logo src incorrect!"
            assert data.get("headerLogo", {}).get("complete") == True, "Header logo failed to complete load!"
            print("  -> DOM & METADATA CHECK: PASS")

            # Check viewports and capture screenshots
            print("\n4. RESPONSIVE VIEWPORT TESTING & SCREENSHOTS:")
            for vp in VIEWPORTS:
                await send("Emulation.setDeviceMetricsOverride", {
                    "width": vp["width"],
                    "height": vp["height"],
                    "deviceScaleFactor": 1,
                    "mobile": vp["is_mobile"]
                })
                await asyncio.sleep(0.8)

                # Capture full screenshot
                shot = await send("Page.captureScreenshot", {"format": "png"})
                shot_bytes = base64.b64decode(shot["data"])
                shot_file = os.path.join(TEST_ARTIFACTS, f"rendered_{vp['name']}.png")
                with open(shot_file, "wb") as f:
                    f.write(shot_bytes)

                # Get logo element bounding box in this viewport
                box_eval = await send("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const el = document.querySelector('.header-brand-logo');
                        const r = el.getBoundingClientRect();
                        return { x: r.x, y: r.y, width: r.width, height: r.height };
                    })()
                    """,
                    "returnByValue": True
                })
                b = box_eval.get("result", {}).get("value") if "result" in box_eval else box_eval.get("value", {})
                print(f"  Viewport {vp['name']} ({vp['width']}x{vp['height']}): Logo displayed at {b.get('width'):.1f}x{b.get('height'):.1f} at (x={b.get('x'):.1f}, y={b.get('y'):.1f})")
                assert b.get("width") > 80 and b.get("height") > 15, f"Logo too small or missing in {vp['name']}!"

                # Crop logo from screenshot to verify sharpness
                im_full = Image.open(shot_file)
                lx, ly, lw, lh = int(b["x"]), int(b["y"]), int(b["width"]), int(b["height"])
                crop = im_full.crop((max(0, lx - 4), max(0, ly - 4), min(vp["width"], lx + lw + 4), min(vp["height"], ly + lh + 4)))
                crop_path = os.path.join(TEST_ARTIFACTS, f"crop_logo_{vp['name']}.png")
                crop.save(crop_path)

                arr_crop = np.array(crop.convert("L"))
                contrast = np.max(arr_crop) - np.min(arr_crop)
                print(f"    Crop saved: {crop_path} (Contrast: {contrast})")
                assert contrast > 180, f"Contrast too low in {vp['name']}!"

            print("\n==================================================")
            print("ALL WEBSITE RENDER VERIFICATIONS PASSED 100%!")
            print("==================================================")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(verify_site())
