import fs from 'node:fs';
import { spawn } from 'node:child_process';

const DEBUG_PORT = 9222;

async function checkChrome() {
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    if (res.ok) return true;
  } catch (e) { }
  return false;
}

async function startChrome() {
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const chromePath = chromePaths.find(p => fs.existsSync(p));
  if (!chromePath) throw new Error('Chrome not found');
  console.log('Starting Chrome headless...');
  spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:\\temp\\chrome_debug_profile_node'
  ], { detached: true, stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await checkChrome()) return;
  }
  throw new Error('Chrome failed to start');
}

async function checkPreview() {
  try {
    const res = await fetch('http://localhost:4173');
    if (res.ok) return true;
  } catch (e) { }
  return false;
}

async function startPreview() {
  console.log('Starting preview server...');
  const proc = spawn('npx', ['vite', 'preview', '--port', '4173'], { shell: true, detached: true });
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await checkPreview()) return proc;
  }
  throw new Error('Preview failed to start');
}

async function main() {
  if (!await checkPreview()) {
    await startPreview();
  }

  if (!await checkChrome()) {
    await startChrome();
  }

  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  let pageTarget = targets.find(t => t.type === 'page');

  if (!pageTarget) {
    const newRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://localhost:4173`);
    pageTarget = await newRes.json();
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCDP('Page.enable');
  await sendCDP('Page.navigate', { url: 'http://localhost:4173' });
  await new Promise(r => setTimeout(r, 1500));

  const jsInspect = `
  (() => {
    const header = document.querySelector('.talento-header');
    const brand = document.querySelector('.talento-brand');
    const logo = document.querySelector('.header-brand-logo');
    const divider = document.querySelector('.talento-header-divider');
    const nav = document.querySelector('.talento-nav');
    const actions = document.querySelector('.talento-header-actions');
    const links = Array.from(document.querySelectorAll('.talento-nav a'));
    
    const hRect = header ? header.getBoundingClientRect() : null;
    const bRect = brand ? brand.getBoundingClientRect() : null;
    const lRect = logo ? logo.getBoundingClientRect() : null;
    const dRect = divider ? divider.getBoundingClientRect() : null;
    const nRect = nav ? nav.getBoundingClientRect() : null;
    const aRect = actions ? actions.getBoundingClientRect() : null;
    
    const firstRect = links.length > 0 ? links[0].getBoundingClientRect() : null;
    const lastRect = links.length > 0 ? links[links.length - 1].getBoundingClientRect() : null;
    
    const dividerRight = dRect ? dRect.right : 0;
    const actionsLeft = aRect ? aRect.left : 0;
    const navAvailableWidth = (actionsLeft && dividerRight) ? (actionsLeft - dividerRight) : 0;
    
    const firstLinkLeft = firstRect ? firstRect.left : 0;
    const lastLinkRight = lastRect ? lastRect.right : 0;
    const navGroupWidth = (lastLinkRight && firstLinkLeft) ? (lastLinkRight - firstLinkLeft) : 0;
    
    const navLeftGap = (firstLinkLeft && dividerRight) ? (firstLinkLeft - dividerRight) : 0;
    const navRightGap = (actionsLeft && lastLinkRight) ? (actionsLeft - lastLinkRight) : 0;
    const navCenterDelta = Math.abs(navLeftGap - navRightGap);
    
    return {
      viewportWidth: window.innerWidth,
      logo: {
        left: lRect ? Math.round(lRect.left * 100)/100 : 0,
        right: lRect ? Math.round(lRect.right * 100)/100 : 0,
        width: lRect ? Math.round(lRect.width * 100)/100 : 0
      },
      divider: {
        left: dRect ? Math.round(dRect.left * 100)/100 : 0,
        right: dRect ? Math.round(dRect.right * 100)/100 : 0,
        display: dRect ? getComputedStyle(divider).display : 'none'
      },
      actions: {
        left: aRect ? Math.round(aRect.left * 100)/100 : 0,
        right: aRect ? Math.round(aRect.right * 100)/100 : 0,
        width: aRect ? Math.round(aRect.width * 100)/100 : 0
      },
      navigationContainer: {
        dividerRight: Math.round(dividerRight * 100)/100,
        actionsLeft: Math.round(actionsLeft * 100)/100,
        availableWidth: Math.round(navAvailableWidth * 100)/100,
        navElementWidth: nRect ? Math.round(nRect.width * 100)/100 : 0
      },
      navigationLinks: {
        firstLink: links[0]?.textContent?.trim(),
        firstLinkLeft: Math.round(firstLinkLeft * 100)/100,
        lastLink: links[links.length - 1]?.textContent?.trim(),
        lastLinkRight: Math.round(lastLinkRight * 100)/100,
        groupWidth: Math.round(navGroupWidth * 100)/100,
        leftGapToDivider: Math.round(navLeftGap * 100)/100,
        rightGapToActions: Math.round(navRightGap * 100)/100,
        centerDelta: Math.round(navCenterDelta * 100)/100,
        isCentered: navCenterDelta <= 1.0
      }
    };
  })()
  `;

  const viewports = [
    { name: 'Desktop 1440x900', width: 1440, height: 900, mobile: false },
    { name: 'Desktop 1920x1080', width: 1920, height: 1080, mobile: false },
    { name: 'Desktop 1280x800', width: 1280, height: 800, mobile: false }
  ];

  for (const vp of viewports) {
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise(r => setTimeout(r, 500));

    const evalRes = await sendCDP('Runtime.evaluate', {
      expression: jsInspect,
      returnByValue: true
    });
    const resVal = evalRes.result?.value ?? evalRes.value ?? evalRes;
    console.log(`\n=== Viewport: ${vp.name} ===`);
    console.log(JSON.stringify(resVal, null, 2));
  }

  // Screenshot at 1440x900
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 500));
  const snap = await sendCDP('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1440,
      height: 90,
      scale: 1
    }
  });

  const buffer = Buffer.from(snap.data, 'base64');
  const outPath = 'C:\\Users\\mukhe\\.gemini\antigravity\\brain\\3ad0fb68-9967-4080-a85f-89701dfcc985\\navbar_navigation_centered_verified.png';
  fs.writeFileSync(outPath, buffer);
  console.log(`\nVerified navbar screenshot saved to: ${outPath}`);

  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
