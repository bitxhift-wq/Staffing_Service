import asyncio, json, subprocess, time, urllib.request, websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-test"
PORT = 9446
URL = "http://localhost:4173/#practice-areas"

async def check():
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--disable-gpu",
        "--window-size=1024,576"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)
    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
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
            await call("Page.navigate", {"url": URL})
            await asyncio.sleep(2)

            res = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const titles = Array.from(document.querySelectorAll('.talento-tech-card-title')).map((el, i) => {
                        const style = window.getComputedStyle(el);
                        return {
                            index: i + 1,
                            text: el.textContent,
                            fontFamily: style.fontFamily,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight,
                            letterSpacing: style.letterSpacing,
                            offsetHeight: el.offsetHeight,
                            offsetWidth: el.offsetWidth,
                            scrollWidth: el.scrollWidth,
                            clientWidth: el.clientWidth
                        };
                    });
                    const cards = Array.from(document.querySelectorAll('.talento-tech-card')).map((el, i) => {
                        const r = el.getBoundingClientRect();
                        return {
                            index: i + 1,
                            top: r.top,
                            left: r.left,
                            width: r.width,
                            height: r.height
                        };
                    });
                    return { titles, cards };
                })()
                """,
                "returnByValue": True
            })
            print(json.dumps(res["result"]["value"], indent=2))
    finally:
        proc.kill()

asyncio.run(check())
