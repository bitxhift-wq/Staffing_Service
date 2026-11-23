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
USER_DATA = r"C:\STAFFING\.tmp-chrome-inspect-navbar"
CDP_PORT = 9911
TARGET_URL = "http://localhost:4173"
TEST_ARTIFACTS = r"C:\STAFFING\test-artifacts"

VIEWPORTS = [
    {"name": "desktop-1440", "width": 1440, "height": 900, "is_mobile": False},
    {"name": "desktop-1920", "width": 1920, "height": 1080, "is_mobile": False},
    {"name": "tablet-768", "width": 768, "height": 1024, "is_mobile": True},
    {"name": "mobile-390", "width": 390, "height": 844, "is_mobile": True},
    {"name": "mobile-360", "width": 360, "height": 740, "is_mobile": True},
]

async def run_inspection():
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

            async def listener():
                try:
                    while True:
                        raw = await ws.recv()
                        msg = json.loads(raw)
                        if "id" in msg:
                            fut = pending.pop(msg["id"], None)
                            if fut and not fut.done():
                                fut.set_result(msg.get("result"))
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

            print(f"Navigating to {TARGET_URL}...")
            await send("Page.navigate", {"url": TARGET_URL})
            await asyncio.sleep(2.5)

            print("\n==================================================")
            print("NAVBAR LOGO ACCURACY & RENDERING INSPECTION")
            print("==================================================")

            for vp in VIEWPORTS:
                await send("Emulation.setDeviceMetricsOverride", {
                    "width": vp["width"],
                    "height": vp["height"],
                    "deviceScaleFactor": 1,
                    "mobile": vp["is_mobile"]
                })
                await asyncio.sleep(0.8)

                eval_res = await send("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const header = document.querySelector('.talento-header');
                        const brand = document.querySelector('.talento-brand');
                        const img = document.querySelector('.header-brand-logo');
                        const divider = document.querySelector('.talento-header-divider');
                        const nav = document.querySelector('.talento-nav');
                        
                        const hRect = header ? header.getBoundingClientRect() : null;
                        const bRect = brand ? brand.getBoundingClientRect() : null;
                        const iRect = img ? img.getBoundingClientRect() : null;
                        const dRect = divider ? divider.getBoundingClientRect() : null;
                        const nRect = nav ? nav.getBoundingClientRect() : null;
                        
                        const compBrand = brand ? window.getComputedStyle(brand) : null;
                        const compImg = img ? window.getComputedStyle(img) : null;
                        
                        const headerCenterY = hRect ? hRect.top + hRect.height / 2 : 0;
                        const imgCenterY = iRect ? iRect.top + iRect.height / 2 : 0;
                        const verticalOffset = Math.abs(headerCenterY - imgCenterY);
                        
                        return {
                            headerHeight: hRect?.height,
                            brandWidth: bRect?.width,
                            brandHeight: bRect?.height,
                            imgWidth: iRect?.width,
                            imgHeight: iRect?.height,
                            imgX: iRect?.x,
                            imgY: iRect?.y,
                            verticalOffset: verticalOffset,
                            isClipped: iRect?.top < hRect?.top || iRect?.bottom > hRect?.bottom,
                            brandFlexShrink: compBrand?.flexShrink,
                            imgFlexShrink: compImg?.flexShrink,
                            imgObjectFit: compImg?.objectFit,
                            imgSrc: img?.src,
                            imgAlt: img?.alt,
                            naturalWidth: img?.naturalWidth,
                            naturalHeight: img?.naturalHeight,
                            noOverlapWithDivider: dRect ? bRect?.right <= dRect?.left : true,
                            noOverlapWithNav: nRect ? bRect?.right < nRect?.left : true
                        };
                    })()
                    """,
                    "returnByValue": True
                })

                data = eval_res.get("result", {}).get("value") if "result" in eval_res else eval_res.get("value", {})
                print(f"\n--- Viewport: {vp['name']} ({vp['width']}x{vp['height']}) ---")
                print(f"  Brand container width: {data.get('brandWidth')}px")
                print(f"  Logo display size: {data.get('imgWidth')}px x {data.get('imgHeight')}px")
                print(f"  Logo position: x={data.get('imgX')}, y={data.get('imgY')}")
                print(f"  Header height: {data.get('headerHeight')}px (Vert offset from center: {data.get('verticalOffset'):.2f}px)")
                print(f"  Is clipped: {data.get('isClipped')}")
                print(f"  flex-shrink: brand={data.get('brandFlexShrink')}, img={data.get('imgFlexShrink')}")
                print(f"  object-fit: {data.get('imgObjectFit')}")
                print(f"  Overlap checks: divider={data.get('noOverlapWithDivider')}, nav={data.get('noOverlapWithNav')}")
                
                # Check specifications
                if not vp["is_mobile"]:
                    assert data.get("imgWidth") == 235.0, f"Expected 235px width on desktop, got {data.get('imgWidth')}"
                    assert data.get("brandWidth") == 235.0, f"Expected 235px brand container on desktop, got {data.get('brandWidth')}"
                    assert data.get("isClipped") is False, "Logo is clipped by header!"
                    assert data.get("brandFlexShrink") == "0", "Brand container flex-shrink is not 0!"
                else:
                    assert data.get("imgWidth") >= 170.0, f"Logo too small on mobile: {data.get('imgWidth')}"
                    assert data.get("isClipped") is False, "Logo is clipped by mobile header!"

                # Capture full navbar screenshot
                shot = await send("Page.captureScreenshot", {"format": "png"})
                shot_bytes = base64.b64decode(shot["data"])
                shot_file = os.path.join(TEST_ARTIFACTS, f"navbar_full_{vp['name']}.png")
                with open(shot_file, "wb") as f:
                    f.write(shot_bytes)

                # Crop logo
                im = Image.open(shot_file)
                ix, iy, iw, ih = int(data["imgX"]), int(data["imgY"]), int(data["imgWidth"]), int(data["imgHeight"])
                crop = im.crop((max(0, ix - 6), max(0, iy - 6), min(vp["width"], ix + iw + 6), min(vp["height"], iy + ih + 6)))
                crop_path = os.path.join(TEST_ARTIFACTS, f"inspect_logo_{vp['name']}.png")
                crop.save(crop_path)
                
                # Measure contrast of rendered logo
                arr = np.array(crop.convert("L"))
                contrast = np.max(arr) - np.min(arr)
                print(f"  Crop saved: {crop_path} (Dynamic contrast: {contrast})")
                assert contrast > 200, "Rendered logo contrast too low!"

            print("\n==================================================")
            print("ALL NAVBAR LOGO REQUIREMENTS CONFIRMED AND VERIFIED: PASS")
            print("==================================================")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_inspection())
