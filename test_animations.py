import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\STAFFING\.tmp-chrome-anim"
PORT = 9666
BASE_URL = "http://localhost:4173"

async def run_animation_tests():
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
        "--disable-extensions",
        "--window-size=1440,900"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        res = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(res.read().decode())
        page_targets = [t for t in targets if t.get("type") == "page"]
        ws_url = page_targets[0]["webSocketDebuggerUrl"] if page_targets else targets[0]["webSocketDebuggerUrl"]

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

            print("=" * 70)
            print("SMRIKAAM TALENTO – PREMIUM ENTERPRISE IT ANIMATION AUDIT")
            print("=" * 70)

            results = []
            def record(test_name, passed, details=""):
                status = "PASS" if passed else "FAIL"
                results.append((test_name, passed, details))
                print(f"[{status}] {test_name}")
                if details:
                    print(f"       -> {details}")

            # -------------------------------------------------------------
            # TEST 1: Page-Open & Body Animation Activation
            # -------------------------------------------------------------
            print("\n1. Navigating to Homepage and checking page-open animations...")
            await send("Page.navigate", {"url": BASE_URL + "/"})
            await asyncio.sleep(1.2)

            page_open_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    hasAnimatedClass: document.body.classList.contains('talento-animated'),
                    heroImgScale: window.getComputedStyle(document.querySelector('.talento-hero-img-wrap')).animationName,
                    heroTitleAnim: window.getComputedStyle(document.querySelector('.talento-hero-title .talento-title-line')).animationName,
                    eyebrowLineAnim: window.getComputedStyle(document.querySelector('.talento-hero .talento-eyebrow-line')).animationName,
                    facetDriftAnim: window.getComputedStyle(document.querySelector('.talento-hero-bg-facet')).animationName,
                    fontFamily: window.getComputedStyle(document.querySelector('.talento-hero-title')).fontFamily
                })
                """,
                "returnByValue": True
            })
            p_val = page_open_eval["result"]["value"]
            record("1. Page-Open Entrance Animations & Body Activation",
                   p_val["hasAnimatedClass"] and "heroScaleReveal" in p_val["heroImgScale"] and "heroFadeUp" in p_val["heroTitleAnim"],
                   f"body.talento-animated: {p_val['hasAnimatedClass']}, TitleAnim: '{p_val['heroTitleAnim']}', ImgAnim: '{p_val['heroImgScale']}', FacetDrift: '{p_val['facetDriftAnim']}'")

            # -------------------------------------------------------------
            # TEST 2: Strict Typography Preservation
            # -------------------------------------------------------------
            print("\n2. Verifying Typography Preservation...")
            typo_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    heroTitleFont: window.getComputedStyle(document.querySelector('.talento-hero-title')).fontFamily,
                    heroTitleWeight: window.getComputedStyle(document.querySelector('.talento-hero-title')).fontWeight,
                    bodyFont: window.getComputedStyle(document.body).fontFamily,
                    monoFont: window.getComputedStyle(document.querySelector('.talento-btn')).fontFamily,
                    heroTitleText: document.querySelector('.talento-hero-title').innerText.replace(/\\s+/g, ' ').trim()
                })
                """,
                "returnByValue": True
            })
            t_val = typo_eval["result"]["value"]
            record("2. Strict Typography Preservation",
                   t_val["heroTitleWeight"] in ["700", "800", "bold"] and "TECHNICAL TALENT" in t_val["heroTitleText"],
                   f"Heading Weight: {t_val['heroTitleWeight']}, Font: {t_val['heroTitleFont'][:40]}, Text: '{t_val['heroTitleText']}'")

            # -------------------------------------------------------------
            # TEST 3: Scroll-Based Animations & Intersection Observer
            # -------------------------------------------------------------
            print("\n3. Testing Scroll-Triggered Reveals via IntersectionObserver...")
            # Scroll down to Practice Areas
            await send("Runtime.evaluate", {"expression": "document.getElementById('technology-areas')?.scrollIntoView()"})
            await asyncio.sleep(0.8)

            scroll_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    modelsRevealed: document.getElementById('models')?.classList.contains('is-revealed'),
                    techRevealed: document.getElementById('practice-areas')?.classList.contains('is-revealed'),
                    dividerWidth: window.getComputedStyle(document.querySelector('.talento-title-divider')).width,
                    firstChecklistOpacity: window.getComputedStyle(document.querySelector('.talento-checklist li')).opacity
                })
                """,
                "returnByValue": True
            })
            s_val = scroll_eval["result"]["value"]
            record("3. Scroll-Based Intersection Observer & Section Reveals",
                   s_val["techRevealed"] and s_val["firstChecklistOpacity"] == "1",
                   f"TechSection revealed: {s_val['techRevealed']}, Checklist Item Opacity: {s_val['firstChecklistOpacity']}, DividerWidth: {s_val['dividerWidth']}")

            # -------------------------------------------------------------
            # TEST 4: IT-Related Animation Language (All 8 Practice Areas)
            # -------------------------------------------------------------
            print("\n4. Verifying IT-Themed Micro-Animations across all 8 Cards...")
            tech_cards_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    card1_bracketL: window.getComputedStyle(document.querySelector('.it-anim-bracket-left'))?.animationName,
                    card1_bracketR: window.getComputedStyle(document.querySelector('.it-anim-bracket-right'))?.animationName,
                    card1_cursor: window.getComputedStyle(document.querySelector('.it-anim-code-cursor'))?.animationName,
                    card2_core: window.getComputedStyle(document.querySelector('.it-anim-chip-core'))?.animationName,
                    card2_pin: window.getComputedStyle(document.querySelector('.it-anim-neural-pin'))?.animationName,
                    card3_stream: window.getComputedStyle(document.querySelector('.it-anim-data-stream'))?.animationName,
                    card3_particle: window.getComputedStyle(document.querySelector('.it-anim-data-particle'))?.animationName,
                    card4_pipeline: window.getComputedStyle(document.querySelector('.it-anim-pipeline-line'))?.animationName,
                    card4_server: window.getComputedStyle(document.querySelector('.it-anim-server-status'))?.animationName,
                    card5_shield: window.getComputedStyle(document.querySelector('.it-anim-shield-check'))?.animationName,
                    card5_scan: window.getComputedStyle(document.querySelector('.it-anim-scan-line'))?.animationName,
                    card6_wave_inner: window.getComputedStyle(document.querySelector('.it-anim-iot-wave-inner'))?.animationName,
                    card6_wave_outer: window.getComputedStyle(document.querySelector('.it-anim-iot-wave-outer'))?.animationName,
                    card7_wf_top: window.getComputedStyle(document.querySelector('.it-anim-wf-top'))?.animationName,
                    card7_wf_bot: window.getComputedStyle(document.querySelector('.it-anim-wf-bot'))?.animationName,
                    card8_gear: window.getComputedStyle(document.querySelector('.it-anim-gear'))?.animationName
                })
                """,
                "returnByValue": True
            })
            c_val = tech_cards_eval["result"]["value"]
            all_it_anims_present = (
                "itBracketLeft" in str(c_val["card1_bracketL"]) and
                "itTerminalCursor" in str(c_val["card1_cursor"]) and
                "itNeuralPulse" in str(c_val["card2_core"]) and
                "itDataStreamFlow" in str(c_val["card3_stream"]) and
                "itPipelineMove" in str(c_val["card4_pipeline"]) and
                "itShieldPulse" in str(c_val["card5_shield"]) and
                "itSignalWaveInner" in str(c_val["card6_wave_inner"]) and
                "itWorkflowStep1" in str(c_val["card7_wf_top"]) and
                "itGearRotate" in str(c_val["card8_gear"])
            )
            record("4. IT-Related Animation Language (8 Specialized Domains)",
                   all_it_anims_present,
                   f"CodeBracket: '{c_val['card1_bracketL']}', AI Neural: '{c_val['card2_core']}', DataStream: '{c_val['card3_stream']}', DevOps: '{c_val['card4_pipeline']}', CyberShield: '{c_val['card5_shield']}', IoT Wave: '{c_val['card6_wave_inner']}', Gear: '{c_val['card8_gear']}'")

            # -------------------------------------------------------------
            # TEST 5: Interactive Hover Transitions
            # -------------------------------------------------------------
            print("\n5. Testing Interactive Hover Interactions...")
            hover_eval = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    // Check button arrow transition
                    const btn = document.querySelector('.talento-btn');
                    const arrow = document.querySelector('.talento-btn .talento-arrow');
                    const arrowTrans = window.getComputedStyle(arrow).transition;

                    // Check image zoom transition
                    const img = document.querySelector('.talento-model-img');
                    const imgTrans = window.getComputedStyle(img).transition;

                    // Check card hover elevation rule exists
                    const card = document.querySelector('.talento-tech-card');
                    const cardTrans = window.getComputedStyle(card).transition;

                    return {
                        hasArrowTrans: arrowTrans.includes('transform'),
                        hasImgTrans: imgTrans.includes('transform'),
                        hasCardTrans: cardTrans.includes('transform')
                    };
                })()
                """,
                "returnByValue": True
            })
            h_val = hover_eval["result"]["value"]
            record("5. Interactive Hover Transitions (Arrow, Image Zoom, Card Elevation)",
                   h_val["hasArrowTrans"] and h_val["hasImgTrans"] and h_val["hasCardTrans"],
                   f"ArrowTrans: {h_val['hasArrowTrans']}, ImgZoomTrans: {h_val['hasImgTrans']}, CardElevTrans: {h_val['hasCardTrans']}")

            # -------------------------------------------------------------
            # TEST 6: FAQ Accordion Animation & Location Radar Pulse
            # -------------------------------------------------------------
            print("\n6. Testing FAQ Accordion & Location Radar Indicator...")
            # Scroll to FAQ
            await send("Runtime.evaluate", {"expression": "document.getElementById('faq')?.scrollIntoView()"})
            await asyncio.sleep(0.5)

            # Click FAQ item 2
            await send("Runtime.evaluate", {"expression": "document.querySelectorAll('.talento-faq-trigger')[1].click()"})
            await asyncio.sleep(0.4)

            faq_anim_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    faqPanelAnim: window.getComputedStyle(document.getElementById('faq-p-1')).animationName,
                    faqToggleTransform: window.getComputedStyle(document.querySelectorAll('.talento-faq-item')[1].querySelector('.talento-faq-toggle')).transform,
                    hasRadarPulseDot: !!document.querySelector('.talento-radar-dot'),
                    radarDotAnim: window.getComputedStyle(document.querySelector('.talento-radar-dot'), '::after')?.animationName
                })
                """,
                "returnByValue": True
            })
            f_val = faq_anim_eval["result"]["value"]
            record("6. FAQ Accordion Animation & Location Radar Indicator",
                   "faqPanelSlide" in str(f_val["faqPanelAnim"]) and f_val["hasRadarPulseDot"],
                   f"FAQ SlideAnim: '{f_val['faqPanelAnim']}', ToggleTransform: '{f_val['faqToggleTransform']}', RadarDotPresent: {f_val['hasRadarPulseDot']}")

            # -------------------------------------------------------------
            # TEST 7: Dedicated Route Entrance Animations (/executive-search)
            # -------------------------------------------------------------
            print("\n7. Testing Dedicated Route Page-Open Animations (/executive-search)...")
            await send("Page.navigate", {"url": BASE_URL + "/executive-search"})
            await asyncio.sleep(1.2)

            exec_anim_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    modelNameAnim: window.getComputedStyle(document.querySelector('.talento-model-name')).animationName,
                    imgWrapAnim: window.getComputedStyle(document.querySelector('.talento-model-img-wrap')).animationName,
                    taglineAnim: window.getComputedStyle(document.querySelector('.talento-model-tagline')).animationName
                })
                """,
                "returnByValue": True
            })
            ex_val = exec_anim_eval["result"]["value"]
            record("7. Dedicated Route Page-Open Animations (/executive-search)",
                   "heroFadeUp" in str(ex_val["modelNameAnim"]) and "heroScaleReveal" in str(ex_val["imgWrapAnim"]),
                   f"ModelNameAnim: '{ex_val['modelNameAnim']}', ImgWrapAnim: '{ex_val['imgWrapAnim']}', TaglineAnim: '{ex_val['taglineAnim']}'")

            # -------------------------------------------------------------
            # TEST 8: Mobile Responsive Animation Adaptations (390x844)
            # -------------------------------------------------------------
            print("\n8. Testing Mobile Viewport Animation Optimizations (390x844)...")
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(0.5)

            await send("Page.navigate", {"url": BASE_URL + "/"})
            await asyncio.sleep(1.0)

            mob_anim_eval = await send("Runtime.evaluate", {
                "expression": """
                ({
                    scrollOverflowX: document.documentElement.scrollWidth <= window.innerWidth,
                    bodyAnimated: document.body.classList.contains('talento-animated')
                })
                """,
                "returnByValue": True
            })
            m_val = mob_anim_eval["result"]["value"]
            record("8. Mobile Viewport Animation Adaptation & Overflow Safety",
                   m_val["scrollOverflowX"] and m_val["bodyAnimated"],
                   f"Zero Horizontal Overflow: {m_val['scrollOverflowX']}, AnimatedClass: {m_val['bodyAnimated']}")

            print("=" * 70)
            passed_count = sum(1 for _, p, _ in results if p)
            total_count = len(results)
            print(f"ANIMATION AUDIT SUMMARY: {passed_count}/{total_count} CHECKS PASSED")
            print("=" * 70)
            return passed_count == total_count

    finally:
        proc.terminate()

if __name__ == "__main__":
    success = asyncio.run(run_animation_tests())
    exit(0 if success else 1)
