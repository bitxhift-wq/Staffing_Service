import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-verify-final"
PORT = 9480
URL = "http://localhost:4173"

async def verify():
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--disable-gpu"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)
    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        page_targets = [t for t in targets if t.get("type") == "page"]
        ws_url = page_targets[0]["webSocketDebuggerUrl"] if page_targets else targets[0]["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            mid = 0
            async def call(m, p=None):
                nonlocal mid; mid += 1
                await ws.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get("id") == mid: return r.get("result", {})

            await call("Page.enable")
            await call("Runtime.enable")
            await call("Page.navigate", {"url": URL})
            await asyncio.sleep(2)

            print("=" * 80)
            print("APPLIED MERIT NAVIGATION MENU TEXT SIZE & LAYOUT VERIFICATION")
            print("=" * 80)

            # 1. Desktop 1440x900 Verification
            await call("Emulation.setDeviceMetricsOverride", {
                "width": 1440,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)

            eval_res = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const header = document.querySelector('.talento-header');
                    const logo = document.querySelector('.talento-brand');
                    const logoImg = document.querySelector('.header-brand-logo');
                    const divider = document.querySelector('.talento-header-divider');
                    const nav = document.querySelector('.talento-nav');
                    const actions = document.querySelector('.talento-header-actions');
                    const btn = document.querySelector('.talento-btn-nav');
                    const links = Array.from(document.querySelectorAll('.talento-nav a'));

                    const hRect = header.getBoundingClientRect();
                    const lRect = logo.getBoundingClientRect();
                    const dRect = divider.getBoundingClientRect();
                    const nRect = nav.getBoundingClientRect();
                    const aRect = actions.getBoundingClientRect();
                    const bRect = btn.getBoundingClientRect();
                    const linkMetrics = links.map(a => {
                        const r = a.getBoundingClientRect();
                        const s = window.getComputedStyle(a);
                        return {
                            text: a.textContent.trim(),
                            fontSize: s.fontSize,
                            fontFamily: s.fontFamily,
                            fontWeight: s.fontWeight,
                            textTransform: s.textTransform,
                            letterSpacing: s.letterSpacing,
                            whiteSpace: s.whiteSpace,
                            top: r.top,
                            bottom: r.bottom,
                            left: r.left,
                            right: r.right,
                            width: r.width,
                            height: r.height,
                            isSingleLine: r.height < 35
                        };
                    });

                    const hStyle = window.getComputedStyle(header);
                    const nStyle = window.getComputedStyle(nav);

                    const tops = linkMetrics.map(l => l.top);
                    const allOneLine = tops.length > 0 && tops.every(t => Math.abs(t - tops[0]) < 2);
                    const allLinksSingleLine = linkMetrics.every(l => l.isSingleLine);
                    const inBounds = bRect.right <= hRect.right + 0.5;
                    const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;

                    return {
                        viewportWidth: window.innerWidth,
                        headerBg: hStyle.backgroundColor,
                        headerHeight: Math.round(hRect.height),
                        logoWidth: Math.round(lRect.width),
                        logoHeight: Math.round(lRect.height),
                        dividerWidth: Math.round(dRect.width),
                        dividerHeight: Math.round(dRect.height),
                        btnText: btn.textContent.trim(),
                        btnWidth: Math.round(bRect.width),
                        allOneLine,
                        allLinksSingleLine,
                        inBounds,
                        noOverflow,
                        cushion: Math.round((hRect.right - bRect.right) * 10) / 10,
                        navGap: nStyle.gap,
                        linksCount: links.length,
                        firstLink: linkMetrics[0],
                        linkMetrics
                    };
                })()
                """,
                "returnByValue": True
            })

            data = eval_res["result"]["value"]
            print(f"[1440x900 Desktop Inspection]")
            print(f"  Header: {data['headerHeight']}px, Bg: {data['headerBg']}")
            print(f"  Logo: {data['logoWidth']}x{data['logoHeight']}px, Divider: {data['dividerWidth']}x{data['dividerHeight']}px")
            print(f"  Button: '{data['btnText']}', width: {data['btnWidth']}px, cushion: {data['cushion']}px")
            print(f"  Nav items count: {data['linksCount']}, gap: {data['navGap']}")
            print(f"  Font size: {data['firstLink']['fontSize']}")
            print(f"  Font family: {data['firstLink']['fontFamily']}")
            print(f"  Font weight: {data['firstLink']['fontWeight']}")
            print(f"  Text transform: {data['firstLink']['textTransform']}")
            print(f"  Letter spacing: {data['firstLink']['letterSpacing']}")
            print(f"  All 9 items on ONE line: {data['allOneLine']}")
            print(f"  All links single line (no internal wrap): {data['allLinksSingleLine']}")
            print(f"  In bounds (no clipping): {data['inBounds']}")
            print(f"  No horizontal overflow: {data['noOverflow']}")

            print("\n  Individual Item Breakdown:")
            for l in data["linkMetrics"]:
                print(f"    - {l['text']:<22} | width: {l['width']:5.1f}px | height: {l['height']:4.1f}px | top: {l['top']:4.1f}px | singleLine: {l['isSingleLine']}")

            # Assertions for 1440x900
            assert data["firstLink"]["fontSize"] == "12px", f"Expected 12px font size, got {data['firstLink']['fontSize']}"
            assert data["allOneLine"], "Menu items are not on one line!"
            assert data["allLinksSingleLine"], "Some menu items wrapped internally!"
            assert data["inBounds"], "Button or nav clipped outside header bounds!"
            assert data["noOverflow"], "Horizontal overflow detected!"
            assert data["linksCount"] == 9, f"Expected 9 nav items, got {data['linksCount']}"
            print("\n>>> ALL DESKTOP 1440x900 CHECKS PASSED SUCCESSFULLY! <<<")

            # Capture screenshot of navbar at 1440x900
            os.makedirs(r"C:\STAFFING\test-artifacts", exist_ok=True)
            ss = await call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            with open(r"C:\STAFFING\test-artifacts\navbar-12px-desktop-1440.png", "wb") as f:
                f.write(base64.b64decode(ss["data"]))
            print("Saved screenshot: test-artifacts/navbar-12px-desktop-1440.png")

            # Check other viewports
            print("\n[Cross-Viewport Layout Validation]")
            viewports = [
                ("Large Desktop (1920x1080)", 1920, 1080),
                ("Desktop (1600x900)", 1600, 900),
                ("Desktop (1536x864)", 1536, 864),
                ("Standard Desktop (1440x900)", 1440, 900),
                ("Laptop / Tablet (1366x768)", 1366, 768),
                ("Tablet Landscape (1024x768)", 1024, 768),
                ("Tablet Portrait (768x1024)", 768, 1024),
                ("Mobile (375x667)", 375, 667),
            ]

            for name, w, h in viewports:
                await call("Emulation.setDeviceMetricsOverride", {
                    "width": w,
                    "height": h,
                    "deviceScaleFactor": 1,
                    "mobile": False
                })
                await asyncio.sleep(0.15)
                vp_eval = await call("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const nav = document.querySelector('.talento-nav');
                        const menuBtn = document.querySelector('.talento-menu-btn');
                        const header = document.querySelector('.talento-header');
                        const actions = document.querySelector('.talento-header-actions');
                        const btn = document.querySelector('.talento-btn-nav');
                        const links = Array.from(document.querySelectorAll('.talento-nav a'));

                        const navDisplay = window.getComputedStyle(nav).display;
                        const menuBtnDisplay = window.getComputedStyle(menuBtn).display;

                        const tops = links.map(l => l.getBoundingClientRect().top);
                        const isOneLine = navDisplay === 'none' || (tops.length > 0 && tops.every(t => Math.abs(t - tops[0]) < 2));
                        const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
                        const inBounds = actions.getBoundingClientRect().right <= header.getBoundingClientRect().right + 1;

                        return {
                            navDisplay,
                            menuBtnDisplay,
                            isOneLine,
                            noOverflow,
                            inBounds,
                            scrollWidth: document.documentElement.scrollWidth,
                            innerWidth: window.innerWidth
                        };
                    })()
                    """,
                    "returnByValue": True
                })
                v = vp_eval["result"]["value"]
                status = "PASS" if (v["isOneLine"] and v["noOverflow"] and v["inBounds"]) else "FAIL"
                print(f"  [{status}] {name:<30} | Nav: {v['navDisplay']:<5} | MenuBtn: {v['menuBtnDisplay']:<5} | OneLine: {v['isOneLine']} | InBounds: {v['inBounds']} | NoOverflow: {v['noOverflow']}")
                assert v["isOneLine"] and v["noOverflow"] and v["inBounds"], f"Failed on viewport {name}: {v}"

            print("\n>>> ALL MULTI-VIEWPORT CHECKS PASSED! <<<")

    finally:
        proc.kill()

asyncio.run(verify())
