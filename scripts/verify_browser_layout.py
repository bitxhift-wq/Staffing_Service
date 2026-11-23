import json
import time
import subprocess
import urllib.request
import urllib.error
import os
import websocket

# Check preview server
try:
    with urllib.request.urlopen('http://localhost:4173', timeout=3) as resp:
        print(f"Preview server HTTP status: {resp.status}")
except Exception as e:
    print(f"Preview server not responding: {e}. Starting preview...")
    # Spawn preview in background
    subprocess.Popen(["npm", "run", "preview", "--", "--port", "4173"], shell=True)
    time.sleep(3)

# Find or launch Chrome with remote debugging
DEBUG_PORT = 9222
try:
    with urllib.request.urlopen(f'http://localhost:{DEBUG_PORT}/json/version', timeout=2) as r:
        pass
    print("Chrome debugger already available.")
except Exception:
    print("Launching Headless Chrome on port 9222...")
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    subprocess.Popen([
        chrome_path,
        f"--remote-debugging-port={DEBUG_PORT}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--user-data-dir=C:\\temp\\chrome_debug_profile"
    ])
    time.sleep(3)

# Connect to CDP
targets = json.loads(urllib.request.urlopen(f'http://localhost:{DEBUG_PORT}/json', timeout=5).read().decode('utf-8'))
page_targets = [t for t in targets if t.get('type') == 'page']
if not page_targets:
    # create new tab
    new_tab = json.loads(urllib.request.urlopen(f'http://localhost:{DEBUG_PORT}/json/new?http://localhost:4173', timeout=5).read().decode('utf-8'))
    ws_url = new_tab['webSocketDebuggerUrl']
else:
    ws_url = page_targets[0]['webSocketDebuggerUrl']

ws = websocket.create_connection(ws_url, timeout=10)
msg_id = 1

def send_cdp(method, params=None):
    global msg_id
    payload = {"id": msg_id, "method": method, "params": params or {}}
    ws.send(json.dumps(payload))
    msg_id += 1
    while True:
        resp = json.loads(ws.recv())
        if resp.get("id") == payload["id"]:
            return resp

# Enable Page
send_cdp("Page.enable")
send_cdp("Page.navigate", {"url": "http://localhost:4173"})
time.sleep(2)

viewports = [
    {"name": "Desktop 1440x900", "width": 1440, "height": 900},
    {"name": "Desktop 1920x1080", "width": 1920, "height": 1080},
    {"name": "Tablet 768x1024", "width": 768, "height": 1024},
    {"name": "Mobile 390x844", "width": 390, "height": 844}
]

js_inspect = """
(() => {
    const header = document.querySelector('.talento-header');
    const brand = document.querySelector('.talento-brand');
    const logo = document.querySelector('.header-brand-logo');
    const divider = document.querySelector('.talento-header-divider');
    const nav = document.querySelector('.talento-nav');
    
    const hRect = header ? header.getBoundingClientRect() : null;
    const bRect = brand ? brand.getBoundingClientRect() : null;
    const lRect = logo ? logo.getBoundingClientRect() : null;
    const dRect = divider ? divider.getBoundingClientRect() : null;
    
    const brandSectionWidth = (hRect && dRect && dRect.width > 0) ? (dRect.left - hRect.left) : (bRect ? bRect.width : 0);
    const leftSpace = (hRect && lRect) ? (lRect.left - hRect.left) : 0;
    const rightSpace = (dRect && lRect && dRect.width > 0) ? (dRect.left - lRect.right) : 0;
    
    return {
        header: hRect ? { width: hRect.width, height: hRect.height, left: hRect.left, top: hRect.top } : null,
        brand: bRect ? { width: bRect.width, height: bRect.height, left: bRect.left, top: bRect.top } : null,
        logo: lRect ? { width: lRect.width, height: lRect.height, left: lRect.left, right: lRect.right, top: lRect.top, bottom: lRect.bottom } : null,
        divider: dRect ? { width: dRect.width, height: dRect.height, left: dRect.left, top: dRect.top, visible: getComputedStyle(divider).display !== 'none' } : null,
        brandSectionWidth: brandSectionWidth,
        leftSpace: leftSpace,
        rightSpace: rightSpace,
        horizontalDelta: Math.abs(leftSpace - rightSpace),
        verticalCenterLogo: lRect ? (lRect.top + lRect.height / 2) : 0,
        verticalCenterHeader: hRect ? (hRect.top + hRect.height / 2) : 0,
        logoNaturalWidth: logo ? logo.naturalWidth : 0,
        logoNaturalHeight: logo ? logo.naturalHeight : 0,
        logoComplete: logo ? logo.complete : false
    };
})()
"""

results = {}
for vp in viewports:
    send_cdp("Emulation.setDeviceMetricsOverride", {
        "width": vp["width"],
        "height": vp["height"],
        "deviceScaleFactor": 1,
        "mobile": vp["width"] <= 768
    })
    time.sleep(0.5)
    eval_res = send_cdp("Runtime.evaluate", {
        "expression": js_inspect,
        "returnByValue": True
    })
    res_val = eval_res.get("result", {}).get("value")
    results[vp["name"]] = res_val
    print(f"\n--- {vp['name']} ---")
    print(json.dumps(res_val, indent=2))

# Take a screenshot of the navbar at Desktop 1440x900
send_cdp("Emulation.setDeviceMetricsOverride", {
    "width": 1440,
    "height": 900,
    "deviceScaleFactor": 1,
    "mobile": False
})
time.sleep(0.5)
screenshot = send_cdp("Page.captureScreenshot", {
    "format": "png",
    "clip": {
        "x": 0,
        "y": 0,
        "width": 1440,
        "height": 110,
        "scale": 1
    }
})

import base64
shot_data = base64.b64decode(screenshot["result"]["data"])
shot_path = r"C:\Users\mukhe\.gemini\antigravity\brain\3ad0fb68-9967-4080-a85f-89701dfcc985\navbar_applied_merit_verified.png"
with open(shot_path, "wb") as f:
    f.write(shot_data)
print(f"\nScreenshot saved to {shot_path}")

ws.close()
