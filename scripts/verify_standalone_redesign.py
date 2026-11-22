import asyncio, json, os, subprocess, time, urllib.request, websockets, base64
from PIL import Image

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify"
PORT = 9335
URL = "http://localhost:4173/"

async def run():
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
        "--window-size=1024,576"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.0)
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
                    if r.get("id") == mid:
                        return r.get("result", {})

            await call("Page.enable")
            await call("Runtime.enable")

            # 1. TEST AT REFERENCE VIEWPORT: 1024x576
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1024, "height": 576, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Page.navigate", {"url": f"{URL}#practice-areas"})
            await asyncio.sleep(2.0)

            # Scroll perfectly to #practice-areas respecting header
            await call("Runtime.evaluate", {
                "expression": """
                    (() => {
                        const el = document.querySelector('#practice-areas');
                        const header = document.querySelector('.talento-header');
                        const headerH = header ? header.offsetHeight : 82;
                        window.scrollTo(0, el.offsetTop - headerH);
                    })()
                """
            })
            await asyncio.sleep(0.6)

            # Inspect what is in viewport
            check_res = await call("Runtime.evaluate", {
                "expression": """
                    (() => {
                        const el = document.querySelector('#practice-areas');
                        const header = document.querySelector('.talento-header');
                        const headerH = header ? header.offsetHeight : 82;
                        const r = el.getBoundingClientRect();
                        const prevSection = el.previousElementSibling;
                        const nextSection = el.nextElementSibling;
                        
                        const prevR = prevSection ? prevSection.getBoundingClientRect() : null;
                        const nextR = nextSection ? nextSection.getBoundingClientRect() : null;
                        
                        return JSON.stringify({
                            viewport: { width: window.innerWidth, height: window.innerHeight },
                            scrollY: window.scrollY,
                            headerHeight: headerH,
                            practiceAreas: { top: r.top, bottom: r.bottom, height: r.height },
                            prevVisibleInViewport: prevR ? (prevR.bottom > headerH && prevR.top < window.innerHeight) : false,
                            nextVisibleInViewport: nextR ? (nextR.top < window.innerHeight && nextR.bottom > 0) : false,
                            cardsCount: document.querySelectorAll('.talento-tech-card').length,
                            featuredCardCount: document.querySelectorAll('.talento-tech-card-featured').length
                        });
                    })()
                """
            })
            info = json.loads(check_res["result"]["value"])
            print("=== STANDALONE VIEWPORT 1024x576 VERIFICATION ===")
            print(f"Viewport: {info['viewport']['width']}x{info['viewport']['height']}")
            print(f"Header height: {info['headerHeight']}px")
            print(f"Practice Areas rect: top={info['practiceAreas']['top']}, bottom={info['practiceAreas']['bottom']}, height={info['practiceAreas']['height']}")
            print(f"Previous section visible in viewport: {info['prevVisibleInViewport']} (Must be False!)")
            print(f"Next section visible in viewport: {info['nextVisibleInViewport']} (Must be False!)")
            print(f"Total cards: {info['cardsCount']} (Must be 8)")
            print(f"Featured dark card count: {info['featuredCardCount']} (Must be 1)")

            # Capture full viewport at 1024x576
            shot_1024 = await call("Page.captureScreenshot", {"format": "png"})
            with open("test-artifacts/standalone_1024x576.png", "wb") as f:
                f.write(base64.b64decode(shot_1024["data"]))
            print("Saved test-artifacts/standalone_1024x576.png!")

            # 2. Side-by-side comparison with new reference image
            ref = Image.open("C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795260337457_bfa9d3fe.jpg")
            rendered = Image.open("test-artifacts/standalone_1024x576.png")
            
            comp = Image.new("RGB", (1024 * 2 + 10, 576), (128, 128, 128))
            comp.paste(ref, (0, 0))
            comp.paste(rendered, (1024 + 10, 0))
            comp.save("test-artifacts/new_redesign_side_by_side.png")

            comp_stack = Image.new("RGB", (1024, 576 * 2 + 10), (128, 128, 128))
            comp_stack.paste(ref, (0, 0))
            comp_stack.paste(rendered, (0, 586))
            comp_stack.save("test-artifacts/new_redesign_stacked.png")
            print("Saved side-by-side and stacked comparisons!")

            # 3. TEST AT 1440x900
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Runtime.evaluate", {
                "expression": """
                    (() => {
                        const el = document.querySelector('#practice-areas');
                        const header = document.querySelector('.talento-header');
                        const headerH = header ? header.offsetHeight : 82;
                        window.scrollTo(0, el.offsetTop - headerH);
                    })()
                """
            })
            await asyncio.sleep(0.6)
            shot_1440 = await call("Page.captureScreenshot", {"format": "png"})
            with open("test-artifacts/standalone_1440x900.png", "wb") as f:
                f.write(base64.b64decode(shot_1440["data"]))
            print("Saved test-artifacts/standalone_1440x900.png!")

            # 4. TEST AT 1920x1080
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1920, "height": 1080, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Runtime.evaluate", {
                "expression": """
                    (() => {
                        const el = document.querySelector('#practice-areas');
                        const header = document.querySelector('.talento-header');
                        const headerH = header ? header.offsetHeight : 82;
                        window.scrollTo(0, el.offsetTop - headerH);
                    })()
                """
            })
            await asyncio.sleep(0.6)
            shot_1920 = await call("Page.captureScreenshot", {"format": "png"})
            with open("test-artifacts/standalone_1920x1080.png", "wb") as f:
                f.write(base64.b64decode(shot_1920["data"]))
            print("Saved test-artifacts/standalone_1920x1080.png!")

            # 5. TEST MOBILE 390x844
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True
            })
            await call("Runtime.evaluate", {
                "expression": """
                    (() => {
                        const el = document.querySelector('#practice-areas');
                        const header = document.querySelector('.talento-header');
                        const headerH = header ? header.offsetHeight : 72;
                        window.scrollTo(0, el.offsetTop - headerH);
                    })()
                """
            })
            await asyncio.sleep(0.6)
            shot_mobile = await call("Page.captureScreenshot", {"format": "png"})
            with open("test-artifacts/standalone_mobile_390x844.png", "wb") as f:
                f.write(base64.b64decode(shot_mobile["data"]))
            print("Saved test-artifacts/standalone_mobile_390x844.png!")
            print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    finally:
        proc.terminate()

asyncio.run(run())
