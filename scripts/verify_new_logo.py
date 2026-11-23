import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify-newlogo"
CDP_PORT = 9788
TARGET_URL = "http://localhost:4173"

async def test_new_logo():
    os.makedirs(USER_DATA, exist_ok=True)
    os.makedirs(r"C:\STAFFING\test-artifacts", exist_ok=True)
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
            pending_responses = {}
            network_responses = []

            async def listener():
                try:
                    while True:
                        raw = await ws.recv()
                        msg = json.loads(raw)
                        if "id" in msg:
                            fut = pending_responses.pop(msg["id"], None)
                            if fut and not fut.done():
                                fut.set_result(msg.get("result"))
                        elif msg.get("method") == "Network.responseReceived":
                            resp_data = msg["params"]["response"]
                            network_responses.append({
                                "url": resp_data.get("url"),
                                "status": resp_data.get("status"),
                                "mimeType": resp_data.get("mimeType"),
                                "headers": resp_data.get("headers")
                            })
                except asyncio.CancelledError:
                    pass
                except Exception:
                    pass

            listener_task = asyncio.create_task(listener())

            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                curr_id = msg_id
                fut = asyncio.get_running_loop().create_future()
                pending_responses[curr_id] = fut
                payload = {"id": curr_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                return await fut

            await send("Page.enable")
            await send("Runtime.enable")
            await send("Network.enable")
            await send("Network.clearBrowserCache")
            await send("Network.setCacheDisabled", {"cacheDisabled": True})

            # Navigate to page
            print(f"Navigating to {TARGET_URL}...")
            await send("Page.navigate", {"url": TARGET_URL})
            await asyncio.sleep(2.5)

            # Check network responses for logo
            print("\n--- 1. NETWORK REQUEST CHECK ---")
            logo_responses = [r for r in network_responses if "AppliedMerit_Logo_Transparent" in r["url"]]
            for lr in logo_responses:
                print(f"  URL: {lr['url']}")
                print(f"  Status: {lr['status']} (Expected: 200)")
                print(f"  MimeType: {lr['mimeType']} (Expected: image/png)")
            
            assert len(logo_responses) > 0, f"No logo network responses found! Captured: {[r['url'] for r in network_responses]}"
            assert logo_responses[0]["status"] == 200, f"Status was {logo_responses[0]['status']}"
            assert "image" in logo_responses[0]["mimeType"], f"MIME type was {logo_responses[0]['mimeType']}"
            print("  -> NETWORK CHECK: PASS (HTTP 200 image/png verified)")

            # Check Desktop DOM
            print("\n--- 2. DESKTOP DOM & ALIGNMENT CHECK ---")
            eval_res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const header = document.querySelector('.talento-header') || document.querySelector('header');
                    const img = document.querySelector('.header-brand-logo');
                    const brand = document.querySelector('.talento-brand');
                    const divider = document.querySelector('.talento-header-divider');
                    const nav = document.querySelector('.talento-nav');
                    if (!img || !header || !brand) return { error: 'elements not found' };

                    const headerRect = header.getBoundingClientRect();
                    const brandRect = brand.getBoundingClientRect();
                    const imgRect = img.getBoundingClientRect();
                    const dividerRect = divider ? divider.getBoundingClientRect() : null;
                    const navRect = nav ? nav.getBoundingClientRect() : null;

                    const headerCenterY = headerRect.top + headerRect.height / 2;
                    const imgCenterY = imgRect.top + imgRect.height / 2;
                    const centerOffset = Math.abs(headerCenterY - imgCenterY);

                    return {
                        src: img.src,
                        alt: img.alt,
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        brandWidth: brandRect.width,
                        brandHeight: brandRect.height,
                        imgWidth: imgRect.width,
                        imgHeight: imgRect.height,
                        headerHeight: headerRect.height,
                        centerOffset: centerOffset,
                        isClipped: imgRect.top < headerRect.top || imgRect.bottom > headerRect.bottom,
                        noOverlapWithDivider: dividerRect ? brandRect.right <= dividerRect.left : true,
                        noOverlapWithNav: navRect ? brandRect.right < navRect.left : true
                    };
                })()
                """,
                "returnByValue": True
            })
            desktop_data = eval_res.get("result", {}).get("value") if "result" in eval_res else eval_res.get("value")
            print("Desktop DOM Data:", json.dumps(desktop_data, indent=2))
            assert desktop_data.get("complete") is True, "Image decoding failed (complete=False)"
            assert desktop_data.get("naturalWidth") in [1851, 2048], f"Expected naturalWidth 1851 or 2048, got {desktop_data.get('naturalWidth')}"
            assert desktop_data.get("naturalHeight") in [346, 682], f"Expected naturalHeight 346 or 682, got {desktop_data.get('naturalHeight')}"
            assert desktop_data.get("alt") == "APPLIED MERIT — POWERED BY SMRIKAAM", f"Alt mismatch: {desktop_data.get('alt')}"
            assert desktop_data.get("isClipped") is False, "Image overflows header!"
            assert desktop_data.get("noOverlapWithDivider") is True, "Logo overlaps header divider!"
            assert desktop_data.get("noOverlapWithNav") is True, "Logo overlaps nav!"
            print("  -> DESKTOP DOM CHECK: PASS")

            # Capture Desktop Header Screenshot (clip to header area: 1440 x 120)
            desktop_clip = await send("Page.captureScreenshot", {
                "format": "png",
                "clip": {"x": 0, "y": 0, "width": 1440, "height": 100, "scale": 1}
            })
            with open(r"C:\STAFFING\test-artifacts\navbar-desktop-newlogo.png", "wb") as f:
                f.write(base64.b64decode(desktop_clip["data"]))
            print("Desktop header screenshot saved: test-artifacts/navbar-desktop-newlogo.png")

            # Emulate Mobile Viewport (iPhone X: 375x812)
            print("\n--- 3. MOBILE RESPONSIVE CHECK ---")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 375,
                "height": 812,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(1.0)

            eval_res_mob = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const header = document.querySelector('.talento-header') || document.querySelector('header');
                    const img = document.querySelector('.header-brand-logo');
                    const brand = document.querySelector('.talento-brand');
                    const menuBtn = document.querySelector('.talento-menu-btn');
                    if (!img || !header || !brand) return { error: 'elements not found' };

                    const headerRect = header.getBoundingClientRect();
                    const brandRect = brand.getBoundingClientRect();
                    const imgRect = img.getBoundingClientRect();
                    const menuBtnRect = menuBtn ? menuBtn.getBoundingClientRect() : null;

                    const headerCenterY = headerRect.top + headerRect.height / 2;
                    const imgCenterY = imgRect.top + imgRect.height / 2;
                    const centerOffset = Math.abs(headerCenterY - imgCenterY);

                    return {
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        brandWidth: brandRect.width,
                        brandHeight: brandRect.height,
                        imgWidth: imgRect.width,
                        imgHeight: imgRect.height,
                        headerHeight: headerRect.height,
                        centerOffset: centerOffset,
                        isClipped: imgRect.top < headerRect.top || imgRect.bottom > headerRect.bottom,
                        withinViewport: imgRect.right <= window.innerWidth,
                        noOverlapWithMenuBtn: menuBtnRect ? brandRect.right < menuBtnRect.left : true
                    };
                })()
                """,
                "returnByValue": True
            })
            mobile_data = eval_res_mob.get("result", {}).get("value") if "result" in eval_res_mob else eval_res_mob.get("value")
            print("Mobile DOM Data:", json.dumps(mobile_data, indent=2))
            assert mobile_data.get("complete") is True, "Mobile image decoding failed"
            assert mobile_data.get("isClipped") is False, "Mobile logo is clipped!"
            assert mobile_data.get("withinViewport") is True, "Mobile logo overflows viewport!"
            assert mobile_data.get("noOverlapWithMenuBtn") is True, "Mobile logo overlaps mobile menu button!"
            print("  -> MOBILE CHECK: PASS")

            # Capture Mobile Header Screenshot (clip to header: 375 x 90)
            mobile_clip = await send("Page.captureScreenshot", {
                "format": "png",
                "clip": {"x": 0, "y": 0, "width": 375, "height": 90, "scale": 2}
            })
            with open(r"C:\STAFFING\test-artifacts\navbar-mobile-newlogo.png", "wb") as f:
                f.write(base64.b64decode(mobile_clip["data"]))
            print("Mobile header screenshot saved: test-artifacts/navbar-mobile-newlogo.png")

            listener_task.cancel()
            print("\nALL VERIFICATIONS PASSED 100% SUCCESSFULLY!")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_new_logo())
