import asyncio, json, os, subprocess, time, urllib.request, websockets, base64
from PIL import Image

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-test"
PORT = 9445
URL = "http://localhost:4173/"

async def capture_all():
    os.makedirs(USER_DATA, exist_ok=True)
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--window-size=1440,900"
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
                    if r.get("id") == mid:
                        return r.get("result", {})

            await call("Page.enable")

            # 1. Capture at 1440x900
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Page.navigate", {"url": URL})
            await asyncio.sleep(2)

            doc = await call("DOM.getDocument")
            node = await call("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": "#practice-areas"})
            box = await call("DOM.getBoxModel", {"nodeId": node["nodeId"]})
            content = box["model"]["content"]
            x = content[0]
            y = content[1]
            w = content[2] - content[0]
            h = content[5] - content[1]
            print(f"Desktop 1440 Box: x={x}, y={y}, w={w}, h={h}")

            shot = await call("Page.captureScreenshot", {
                "format": "png",
                "clip": {"x": 0, "y": y, "width": 1440, "height": h, "scale": 1}
            })
            with open("test-artifacts/tech_section_1440.png", "wb") as f:
                f.write(base64.b64decode(shot["data"]))

            # 2. Capture at 1024x576 (matching reference viewport exactly!)
            # Notice reference shows navbar + section
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1024, "height": 576, "deviceScaleFactor": 1, "mobile": False
            })
            # Navigate to #practice-areas or scroll to it
            await call("Page.navigate", {"url": f"{URL}#practice-areas"})
            await asyncio.sleep(1.5)

            # Get box again
            doc = await call("DOM.getDocument")
            node = await call("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": "#practice-areas"})
            box = await call("DOM.getBoxModel", {"nodeId": node["nodeId"]})
            content = box["model"]["content"]
            y_1024 = content[1]
            h_1024 = content[5] - content[1]
            print(f"Desktop 1024 Box: y={y_1024}, h={h_1024}")

            shot_1024 = await call("Page.captureScreenshot", {
                "format": "png",
                "clip": {"x": 0, "y": y_1024, "width": 1024, "height": h_1024, "scale": 1}
            })
            with open("test-artifacts/tech_section_1024.png", "wb") as f:
                f.write(base64.b64decode(shot_1024["data"]))

            # Also capture the viewport showing navbar + section like reference image
            await call("Runtime.evaluate", {
                "expression": "window.scrollTo(0, document.querySelector('#practice-areas').offsetTop - 55)"
            })
            await asyncio.sleep(0.5)
            shot_view = await call("Page.captureScreenshot", {"format": "png"})
            with open("test-artifacts/tech_section_ref_view.png", "wb") as f:
                f.write(base64.b64decode(shot_view["data"]))

            # 3. Tablet (768x1024)
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 768, "height": 1024, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Page.navigate", {"url": f"{URL}#practice-areas"})
            await asyncio.sleep(1.5)
            doc = await call("DOM.getDocument")
            node = await call("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": "#practice-areas"})
            box = await call("DOM.getBoxModel", {"nodeId": node["nodeId"]})
            content = box["model"]["content"]
            shot_tablet = await call("Page.captureScreenshot", {
                "format": "png",
                "clip": {"x": 0, "y": content[1], "width": 768, "height": content[5]-content[1], "scale": 1}
            })
            with open("test-artifacts/tech_section_tablet.png", "wb") as f:
                f.write(base64.b64decode(shot_tablet["data"]))

            # 4. Mobile (390x844)
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True
            })
            await call("Page.navigate", {"url": f"{URL}#practice-areas"})
            await asyncio.sleep(1.5)
            doc = await call("DOM.getDocument")
            node = await call("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": "#practice-areas"})
            box = await call("DOM.getBoxModel", {"nodeId": node["nodeId"]})
            content = box["model"]["content"]
            shot_mobile = await call("Page.captureScreenshot", {
                "format": "png",
                "clip": {"x": 0, "y": content[1], "width": 390, "height": content[5]-content[1], "scale": 1}
            })
            with open("test-artifacts/tech_section_mobile.png", "wb") as f:
                f.write(base64.b64decode(shot_mobile["data"]))

            print("All screenshots successfully captured!")
    finally:
        proc.kill()

asyncio.run(capture_all())
