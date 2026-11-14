// Capture final verification screenshots in a deterministic state.
const { CDP, sleep } = require("./cdp.js");
const OUT = "C:\\Users\\winch\\Downloads\\FinanceReportAnalyzer\\_qa\\shots";

(async () => {
  const res = await fetch("http://127.0.0.1:9333/json/list");
  const list = await res.json();
  const page = list.find((t) => t.type === "page");
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(4000);

  // force dark theme
  await cdp.eval(`(() => { localStorage.setItem('theme','dark'); localStorage.setItem('color-scheme','dark'); document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); return true; })()`);
  await sleep(600);
  await cdp.screenshot(OUT + "\\40-home-dark.png");

  // light theme
  await cdp.eval(`(() => { localStorage.setItem('theme','light'); localStorage.setItem('color-scheme','light'); document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); return true; })()`);
  await sleep(400);
  await cdp.send("Page.reload");
  await sleep(4000);
  await cdp.screenshot(OUT + "\\41-home-light.png");

  // back to dark and open terminal on Maybank
  await cdp.eval(`(() => { localStorage.setItem('theme','dark'); localStorage.setItem('color-scheme','dark'); document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); return true; })()`);
  await sleep(400);
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Maybank/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  await sleep(2500);
  await cdp.waitFor("!document.body.innerText.includes('Analyst Copilot is reviewing disclosures')", 90000);
  await cdp.eval("window.scrollTo(0,0)");
  await sleep(800);
  await cdp.screenshot(OUT + "\\42-terminal-top.png");

  // scroll to copilot
  await cdp.eval("document.querySelector('input[placeholder^=\"Ask Copilot\"]')?.scrollIntoView({block:'center'})");
  await sleep(800);
  await cdp.screenshot(OUT + "\\43-terminal-copilot.png");

  // confirmation modal from the terminal header
  await cdp.eval("window.scrollTo(0,0)");
  await sleep(400);
  await cdp.typeInto("document.querySelector('header input[type=text]')", "top glove");
  await sleep(600);
  await cdp.eval("document.querySelector('header form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await sleep(900);
  await cdp.screenshot(OUT + "\\44-confirm-modal.png");
  await cdp.eval("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
  await sleep(400);

  // mobile
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(1200);
  await cdp.eval("window.scrollTo(0,0)");
  await sleep(500);
  await cdp.screenshot(OUT + "\\45-mobile.png");
  await cdp.send("Emulation.clearDeviceMetricsOverride");

  console.log("screenshots written");
  cdp.ws.close();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
