import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = os.path.join(os.environ.get("TEMP", r"C:\temp"), "chrome-staffing-test")
PORT = 9555
URL = "http://localhost:4173/IT-staffing-services-in-Coimbatore#practice-areas"

viewports = [
    ("desktop-1920x1080", 1920, 1080),
    ("desktop-1600x900", 1600, 900),
    ("laptop-1366x768", 1366, 768),
    ("tablet-768px", 768, 1024),
    ("mobile-390px", 390, 844),
    ("mobile-360px", 360, 800)
]

async def main():
    os.makedirs(USER_DATA, exist_ok=True)
    os.makedirs("test-artifacts", exist_ok=True)
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)

    try:
        # Find page target or create new one
        res = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")
        targets = json.loads(res.read().decode())
        page_targets = [t for t in targets if t.get("type") == "page"]
        if not page_targets:
            res_new = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/new")
            page_target = json.loads(res_new.read().decode())
        else:
            page_target = page_targets[0]
        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
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
            await send("DOM.enable")
            await send("CSS.enable")

            for name, w, h in viewports:
                await send("Emulation.setDeviceMetricsOverride", {
                    "width": w,
                    "height": h,
                    "deviceScaleFactor": 2,
                    "mobile": w <= 768
                })
                await send("Page.navigate", {"url": URL})
                await asyncio.sleep(1.2)

                check_script = """
                (() => {
                    const grid = document.querySelector('.talento-tech-grid');
                    if (!grid) return { error: 'grid not found' };
                    const cards = Array.from(document.querySelectorAll('.talento-tech-card'));
                    const arrows = document.querySelectorAll('.talento-tech-arrow-btn, .talento-tech-card-action');
                    const section = document.querySelector('.talento-tech-section');
                    
                    const cardData = cards.map((c, i) => {
                        const style = window.getComputedStyle(c);
                        const rect = c.getBoundingClientRect();
                        const title = c.querySelector('.talento-tech-card-title');
                        const desc = c.querySelector('.talento-tech-card-desc');
                        const iconBadge = c.querySelector('.talento-tech-icon-badge');
                        const num = c.querySelector('.talento-tech-card-num');
                        return {
                            index: i + 1,
                            titleText: title ? title.innerText.trim() : null,
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            bg: style.backgroundColor,
                            color: style.color,
                            titleColor: title ? window.getComputedStyle(title).color : null,
                            descColor: desc ? window.getComputedStyle(desc).color : null,
                            titleFontSize: title ? window.getComputedStyle(title).fontSize : null,
                            descFontSize: desc ? window.getComputedStyle(desc).fontSize : null,
                            padding: style.padding,
                            hasArrow: !!c.querySelector('svg polyline[points*=\"12 5\"]') || !!c.querySelector('.talento-tech-arrow-btn')
                        };
                    });

                    const gridStyle = window.getComputedStyle(grid);
                    const cols = gridStyle.gridTemplateColumns.trim().split(/\\s+/).length;
                    const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;

                    return {
                        viewport: `${window.innerWidth}x${window.innerHeight}`,
                        totalCards: cards.length,
                        arrowCount: arrows.length,
                        hasHorizontalOverflow,
                        gridColumns: cols,
                        allWhiteByDefault: cardData.every(c => c.bg === 'rgb(255, 255, 255)'),
                        cards: cardData
                    };
                })()
                """
                eval_res = await send("Runtime.evaluate", {"expression": check_script, "returnByValue": True})
                if "exceptionDetails" in eval_res:
                    print("JS Exception:", eval_res["exceptionDetails"])
                    continue
                result = eval_res.get("result", {}).get("value", {})
                print(f"=== Viewport {name} ({w}x{h}) ===")
                print(f"Cards count: {result['totalCards']}, Arrows remaining: {result['arrowCount']}")
                print(f"Grid columns: {result['gridColumns']}, Horizontal overflow: {result['hasHorizontalOverflow']}")
                print(f"All white default: {result['allWhiteByDefault']}")
                print(f"Sample Card 1: width={result['cards'][0]['width']}px, height={result['cards'][0]['height']}px, titleFont={result['cards'][0]['titleFontSize']}, descFont={result['cards'][0]['descFontSize']}")
                
                # Capture screenshot
                shot = await send("Page.captureScreenshot", {"format": "png"})
                with open(f"test-artifacts/test_view_{name}.png", "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
                print(f"Saved test-artifacts/test_view_{name}.png\n")

            # Test Hover on Card 1, Card 3, Card 8
            print("--- Testing Hover Interactions ---")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1920,
                "height": 1080,
                "deviceScaleFactor": 2,
                "mobile": False
            })
            await send("Page.navigate", {"url": URL})
            await asyncio.sleep(1.0)

            for target_idx in range(8):
                # Ensure element is centered and wait for scroll
                scroll_cmd = f"""
                (() => {{
                    const cards = document.querySelectorAll('.talento-tech-card');
                    const target = cards[{target_idx}];
                    target.scrollIntoView({{ block: 'center', behavior: 'instant' }});
                }})()
                """
                await send("Runtime.evaluate", {"expression": scroll_cmd})
                await asyncio.sleep(0.3)

                coords_cmd = f"""
                (() => {{
                    const cards = document.querySelectorAll('.talento-tech-card');
                    const target = cards[{target_idx}];
                    const rect = target.getBoundingClientRect();
                    return {{ x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }};
                }})()
                """
                coords = (await send("Runtime.evaluate", {"expression": coords_cmd, "returnByValue": True}))["result"]["value"]
                await send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": coords["x"], "y": coords["y"]})
                await asyncio.sleep(0.4)

                hover_check = f"""
                (() => {{
                    const cards = document.querySelectorAll('.talento-tech-card');
                    const target = cards[{target_idx}];
                    const style = window.getComputedStyle(target);
                    const title = target.querySelector('.talento-tech-card-title');
                    const desc = target.querySelector('.talento-tech-card-desc');
                    const badge = target.querySelector('.talento-tech-icon-badge');
                    const num = target.querySelector('.talento-tech-card-num');
                    return {{
                        index: {target_idx + 1},
                        bg: style.backgroundColor,
                        titleColor: window.getComputedStyle(title).color,
                        descColor: window.getComputedStyle(desc).color,
                        badgeBg: window.getComputedStyle(badge).backgroundColor,
                        badgeColor: window.getComputedStyle(badge).color,
                        numColor: window.getComputedStyle(num).color
                    }};
                }})()
                """
                h_res = (await send("Runtime.evaluate", {"expression": hover_check, "returnByValue": True}))["result"]["value"]
                print(f"Card {h_res['index']} Hover: bg={h_res['bg']}, titleColor={h_res['titleColor']}, badgeBg={h_res['badgeBg']}")

                # Move mouse away to top-left of page
                await send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": 0, "y": 0})
                await asyncio.sleep(0.35)

                leave_check = f"""
                (() => {{
                    const cards = document.querySelectorAll('.talento-tech-card');
                    const target = cards[{target_idx}];
                    const style = window.getComputedStyle(target);
                    return {{
                        index: {target_idx + 1},
                        bg: style.backgroundColor
                    }};
                }})()
                """
                l_res = (await send("Runtime.evaluate", {"expression": leave_check, "returnByValue": True}))["result"]["value"]
                print(f"Card {l_res['index']} Unhover: bg={l_res['bg']} (returned to white: {l_res['bg'] == 'rgb(255, 255, 255)'})")

            # Test touch tap toggle on Card 2
            await send("Runtime.evaluate", {"expression": "document.querySelectorAll('.talento-tech-card')[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))"})
            await asyncio.sleep(0.3)
            tap_test = """
            (() => {
                const card2 = document.querySelectorAll('.talento-tech-card')[1];
                const style = window.getComputedStyle(card2);
                const isActive = card2.classList.contains('is-active');
                return { isActive, bg: style.backgroundColor, titleColor: window.getComputedStyle(card2.querySelector('.talento-tech-card-title')).color };
            })()
            """
            tap_res = (await send("Runtime.evaluate", {"expression": tap_test, "returnByValue": True}))["result"]["value"]
            print(f"\nCard 2 Tap Test: isActive={tap_res['isActive']}, bg={tap_res['bg']}, titleColor={tap_res['titleColor']}")

            # Tap again to deactivate
            await send("Runtime.evaluate", {"expression": "document.querySelectorAll('.talento-tech-card')[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))"})
            await asyncio.sleep(0.3)
            tap_off_res = (await send("Runtime.evaluate", {"expression": tap_test, "returnByValue": True}))["result"]["value"]
            print(f"Card 2 Tap Again Test: isActive={tap_off_res['isActive']}, bg={tap_off_res['bg']}")

    finally:
        proc.terminate()

asyncio.run(main())
