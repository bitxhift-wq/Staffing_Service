import asyncio, json, os, subprocess, time, urllib.request, websockets, base64
from PIL import Image

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [CHROME_PATH, "--remote-debugging-port=9480", "--remote-allow-origins=*", "--headless=new", "--disable-gpu", "--window-size=1024,576"]
proc = subprocess.Popen(cmd)
time.sleep(1.5)
try:
    res = urllib.request.urlopen("http://localhost:9480/json")
    targets = json.loads(res.read().decode())
    ws_url = targets[0]["webSocketDebuggerUrl"]
    async def run():
        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            async def call(m, p=None):
                await ws.send(json.dumps({"id": 1, "method": m, "params": p or {}}))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get("id") == 1: return r.get("result", {})
            
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1024, "height": 576, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Page.navigate", {"url": "http://localhost:4173/"})
            await asyncio.sleep(2)
            
            # Evaluate document bounding box of #practice-areas
            res = await call("Runtime.evaluate", {"expression": """
                (() => {
                    const el = document.querySelector('#practice-areas');
                    const r = el.getBoundingClientRect();
                    const cards = Array.from(document.querySelectorAll('.talento-tech-card')).map((c, i) => {
                        const cb = c.getBoundingClientRect();
                        return { card: i + 1, width: cb.width, height: cb.height, x: cb.x, y: cb.y };
                    });
                    return JSON.stringify({
                        section: { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height },
                        cards: cards
                    });
                })()
            """})
            data = json.loads(res["result"]["value"])
            sec = data["section"]
            print(f"Rendered section: width={sec['width']}, height={sec['height']}")
            print(f"Cards (height={data['cards'][0]['height']:.1f}, width={data['cards'][0]['width']:.1f}):")
            for c in data["cards"]:
                print(f"  Card {c['card']}: x={c['x']:.1f}, y={c['y']:.1f}, w={c['width']:.1f}, h={c['height']:.1f}")

            # Take screenshot with true document clip
            shot = await call("Page.captureScreenshot", {
                "format": "png",
                "clip": {
                    "x": sec["x"],
                    "y": sec["y"],
                    "width": sec["width"],
                    "height": sec["height"],
                    "scale": 1
                },
                "captureBeyondViewport": True
            })
            with open("test-artifacts/perfect_tech_section_1024.png", "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Successfully saved perfect_tech_section_1024.png!")
            
            # Generate updated side-by-side comparison
            ref = Image.open("test-artifacts/ref_section_only.png")
            ren = Image.open("test-artifacts/perfect_tech_section_1024.png")
            
            # Scale ren to 1024 if needed
            if ren.width != 1024:
                h_target = int(ren.height * (1024 / ren.width))
                ren_scaled = ren.resize((1024, h_target), Image.Resampling.LANCZOS)
            else:
                ren_scaled = ren
                
            comp = Image.new("RGB", (1024 * 2 + 10, max(ref.height, ren_scaled.height)), (160, 160, 160))
            comp.paste(ref, (0, 0))
            comp.paste(ren_scaled, (1024 + 10, 0))
            comp.save("test-artifacts/final_side_by_side.png")
            
            comp_stack = Image.new("RGB", (1024, ref.height + ren_scaled.height + 10), (160, 160, 160))
            comp_stack.paste(ref, (0, 0))
            comp_stack.paste(ren_scaled, (0, ref.height + 10))
            comp_stack.save("test-artifacts/final_stacked.png")
            print("Successfully generated final_side_by_side.png and final_stacked.png!")
    asyncio.run(run())
finally:
    proc.terminate()
