import fs from 'node:fs';

const DEBUG_PORT = 9222;
const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
const targets = await targetsRes.json();
const pageTarget = targets.find(t => t.type === 'page');

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const curId = id++;
    const handler = (ev) => {
      const d = JSON.parse(ev.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

const js = `(() => {
  const divider = document.querySelector('.talento-header-divider');
  const actions = document.querySelector('.talento-header-actions');
  const nav = document.querySelector('.talento-nav');
  const links = Array.from(document.querySelectorAll('.talento-nav a'));
  
  const dRect = divider.getBoundingClientRect();
  const aRect = actions.getBoundingClientRect();
  const nRect = nav.getBoundingClientRect();
  const firstRect = links[0].getBoundingClientRect();
  const lastRect = links[links.length - 1].getBoundingClientRect();
  
  const startX = dRect.right;
  const endX = aRect.left;
  const availableWidth = endX - startX;
  const navGroupWidth = lastRect.right - firstRect.left;
  
  return {
    dividerRight: Math.round(dRect.right * 100) / 100,
    actionsLeft: Math.round(aRect.left * 100) / 100,
    availableWidth: Math.round(availableWidth * 100) / 100,
    firstLinkLeft: Math.round(firstRect.left * 100) / 100,
    lastLinkRight: Math.round(lastRect.right * 100) / 100,
    navGroupWidth: Math.round(navGroupWidth * 100) / 100,
    leftGap: Math.round((firstRect.left - dRect.right) * 100) / 100,
    rightGap: Math.round((aRect.left - lastRect.right) * 100) / 100,
    delta: Math.round(( (firstRect.left - dRect.right) - (aRect.left - lastRect.right) ) * 100) / 100
  };
})()`;

const res = await send('Runtime.evaluate', { expression: js, returnByValue: true });
console.log('--- 1440px Viewport Measurement ---');
console.log(JSON.stringify(res.result.value, null, 2));

ws.close();
process.exit(0);
