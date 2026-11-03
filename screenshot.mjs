import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const phones = [
  { id: 'home',     width: 210, height: 420 },
  { id: 'scan',     width: 230, height: 468 },
  { id: 'earnings', width: 210, height: 420 },
];

// Shared styles (fonts + all the as-* classes from the main stylesheet)
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: transparent; margin: 0; padding: 0; }

  .phone-frame-wrap {
    background: #1A1917;
    border-radius: 36px;
    padding: 14px;
    position: relative;
    box-shadow: 0 32px 80px rgba(26,25,23,.28), 0 8px 24px rgba(26,25,23,.16);
    display: inline-block;
  }
  .phone-notch {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: 52px;
    height: 5px;
    background: rgba(255,255,255,.13);
    border-radius: 4px;
    z-index: 2;
  }
  .phone-screen-inner {
    background: #F8F7F4;
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    color: #1A1917;
    padding: 22px 12px 12px;
    gap: 7px;
  }

  /* Home screen */
  .as-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:2px; }
  .as-greeting { font-size:8px; color:#A8A49D; margin-bottom:1px; }
  .as-brand    { font-size:14px; font-weight:800; color:#1A1917; }
  .as-avatar   { width:26px; height:26px; background:#C8E44A; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#1A1917; flex-shrink:0; }
  .as-sold-alert { display:flex; align-items:center; gap:6px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:7px 8px; }
  .as-sold-dot { width:6px; height:6px; background:#16A34A; border-radius:3px; flex-shrink:0; }
  .as-sold-info { flex:1; min-width:0; }
  .as-sold-title { font-size:8px; font-weight:700; color:#16A34A; }
  .as-sold-body  { font-size:7.5px; color:#6B6760; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .as-sold-arrow { font-size:13px; color:#16A34A; }
  .as-stats-row { display:flex; gap:6px; }
  .as-stat-tile { flex:1; background:#fff; border:1px solid #E4E1DA; border-radius:10px; padding:8px 6px; text-align:center; }
  .as-stat-val  { font-size:14px; font-weight:800; color:#1A1917; line-height:1; }
  .as-stat-lbl  { font-size:7px; color:#A8A49D; margin-top:2px; }
  .as-section-hdr { display:flex; justify-content:space-between; align-items:center; font-size:9px; font-weight:700; color:#1A1917; }
  .as-link { color:#8CB800; font-weight:600; }
  .as-item-row { display:flex; align-items:center; gap:7px; background:#fff; border:1px solid #E4E1DA; border-radius:9px; padding:7px 8px; }
  .as-item-emoji { font-size:14px; flex-shrink:0; }
  .as-item-info  { flex:1; min-width:0; }
  .as-item-name  { font-size:8.5px; font-weight:700; color:#1A1917; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .as-item-meta  { font-size:7px; color:#A8A49D; margin-top:1px; }
  .as-item-price { font-size:11px; font-weight:800; color:#1A1917; flex-shrink:0; }
  .as-boxes-row  { display:flex; gap:5px; overflow:hidden; }
  .as-box-tile   { flex:1; background:#fff; border:1px solid #E4E1DA; border-radius:9px; padding:7px 6px; min-width:0; }
  .as-box-tile--new { display:flex; flex-direction:column; align-items:center; justify-content:center; border-style:dashed; border-color:#C9C5BC; }
  .as-box-lbl    { font-size:8.5px; font-weight:800; color:#1A1917; }
  .as-box-loc    { font-size:7px; color:#A8A49D; margin-top:1px; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .as-box-cnt    { font-size:7px; color:#6B6760; margin-bottom:5px; }
  .as-box-bar    { height:3px; background:#E8E5DF; border-radius:3px; overflow:hidden; }
  .as-box-bar-fill { height:100%; background:#C8E44A; border-radius:3px; }
  .as-box-plus   { font-size:14px; color:#A8A49D; }
  .as-box-new-lbl { font-size:7px; color:#A8A49D; margin-top:2px; }

  /* Scan result screen */
  .as-toprow { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .as-back   { width:24px; height:24px; background:#E8E5DF; border:1px solid #E4E1DA; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .as-screen-title { font-size:14px; font-weight:800; color:#1A1917; }
  .as-scan-card  { background:#fff; border:1px solid #E4E1DA; border-radius:12px; overflow:hidden; }
  .as-scan-photo { height:80px; background:#EDE8DF; display:flex; align-items:center; justify-content:center; font-size:40px; position:relative; }
  .as-scan-photo::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom,transparent 50%,rgba(0,0,0,.06)); }
  .as-ai-tag  { display:inline-block; background:#F3FAE1; border:1px solid rgba(200,228,74,.35); border-radius:100px; padding:2px 8px; font-size:7.5px; font-weight:800; color:#8CB800; letter-spacing:.3px; margin:7px 8px 3px; }
  .as-scan-name { font-size:11px; font-weight:800; color:#1A1917; padding:0 8px; }
  .as-scan-desc { font-size:8px; color:#6B6760; padding:3px 8px; line-height:1.5; }
  .as-scan-cond { font-size:7.5px; color:#A8A49D; padding:3px 8px 8px; }
  .as-scan-cond span { color:#1A1917; }
  .as-price-block { background:#fff; border:1px solid #E4E1DA; border-radius:10px; overflow:hidden; }
  .as-price-row   { display:flex; justify-content:space-between; align-items:center; padding:7px 10px; }
  .as-price-row--border { border-top:1px solid #E4E1DA; }
  .as-price-lbl   { font-size:8px; color:#6B6760; }
  .as-price-val   { font-size:16px; font-weight:800; color:#C8E44A; }
  .as-conf        { font-size:8px; font-weight:700; color:#1A1917; }
  .as-assign-lbl  { font-size:8px; color:#6B6760; }
  .as-chips-row   { display:flex; gap:5px; flex-wrap:wrap; }
  .as-chip        { background:#fff; border:1.5px solid #E4E1DA; border-radius:8px; padding:4px 8px; font-size:8px; font-weight:800; color:#1A1917; }
  .as-chip--on    { background:#F3FAE1; border-color:#AECC40; color:#4A6600; }
  .as-chip--dash  { border-style:dashed; border-color:#C9C5BC; color:#6B6760; }
  .as-ai-lbl-row  { display:inline-block; background:#F3FAE1; border:1px solid rgba(200,228,74,.2); border-radius:100px; padding:2px 8px; font-size:7.5px; font-weight:800; color:#8CB800; letter-spacing:.3px; }
  .as-ch-card     { background:rgba(200,228,74,.03); border:1px solid rgba(200,228,74,.25); border-radius:11px; padding:8px; }
  .as-best-badge  { background:#F3FAE1; border-radius:100px; padding:2px 7px; font-size:7px; font-weight:800; color:#8CB800; display:inline-block; margin-bottom:6px; }
  .as-ch-top      { display:flex; align-items:flex-start; gap:7px; margin-bottom:7px; }
  .as-ch-logo     { width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .as-ch-mid      { flex:1; min-width:0; }
  .as-ch-name     { font-size:9px; font-weight:800; color:#1A1917; }
  .as-ch-reason   { font-size:7px; color:#6B6760; margin-top:1px; line-height:1.4; }
  .as-ch-earn     { text-align:right; flex-shrink:0; }
  .as-ch-price    { font-size:12px; font-weight:800; color:#1A1917; }
  .as-ch-earn-lbl { font-size:6.5px; color:#A8A49D; margin-top:1px; }
  .as-bar-row     { display:flex; align-items:center; gap:5px; margin-bottom:4px; }
  .as-bar-lbl     { font-size:7px; font-weight:700; color:#A8A49D; width:34px; }
  .as-bar-track   { flex:1; height:3px; background:#E8E5DF; border-radius:3px; overflow:hidden; }
  .as-bar-fill    { height:100%; border-radius:3px; }
  .as-bar-pct     { font-size:7px; font-weight:800; color:#6B6760; width:22px; text-align:right; }
  .as-ch-btn      { background:#E53238; border-radius:8px; text-align:center; padding:7px; font-size:8.5px; font-weight:800; color:#fff; margin-top:7px; }
  .as-save-btn    { background:#1A1917; border-radius:10px; text-align:center; padding:10px; font-size:9px; font-weight:800; color:#C8E44A; margin-top:auto; }

  /* Earnings screen */
  .as-earnings-header { display:flex; flex-direction:column; gap:7px; }
  .as-period-tabs { display:flex; gap:4px; }
  .as-period      { flex:1; text-align:center; padding:4px 0; border-radius:6px; font-size:7px; font-weight:700; color:#A8A49D; background:#F2F0EC; }
  .as-period--on  { background:#C8E44A; color:#1A1917; }
  .as-hero-card   { background:#1A1917; border-radius:12px; padding:10px; color:#fff; }
  .as-hero-lbl    { font-size:7.5px; color:#A8A49D; margin-bottom:2px; }
  .as-hero-amt    { font-size:22px; font-weight:800; color:#C8E44A; line-height:1; margin-bottom:8px; }
  .as-hero-sub-row { display:flex; align-items:center; border-top:1px solid rgba(255,255,255,.08); padding-top:8px; }
  .as-hero-sub    { flex:1; text-align:center; }
  .as-hero-sub-val { font-size:10px; font-weight:800; color:#fff; }
  .as-hero-sub-lbl { font-size:6.5px; color:#A8A49D; margin-top:1px; }
  .as-hero-divider { width:1px; height:24px; background:rgba(255,255,255,.1); }
  .as-section-sm  { font-size:8.5px; font-weight:700; color:#1A1917; }
  .as-chart       { display:flex; align-items:flex-end; gap:4px; height:56px; background:#fff; border:1px solid #E4E1DA; border-radius:10px; padding:8px 8px 6px; }
  .as-chart-col   { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; height:100%; justify-content:flex-end; }
  .as-chart-bar   { width:100%; background:#C8E44A; border-radius:3px 3px 0 0; min-height:3px; }
  .as-chart-amt   { font-size:6px; font-weight:700; color:#A8A49D; white-space:nowrap; }
  .as-ch-break    { display:flex; flex-direction:column; gap:5px; background:#fff; border:1px solid #E4E1DA; border-radius:10px; padding:8px; }
  .as-ch-break-row { display:flex; align-items:center; gap:5px; }
  .as-ch-dot      { width:6px; height:6px; border-radius:3px; flex-shrink:0; }
  .as-ch-emoji-sm { font-size:10px; flex-shrink:0; }
  .as-ch-name-sm  { font-size:7.5px; font-weight:700; color:#1A1917; width:28px; flex-shrink:0; }
  .as-ch-bar-track { flex:1; height:4px; background:#E8E5DF; border-radius:4px; overflow:hidden; }
  .as-ch-bar-fill { height:100%; border-radius:4px; }
  .as-ch-amt-sm   { font-size:7.5px; font-weight:800; color:#1A1917; flex-shrink:0; }
  .as-potential-card { display:flex; align-items:center; gap:7px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:8px; font-size:8px; margin-top:auto; }
  .as-potential-title { font-size:8.5px; font-weight:800; color:#1A1917; }
  .as-potential-sub   { font-size:7px; color:#6B6760; margin-top:1px; }
`;

const screens = {
  home: `
    <div class="as-header">
      <div><div class="as-greeting">Good morning, Neel 👋</div><div class="as-brand">Retriv</div></div>
      <div class="as-avatar">N</div>
    </div>
    <div class="as-sold-alert">
      <div class="as-sold-dot"></div>
      <div class="as-sold-info">
        <div class="as-sold-title">Item sold on eBay 🎉</div>
        <div class="as-sold-body">Polaroid 600 · £85 — tap to locate</div>
      </div>
      <div class="as-sold-arrow">›</div>
    </div>
    <div class="as-stats-row">
      <div class="as-stat-tile"><div class="as-stat-val">24</div><div class="as-stat-lbl">In storage</div></div>
      <div class="as-stat-tile"><div class="as-stat-val">8</div><div class="as-stat-lbl">On eBay</div></div>
      <div class="as-stat-tile"><div class="as-stat-val">£847</div><div class="as-stat-lbl">Earned</div></div>
    </div>
    <div class="as-section-hdr"><span>Recent items</span><span class="as-link">See all →</span></div>
    <div class="as-item-row">
      <div class="as-item-emoji">📸</div>
      <div class="as-item-info"><div class="as-item-name">Polaroid 600 Camera</div><div class="as-item-meta">Good · Box A3</div></div>
      <div class="as-item-price">£85</div>
    </div>
    <div class="as-item-row">
      <div class="as-item-emoji">💍</div>
      <div class="as-item-info"><div class="as-item-name">Silver Charm Bracelet</div><div class="as-item-meta">Excellent · Box B1</div></div>
      <div class="as-item-price">£32</div>
    </div>
    <div class="as-section-hdr" style="margin-top:8px"><span>Storage boxes</span><span class="as-link">5 boxes →</span></div>
    <div class="as-boxes-row">
      <div class="as-box-tile"><div class="as-box-lbl">Box A3</div><div class="as-box-loc">Shelf 2</div><div class="as-box-cnt">8 items</div><div class="as-box-bar"><div class="as-box-bar-fill" style="width:67%"></div></div></div>
      <div class="as-box-tile"><div class="as-box-lbl">Box B1</div><div class="as-box-loc">Living room</div><div class="as-box-cnt">5 items</div><div class="as-box-bar"><div class="as-box-bar-fill" style="width:42%"></div></div></div>
      <div class="as-box-tile as-box-tile--new"><div class="as-box-plus">＋</div><div class="as-box-new-lbl">New box</div></div>
    </div>
  `,

  scan: `
    <div class="as-toprow"><div class="as-back">‹</div><div class="as-screen-title">AI Result</div></div>
    <div class="as-scan-card">
      <div class="as-scan-photo">📸</div>
      <div class="as-ai-tag">✦ AI Identified</div>
      <div class="as-scan-name">Polaroid 600 Camera</div>
      <div class="as-scan-desc">Classic instant camera in working condition. Minor cosmetic wear on body.</div>
      <div class="as-scan-cond">Condition: <span>Good</span></div>
    </div>
    <div class="as-price-block">
      <div class="as-price-row"><span class="as-price-lbl">AI Recommended Price</span><span class="as-price-val">£85</span></div>
      <div class="as-price-row as-price-row--border"><span class="as-price-lbl">Confidence</span><span class="as-conf">🟢 High</span></div>
    </div>
    <div class="as-assign-lbl">Assign to a storage box:</div>
    <div class="as-chips-row">
      <div class="as-chip as-chip--on">Box A3</div>
      <div class="as-chip">Box B1</div>
      <div class="as-chip as-chip--dash">＋ New</div>
    </div>
    <div class="as-ai-lbl-row">✦ AI Channel Picks</div>
    <div class="as-ch-card">
      <div class="as-best-badge">⭐ Best match</div>
      <div class="as-ch-top">
        <div class="as-ch-logo" style="background:#e5323820">🛒</div>
        <div class="as-ch-mid"><div class="as-ch-name">eBay</div><div class="as-ch-reason">High demand for vintage cameras</div></div>
        <div class="as-ch-earn"><div class="as-ch-price">£85</div><div class="as-ch-earn-lbl">est. earned</div></div>
      </div>
      <div class="as-bar-row"><span class="as-bar-lbl">Demand</span><div class="as-bar-track"><div class="as-bar-fill" style="width:87%;background:#E53238"></div></div><span class="as-bar-pct">87%</span></div>
      <div class="as-bar-row"><span class="as-bar-lbl">Speed</span><div class="as-bar-track"><div class="as-bar-fill" style="width:72%;background:#16A34A"></div></div><span class="as-bar-pct">72%</span></div>
      <div class="as-ch-btn">List on eBay →</div>
    </div>
    <div class="as-save-btn">✓ Save to inventory</div>
  `,

  earnings: `
    <div class="as-earnings-header">
      <div class="as-brand">Earnings</div>
      <div class="as-period-tabs">
        <div class="as-period">This week</div>
        <div class="as-period as-period--on">This month</div>
        <div class="as-period">All time</div>
      </div>
    </div>
    <div class="as-hero-card">
      <div class="as-hero-lbl">Total earned</div>
      <div class="as-hero-amt">£847.50</div>
      <div class="as-hero-sub-row">
        <div class="as-hero-sub"><div class="as-hero-sub-val">12</div><div class="as-hero-sub-lbl">Items sold</div></div>
        <div class="as-hero-divider"></div>
        <div class="as-hero-sub"><div class="as-hero-sub-val">£70</div><div class="as-hero-sub-lbl">Avg price</div></div>
        <div class="as-hero-divider"></div>
        <div class="as-hero-sub"><div class="as-hero-sub-val">£1,240</div><div class="as-hero-sub-lbl">In storage</div></div>
      </div>
    </div>
    <div class="as-section-sm">Recent sales</div>
    <div class="as-chart">
      <div class="as-chart-col"><div class="as-chart-bar" style="height:40%"></div><div class="as-chart-amt">£45</div></div>
      <div class="as-chart-col"><div class="as-chart-bar" style="height:60%"></div><div class="as-chart-amt">£85</div></div>
      <div class="as-chart-col"><div class="as-chart-bar" style="height:80%"></div><div class="as-chart-amt">£120</div></div>
      <div class="as-chart-col"><div class="as-chart-bar" style="height:35%"></div><div class="as-chart-amt">£32</div></div>
      <div class="as-chart-col"><div class="as-chart-bar" style="height:55%"></div><div class="as-chart-amt">£78</div></div>
      <div class="as-chart-col"><div class="as-chart-bar" style="height:95%"></div><div class="as-chart-amt">£185</div></div>
    </div>
    <div class="as-section-sm">By channel</div>
    <div class="as-ch-break">
      <div class="as-ch-break-row"><div class="as-ch-dot" style="background:#E53238"></div><span class="as-ch-emoji-sm">🛒</span><span class="as-ch-name-sm">eBay</span><div class="as-ch-bar-track"><div class="as-ch-bar-fill" style="width:78%;background:#E53238"></div></div><span class="as-ch-amt-sm">£661</span></div>
      <div class="as-ch-break-row"><div class="as-ch-dot" style="background:#00BE9A"></div><span class="as-ch-emoji-sm">👗</span><span class="as-ch-name-sm">Vinted</span><div class="as-ch-bar-track"><div class="as-ch-bar-fill" style="width:22%;background:#00BE9A"></div></div><span class="as-ch-amt-sm">£186</span></div>
    </div>
    <div class="as-potential-card">
      <span>💡</span>
      <div><div class="as-potential-title">£1,240 still in storage</div><div class="as-potential-sub">List more to maximise earnings</div></div>
    </div>
  `,
};

function makeHtml(id, w, h) {
  const innerW = w - 28;
  const innerH = h - 28;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${sharedStyles}
body { width: ${w}px; height: ${h}px; }
.phone-frame-wrap { width: ${w}px; height: ${h}px; }
.phone-screen-inner { width: ${innerW}px; height: ${innerH}px; }
</style>
</head>
<body>
<div class="phone-frame-wrap">
  <div class="phone-notch"></div>
  <div class="phone-screen-inner">
    ${screens[id]}
  </div>
</div>
</body>
</html>`;
}

const browser = await puppeteer.launch({ headless: 'new' });

for (const { id, width, height } of phones) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 3 });
  await page.setContent(makeHtml(id, width, height), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500)); // let fonts render

  const outPath = join(__dirname, 'assets', `mockup-${id}.jpg`);
  await page.screenshot({
    path: outPath,
    type: 'jpeg',
    quality: 95,
    clip: { x: 0, y: 0, width, height },
  });
  console.log(`✓ ${outPath}`);
  await page.close();
}

await browser.close();
console.log('Done.');
