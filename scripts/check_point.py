import asyncio, json, os, subprocess, time, urllib.request, websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9520

async def check():
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        "--headless=new",
        "--disable-gpu",
        "--window-size=1024,576"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.0)
    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            async def call(m, p=None):
                await ws.send(json.dumps({"id": 1, "method": m, "params": p or {}}))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get("id") == 1: return r.get("result", {})

            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1024, "height": 576, "deviceScaleFactor": 1, "mobile": False
            })
            await call("Page.navigate", {"url": "http://localhost:4173/#practice-areas"})
            await asyncio.sleep(2.0)

            # Scroll to #practice-areas
            res = await call("Runtime.evaluate", {"expression": """
                (() => {
                    const el = document.querySelector('#practice-areas');
                    const header = document.querySelector('.talento-header');
                    const headerH = header ? header.offsetHeight : 82;
                    window.scrollTo(0, el.offsetTop - headerH);
                    
                    const elAt570 = document.elementFromPoint(100, 570);
                    const elAt574 = document.elementFromPoint(100, 574);
                    
                    return JSON.stringify({
                        scrollY: window.scrollY,
                        elAt570: elAt570 ? { tag: elAt570.tagName, class: elAt570.className } : null,
                        elAt574: elAt574 ? { tag: elAt574.tagName, class: elAt574.className } : null,
                        practiceRect: el.getBoundingClientRect()
                    });
                })()
            """})
            print(res["result"]["value"])
    finally:
        proc.terminate()

asyncio.run(check())
