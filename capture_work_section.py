import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-work"
PORT = 9335
URL = "http://localhost:4173/#where-we-work"

async def capture(viewport_w, viewport_h, output_name):
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
        f"--window-size={viewport_w},{viewport_h}"
    ]
    proc = subprocess.Popen(cmd)
    await asyncio.sleep(2)

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
            await send("Emulation.setDeviceMetricsOverride", {
                "width": viewport_w,
                "height": viewport_h,
                "deviceScaleFactor": 1,
                "mobile": viewport_w < 600
            })

            await send("Page.navigate", {"url": URL})
            await asyncio.sleep(2)

            # Check image loaded
            check_script = """
            ({
                img_naturalWidth: document.querySelector('#where-we-work img')?.naturalWidth,
                img_naturalHeight: document.querySelector('#where-we-work img')?.naturalHeight,
                img_currentSrc: document.querySelector('#where-we-work img')?.currentSrc,
                tags: Array.from(document.querySelectorAll('#where-we-work .talento-tag')).map(t => t.innerText),
                descText: document.querySelector('#where-we-work .talento-work-text')?.innerText
            })
            """
            eval_res = await send("Runtime.evaluate", {"expression": check_script, "returnByValue": True})
            print("Section inspection:", json.dumps(eval_res["result"]["value"], indent=2))

            # Scroll into view
            await send("Runtime.evaluate", {"expression": "document.querySelector('#where-we-work').scrollIntoView()"})
            await asyncio.sleep(1)

            # Get bounding rect of #where-we-work
            rect_script = """
            (() => {
                const el = document.querySelector('#where-we-work');
                const r = el.getBoundingClientRect();
                return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height };
            })()
            """
            rect_res = await send("Runtime.evaluate", {"expression": rect_script, "returnByValue": True})
            rect = rect_res["result"]["value"]
            print("Bounding Rect:", rect)

            shot = await send("Page.captureScreenshot", {
                "format": "png",
                "clip": {
                    "x": rect["x"],
                    "y": rect["y"],
                    "width": rect["width"],
                    "height": rect["height"],
                    "scale": 1
                }
            })
            os.makedirs("test-artifacts", exist_ok=True)
            with open(f"test-artifacts/{output_name}.png", "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print(f"Saved screenshot: test-artifacts/{output_name}.png")
    finally:
        proc.terminate()
        proc.wait()

async def main():
    print("Capturing Desktop 1440x900...")
    await capture(1440, 900, "where_we_work_desktop")
    await asyncio.sleep(1)
    print("Capturing Mobile 390x844...")
    await capture(390, 844, "where_we_work_mobile")

if __name__ == '__main__':
    asyncio.run(main())
