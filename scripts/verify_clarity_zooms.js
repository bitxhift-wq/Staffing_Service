import fs from 'node:fs';
import { spawn } from 'node:child_process';

const DEBUG_PORT = 9222;

async function checkChrome() {
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    if (res.ok) return true;
  } catch (e) {}
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

async function main() {
  if (!await checkChrome()) {
    await startChrome();
  }
  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  let pageTarget = targets.find(t => t.type === 'page');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

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
  await new Promise(r => setTimeout(r, 2000));

  const zooms = [
    { name: '100_percent', scale: 1.0 },
    { name: '125_percent', scale: 1.25 },
    { name: '150_percent', scale: 1.50 }
  ];

  for (const z of zooms) {
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: z.scale,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));

    // Get logo bounding rect
    const evalRes = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const l = document.querySelector('.header-brand-logo');
        if (!l) return null;
        const r = l.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      })()`,
      returnByValue: true
    });
    console.log('evalRes:', JSON.stringify(evalRes));
    const rect = evalRes?.result?.value ?? evalRes?.value;

    const snap = await sendCDP('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, rect.x - 10),
        y: Math.max(0, rect.y - 10),
        width: rect.width + 20,
        height: rect.height + 20,
        scale: 1
      }
    });

    const buffer = Buffer.from(snap.data, 'base64');
    const outPath = `C:\\Users\\mukhe\\.gemini\\antigravity\\brain\\3ad0fb68-9967-4080-a85f-89701dfcc985\\logo_zoom_${z.name}.png`;
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved: ${outPath} (scale ${z.scale})`);
  }

  // Mobile screenshot
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  const snapMobile = await sendCDP('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 390,
      height: 72,
      scale: 1
    }
  });
  const bufMob = Buffer.from(snapMobile.data, 'base64');
  const mobPath = `C:\\Users\\mukhe\\.gemini\\antigravity\\brain\\3ad0fb68-9967-4080-a85f-89701dfcc985\\logo_mobile_verified.png`;
  fs.writeFileSync(mobPath, bufMob);
  console.log(`Saved: ${mobPath}`);

  ws.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
