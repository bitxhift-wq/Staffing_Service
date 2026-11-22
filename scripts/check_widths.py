import asyncio, json, subprocess, time, urllib.request, websockets

PORT = 9446
URL = "http://localhost:4173/#practice-areas"

async def check():
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

        res = await call("Runtime.evaluate", {
            "expression": """
            (() => {
                const sec = document.querySelector('.talento-tech-section');
                const cnt = document.querySelector('.talento-tech-content');
                const grid = document.querySelector('.talento-tech-grid');
                return {
                    sec: { w: sec.offsetWidth, paddingLeft: window.getComputedStyle(sec).paddingLeft, paddingRight: window.getComputedStyle(sec).paddingRight },
                    cnt: { w: cnt.offsetWidth, maxW: window.getComputedStyle(cnt).maxWidth },
                    grid: { w: grid.offsetWidth, gap: window.getComputedStyle(grid).gap }
                };
            })()
            """,
            "returnByValue": True
        })
        print(json.dumps(res["result"]["value"], indent=2))

asyncio.run(check())
