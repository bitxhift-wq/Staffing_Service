import asyncio, json, urllib.request, websockets, base64, subprocess, os, time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9555
USER_DATA = r"C:\STAFFING\.tmp-chrome-snap"

async def snap():
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
                    if r.get("id") == mid: return r.get("result", {})

            await call("Page.enable")
            await call("Page.navigate", {"url": "http://localhost:5173/"})
            await asyncio.sleep(2)

            eval_res = await call("Runtime.evaluate", {
                "expression": "JSON.stringify(document.querySelector('.talento-dual-section')?.getBoundingClientRect() || {})",
                "returnByValue": True
            })
            print("Section rect:", eval_res.get("result", {}).get("value"))

            await call("Runtime.evaluate", {
                "expression": "document.querySelector('.talento-dual-section').scrollIntoView()"
            })
            await asyncio.sleep(0.5)

            ss = await call("Page.captureScreenshot", {"format": "png"})
            with open("current_dual_section.png", "wb") as f:
                f.write(base64.b64decode(ss["data"]))
            print("Saved current_dual_section.png successfully")
    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(snap())
