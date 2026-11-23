import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify-tightcrop"
CDP_PORT = 9444
TEST_ARTIFACTS = r"C:\STAFFING\test-artifacts"

VIEWPORTS = [
    {"name": "desktop-1920", "width": 1920, "height": 1080, "is_mobile": False, "dpr": 1},
    {"name": "desktop-1440", "width": 1440, "height": 900, "is_mobile": False, "dpr": 1},
    {"name": "desktop-1366", "width": 1366, "height": 768, "is_mobile": False, "dpr": 1},
    {"name": "desktop-retina", "width": 1440, "height": 900, "is_mobile": False, "dpr": 2},
    {"name": "tablet-768", "width": 768, "height": 1024, "is_mobile": True, "dpr": 2},
    {"name": "mobile-390", "width": 390, "height": 844, "is_mobile": True, "dpr": 3},
    {"name": "mobile-360", "width": 360, "height": 740, "is_mobile": True, "dpr": 3},
]

async def run_verification():
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
                        data = json.loads(raw)
                        if "id" in data:
                            fut = pending.pop(data["id"], None)
                            if fut and not fut.done():
                                fut.set_result(data.get("result"))
                        elif data.get("method") == "Network.responseReceived":
                            resp = data["params"]["response"]
                            network_events.append({
                                "url": resp.get("url"),
                                "status": resp.get("status"),
                                "mimeType": resp.get("mimeType")
                            })
                except Exception:
                    pass

            listener_task = asyncio.create_task(listener())

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

            # Test both preview port 4173 and dev port 5173
            for target_port in [4173, 5173]:
                target_url = f"http://localhost:{target_port}"
                print(f"\n=======================================================")
                print(f"TESTING TARGET URL: {target_url}")
                print(f"=======================================================")

                network_events.clear()
                await send("Page.navigate", {"url": target_url})
                await asyncio.sleep(2)

                # 1. Network check
                logo_responses = [e for e in network_events if "AppliedSkills_Logo.png" in e["url"]]
                print(f"Network requests for AppliedSkills_Logo.png: {len(logo_responses)}")
                for lr in logo_responses:
                    print(f"  URL: {lr['url']} -> status {lr['status']}, mime: {lr['mimeType']}")
                assert len(logo_responses) > 0, "No logo request captured!"
                assert logo_responses[0]["status"] == 200, f"Expected 200, got {logo_responses[0]['status']}"
                assert "image" in logo_responses[0]["mimeType"], f"Expected image mime, got {logo_responses[0]['mimeType']}"
                print(">>> NETWORK VERIFICATION PASSED: HTTP 200 image/png confirmed.")

                # 2. Viewport checks
                for vp in VIEWPORTS:
                    print(f"\n--- Checking Viewport: {vp['name']} ({vp['width']}x{vp['height']} @ {vp['dpr']}x) ---")
                    await send("Emulation.setDeviceMetricsOverride", {
                        "width": vp["width"],
                        "height": vp["height"],
                        "deviceScaleFactor": vp["dpr"],
                        "mobile": vp["is_mobile"]
                    })
                    await asyncio.sleep(0.5)

                    dom_res = await send("Runtime.evaluate", {
                        "expression": """
                        (() => {
                            const header = document.querySelector('.talento-header');
                            const brand = document.querySelector('.talento-brand');
                            const logo = document.querySelector('.header-brand-logo');
                            const divider = document.querySelector('.talento-header-divider');
                            const nav = document.querySelector('.talento-nav');
                            const actions = document.querySelector('.talento-header-actions');
                            
                            const hRect = header.getBoundingClientRect();
                            const bRect = brand.getBoundingClientRect();
                            const lRect = logo.getBoundingClientRect();
                            const dRect = divider ? divider.getBoundingClientRect() : null;
                            const nRect = nav && window.getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect() : null;
                            const aRect = actions ? actions.getBoundingClientRect() : null;

                            const hStyle = window.getComputedStyle(header);
                            const lStyle = window.getComputedStyle(logo);
                            const bStyle = window.getComputedStyle(brand);
                            const dStyle = divider ? window.getComputedStyle(divider) : null;

                            return {
                                // Image intrinsic properties
                                naturalWidth: logo.naturalWidth,
                                naturalHeight: logo.naturalHeight,
                                complete: logo.complete,
                                currentSrc: logo.currentSrc,
                                altText: logo.alt,
                                // CSS dimensions
                                logoWidth: lStyle.width,
                                logoHeight: lStyle.height,
                                logoObjectFit: lStyle.objectFit,
                                logoObjectPosition: lStyle.objectPosition,
                                logoDisplay: lStyle.display,
                                logoAspectRatio: lStyle.aspectRatio,
                                brandFlexShrink: bStyle.flexShrink,
                                // Rendered BoundingRect
                                renderedLogoWidth: lRect.width,
                                renderedLogoHeight: lRect.height,
                                renderedLogoTop: lRect.top,
                                renderedLogoBottom: lRect.bottom,
                                renderedBrandWidth: bRect.width,
                                renderedBrandHeight: bRect.height,
                                renderedHeaderHeight: hRect.height,
                                // Background & layout checks
                                headerBgColor: hStyle.backgroundColor,
                                isVerticallyClipped: (lRect.top < hRect.top - 0.5) || (lRect.bottom > hRect.bottom + 0.5),
                                isBrandClippingLogo: (lRect.top < bRect.top - 0.5) || (lRect.bottom > bRect.bottom + 0.5) || (lRect.left < bRect.left - 0.5) || (lRect.right > bRect.right + 0.5),
                                dividerVisible: divider ? (dStyle.display !== 'none' && dRect.width > 0) : false,
                                dividerLeft: dRect ? dRect.left : null,
                                brandRight: bRect.right,
                                dividerSpacing: dRect ? (dRect.left - bRect.right) : null,
                                navOverlap: nRect ? (lRect.right > nRect.left) : false,
                                actionsOverlap: aRect ? (lRect.right > aRect.left) : false,
                                horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
                            };
                        })()
                        """,
                        "returnByValue": True
                    })

                    data = dom_res.get("result", {}).get("value")
                    print(json.dumps(data, indent=2))

                    # Verify Requirements
                    # 1. Image loaded
                    assert data["complete"] is True, "Image is not complete"
                    assert data["naturalWidth"] == 1851, f"naturalWidth is {data['naturalWidth']}, expected 1851"
                    assert data["naturalHeight"] == 346, f"naturalHeight is {data['naturalHeight']}, expected 346"
                    
                    # 2. Rendered dimensions
                    if vp["width"] > 640:
                        assert 250 <= data["renderedLogoWidth"] <= 280, f"Expected desktop rendered width 250-280px, got {data['renderedLogoWidth']}"
                        assert 45 <= data["renderedLogoHeight"] <= 55, f"Expected desktop rendered height 45-55px, got {data['renderedLogoHeight']}"
                    else:
                        assert 190 <= data["renderedLogoWidth"] <= 220, f"Expected mobile rendered width 190-220px, got {data['renderedLogoWidth']}"
                        assert 35 <= data["renderedLogoHeight"] <= 45, f"Expected mobile rendered height 35-45px, got {data['renderedLogoHeight']}"

                    # 3. Non-clipping, vertical centering & layout protection
                    assert data["isVerticallyClipped"] is False, "Logo is vertically clipped by header!"
                    assert data["isBrandClippingLogo"] is False, "Brand container is clipping logo!"
                    assert data["navOverlap"] is False, "Logo overlaps navigation links!"
                    assert data["actionsOverlap"] is False, "Logo overlaps header actions!"
                    assert data["dividerVisible"] is True, "Vertical divider is not visible!"
                    assert data["dividerSpacing"] > 5, f"Divider spacing too tight: {data['dividerSpacing']}"
                    assert data["horizontalOverflow"] is False, "Horizontal overflow detected!"

                    # 4. Header background check
                    assert "0, 0, 0" in data["headerBgColor"], f"Header background is not black: {data['headerBgColor']}"

                    # Screenshot header
                    shot = await send("Page.captureScreenshot", {
                        "format": "png",
                        "clip": {"x": 0, "y": 0, "width": vp["width"], "height": 110, "scale": 1}
                    })
                    shot_path = os.path.join(TEST_ARTIFACTS, f"pixelperfect-{target_port}-{vp['name']}.png")
                    with open(shot_path, "wb") as f:
                        f.write(base64.b64decode(shot["data"]))
                    print(f"  Header screenshot saved to: {shot_path}")

            listener_task.cancel()
            print("\n=======================================================")
            print("ALL PIXEL-PERFECT VERIFICATIONS PASSED 100%!")
            print("=======================================================")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(run_verification())
