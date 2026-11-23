import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-measure-nav"
CDP_PORT = 9922
TARGET_URL = "http://localhost:4173"

async def measure():
    os.makedirs(USER_DATA, exist_ok=True)
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
        targets = [t for t in targets if t.get("type") == "page"]
        ws_url = targets[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            pending = {}
            async def listener():
                try:
                    while True:
                        msg = json.loads(await ws.recv())
                        if "id" in msg and msg["id"] in pending:
                            pending.pop(msg["id"]).set_result(msg.get("result"))
                except Exception:
                    pass
            asyncio.create_task(listener())

            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                fut = asyncio.get_running_loop().create_future()
                pending[msg_id] = fut
                await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
                return await fut

            await send("Page.enable")
            await send("Runtime.enable")
            await send("Page.navigate", {"url": TARGET_URL})
            await asyncio.sleep(2.0)

            eval_res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const header = document.querySelector('.talento-header');
                    const brand = document.querySelector('.talento-brand');
                    const img = document.querySelector('.header-brand-logo');
                    const divider = document.querySelector('.talento-header-divider');
                    
                    const h = header.getBoundingClientRect();
                    const b = brand.getBoundingClientRect();
                    const i = img.getBoundingClientRect();
                    const d = divider.getBoundingClientRect();
                    
                    const compH = window.getComputedStyle(header);
                    const compD = window.getComputedStyle(divider);
                    
                    return {
                        header: { left: h.left, right: h.right, width: h.width },
                        brand: { left: b.left, right: b.right, width: b.width },
                        img: { left: i.left, right: i.right, width: i.width },
                        divider: { left: d.left, right: d.right, width: d.width },
                        headerPaddingLeft: compH.paddingLeft,
                        dividerMarginLeft: compD.marginLeft,
                        dividerMarginRight: compD.marginRight,
                        // Brand section = from left navbar edge (h.left = 0) to divider (d.left)
                        brandSectionWidth: d.left - h.left,
                        // Space on left of logo vs space on right of logo
                        leftSpaceToNavEdge: i.left - h.left,
                        rightSpaceToDivider: d.left - i.right
                    };
                })()
                """,
                "returnByValue": True
            })
            data = eval_res.get("result", {}).get("value")
            print("Layout measurements at 1440px desktop:")
            print(json.dumps(data, indent=2))
    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(measure())
