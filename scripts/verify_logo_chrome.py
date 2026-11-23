import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify-logo"
CDP_PORT = 9777
TARGET_URL = "http://localhost:4173"

async def test_logo():
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

            # Navigate to page
            print(f"Navigating to {TARGET_URL}...")
            await send("Page.navigate", {"url": TARGET_URL})
            await asyncio.sleep(2.5)

            # Check network responses for logo
            print("\n--- 1. NETWORK REQUEST CHECK ---")
            logo_responses = [r for r in network_responses if "AppliedMerit" in r["url"] or "Logo" in r["url"] or "logo" in r["url"]]
            for lr in logo_responses:
                print(f"  URL: {lr['url']}")
                print(f"  Status: {lr['status']} (Expected: 200)")
                print(f"  MimeType: {lr['mimeType']} (Expected: image/png)")
            
            assert len(logo_responses) > 0, "No logo image network request captured!"
            assert logo_responses[0]["status"] == 200, f"Logo response status is {logo_responses[0]['status']}, expected 200"
            assert "image" in logo_responses[0]["mimeType"], f"Logo mimeType is {logo_responses[0]['mimeType']}, expected image/png"
            print("  -> NETWORK CHECK: PASS (HTTP 200 image/png confirmed)")

            # Evaluate DOM properties on Desktop
            print("\n--- 2. DESKTOP DOM & COMPUTED STYLES CHECK ---")
            eval_res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const header = document.querySelector('.site-header') || document.querySelector('header');
                    const img = document.querySelector('.header-brand-logo');
                    const link = document.querySelector('.talento-brand');
                    if (!img || !header) return { error: 'img or header not found' };
                    
                    const headerRect = header.getBoundingClientRect();
                    const imgRect = img.getBoundingClientRect();
                    const style = window.getComputedStyle(img);
                    const headerStyle = window.getComputedStyle(header);
                    
                    const headerCenterY = headerRect.top + headerRect.height / 2;
                    const imgCenterY = imgRect.top + imgRect.height / 2;
                    const centerOffset = Math.abs(headerCenterY - imgCenterY);

                    return {
                        src: img.src,
                        currentSrc: img.currentSrc,
                        alt: img.alt,
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        renderedWidth: imgRect.width,
                        renderedHeight: imgRect.height,
                        headerHeight: headerRect.height,
                        headerStyleHeight: headerStyle.height,
                        maxHeight: style.maxHeight,
                        objectFit: style.objectFit,
                        centerOffset: centerOffset,
                        headerCenterY: headerCenterY,
                        imgCenterY: imgCenterY,
                        isClipped: imgRect.top < headerRect.top || imgRect.bottom > headerRect.bottom,
                        aspectRatioPreserved: Math.abs((img.naturalWidth / img.naturalHeight) - (imgRect.width / imgRect.height)) < 0.1
                    };
                })()
                """,
                "returnByValue": True
            })

            # In CDP, evaluate returns { "result": { "type": "object", "value": {...} } }
            desktop_data = eval_res.get("result", {}).get("value") if "result" in eval_res else eval_res.get("value")
            print("Desktop DOM Data:", json.dumps(desktop_data, indent=2))
            assert desktop_data.get("complete") is True, "Image img.complete is False"
            assert desktop_data.get("naturalWidth", 0) > 0, "Image naturalWidth is 0 (image decoding failed)"
            assert desktop_data.get("alt") == "APPLIED MERIT — POWERED BY SMRIKAAM", f"Alt text mismatch: {desktop_data.get('alt')}"
            assert desktop_data.get("maxHeight") == "42px", f"Expected maxHeight 42px, got {desktop_data.get('maxHeight')}"
            assert desktop_data.get("objectFit") == "contain", f"Expected objectFit contain, got {desktop_data.get('objectFit')}"
            assert desktop_data.get("isClipped") is False, "Image rect overflows header rect!"
            assert desktop_data.get("centerOffset", 999) < 2.0, f"Image not vertically centered! Offset: {desktop_data.get('centerOffset')}"
            print("  -> DESKTOP DOM CHECK: PASS")

            # Capture Desktop Screenshot
            desktop_shot = await send("Page.captureScreenshot", {"format": "png"})
            with open(r"C:\STAFFING\test-artifacts\navbar-desktop-verified.png", "wb") as f:
                f.write(base64.b64decode(desktop_shot["data"]))
            print("Desktop screenshot saved: test-artifacts/navbar-desktop-verified.png")

            # Emulate Mobile Device (iPhone X: 375x812)
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
                    const header = document.querySelector('.site-header') || document.querySelector('header');
                    const img = document.querySelector('.header-brand-logo');
                    if (!img || !header) return { error: 'img or header not found' };
                    
                    const headerRect = header.getBoundingClientRect();
                    const imgRect = img.getBoundingClientRect();
                    const style = window.getComputedStyle(img);
                    
                    const headerCenterY = headerRect.top + headerRect.height / 2;
                    const imgCenterY = imgRect.top + imgRect.height / 2;
                    const centerOffset = Math.abs(headerCenterY - imgCenterY);

                    return {
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        renderedWidth: imgRect.width,
                        renderedHeight: imgRect.height,
                        headerHeight: headerRect.height,
                        maxHeight: style.maxHeight,
                        objectFit: style.objectFit,
                        centerOffset: centerOffset,
                        isClipped: imgRect.top < headerRect.top || imgRect.bottom > headerRect.bottom,
                        withinHeaderBounds: imgRect.right <= window.innerWidth
                    };
                })()
                """,
                "returnByValue": True
            })
            mobile_data = eval_res_mob.get("result", {}).get("value") if "result" in eval_res_mob else eval_res_mob.get("value")
            print("Mobile DOM Data:", json.dumps(mobile_data, indent=2))
            assert mobile_data.get("complete") is True, "Mobile image not complete"
            assert mobile_data.get("isClipped") is False, "Mobile logo is clipped"
            assert mobile_data.get("centerOffset", 999) < 2.0, "Mobile logo not vertically centered"
            assert mobile_data.get("withinHeaderBounds") is True, "Mobile logo overflows viewport"
            print("  -> MOBILE CHECK: PASS")

            # Capture Mobile Screenshot
            mobile_shot = await send("Page.captureScreenshot", {"format": "png"})
            with open(r"C:\STAFFING\test-artifacts\navbar-mobile-verified.png", "wb") as f:
                f.write(base64.b64decode(mobile_shot["data"]))
            print("Mobile screenshot saved: test-artifacts/navbar-mobile-verified.png")

            listener_task.cancel()
            print("\nALL VERIFICATIONS PASSED 100% SUCCESSFULLY!")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_logo())
