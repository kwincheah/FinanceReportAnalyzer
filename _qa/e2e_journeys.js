// Additional user-journey checks: persistence, mobile tabs, quick modules, movers.
const { CDP, sleep } = require("./cdp.js");
const OUT = "C:\\Users\\winch\\Downloads\\FinanceReportAnalyzer\\_qa\\shots";

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " :: " + detail : ""));
}

async function attach(port = 9333) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const list = await res.json();
  const page = list.find((t) => t.type === "page");
  return CDP.connect(page.webSocketDebuggerUrl);
}

(async () => {
  const cdp = await attach();
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  const pageErrors = [];
  cdp.ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === "Runtime.exceptionThrown") pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(4000);
  await cdp.eval("localStorage.clear()");

  // ---- Market mover "Analyze →" ----
  const moverClicked = await cdp.eval(`(() => {
    const rows = [...document.querySelectorAll('tr')];
    const row = rows.find(r => /YTL Power/.test(r.innerText) && r.querySelector('button'));
    if (!row) return false;
    row.querySelector('button').click();
    return true;
  })()`);
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  record("Market mover Analyze button loads terminal", moverClicked);
  await sleep(2500);
  const ytl = await cdp.eval("document.body.innerText");
  record("YTL Power loaded from movers row", /YTL POWER|YTL Power/i.test(ytl));

  // ---- Quick module prompt ----
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Start Page/.test(b.innerText))");
  await sleep(1200);
  await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => /DCF & Valuation/.test(b.innerText));
    b.click(); return true;
  })()`);
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  // the quick module fires its prompt 500ms after load; let it start, then settle
  await sleep(2500);
  await cdp.waitFor("!document.body.innerText.includes('Analyst Copilot is reviewing disclosures')", 90000, "chat idle");
  await sleep(1500);
  const qm = await cdp.eval("document.body.innerText");
  record("Quick module loads Tenaga + auto prompt", /TENAGA NASIONAL/i.test(qm) && /discounted cash flow|DCF/i.test(qm));
  await cdp.screenshot(OUT + "\\30-quick-module.png");

  // ---- Chat history persistence across reload ----
  await cdp.eval(`(() => {
    const inputs = [...document.querySelectorAll('input[type=text]')];
    const el = inputs[inputs.length-1];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(el, 'PERSISTED-QUESTION-12345');
    el.dispatchEvent(new Event('input',{bubbles:true}));
    const forms = [...document.querySelectorAll('form')];
    forms[forms.length-1].dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    return true;
  })()`);
  await sleep(1500);
  const beforeReload = await cdp.eval("document.body.innerText.includes('PERSISTED-QUESTION-12345')");
  record("Chat message visible before reload", beforeReload);
  await cdp.waitFor("!document.body.innerText.includes('Analyst Copilot is reviewing disclosures')", 60000, "chat reply");
  await sleep(1000);
  const storedKey = await cdp.eval("Object.keys(localStorage).filter(k => k.startsWith('bursa_terminal_chat_'))");
  record("Chat persisted in localStorage", Array.isArray(storedKey) && storedKey.length > 0, JSON.stringify(storedKey));

  await cdp.send("Page.reload");
  await sleep(4500);
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Tenaga/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  await sleep(2500);
  const afterReload = await cdp.eval("document.body.innerText.includes('PERSISTED-QUESTION-12345')");
  record("Chat transcript restored after reload", afterReload);

  // ---- Clear transcript ----
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Clear Transcript/.test(b.innerText))");
  await sleep(800);
  const cleared = await cdp.eval("!document.body.innerText.includes('PERSISTED-QUESTION-12345')");
  record("Clear Transcript wipes the conversation", cleared);

  // ---- Theme persistence across reload ----
  const themeNow = await cdp.eval("document.documentElement.classList.contains('dark') ? 'dark' : 'light'");
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Mode/.test(b.title||''))");
  await sleep(600);
  const toggled = await cdp.eval("document.documentElement.classList.contains('dark') ? 'dark' : 'light'");
  await cdp.send("Page.reload");
  await sleep(4000);
  const afterThemeReload = await cdp.eval("document.documentElement.classList.contains('dark') ? 'dark' : 'light'");
  record("Theme survives reload", afterThemeReload === toggled, `${themeNow} -> ${toggled} -> after reload ${afterThemeReload}`);
  await cdp.screenshot(OUT + "\\31-theme-reload.png");

  // ---- Mobile tabs ----
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(1000);
  // open terminal on mobile
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Maybank/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  await sleep(2000);
  const tabResults = {};
  for (const tab of ["filings", "summary", "chat", "overview"]) {
    await cdp.click(`[...document.querySelectorAll('button')].find(b => b.innerText.trim().toLowerCase() === '${tab}')`);
    await sleep(700);
    tabResults[tab] = await cdp.eval(`(() => {
      const txt = document.body.innerText;
      if ('${tab}' === 'filings') return /Financial Reports/.test(txt);
      if ('${tab}' === 'summary') return /AI Financial Summary/.test(txt);
      if ('${tab}' === 'chat') return /AI Financial Research Copilot/.test(txt);
      return /QoQ & YoY/.test(txt);
    })()`);
    await cdp.screenshot(`${OUT}\\32-mobile-${tab}.png`);
  }
  record("Mobile tabs each reveal their panel", Object.values(tabResults).every(Boolean), JSON.stringify(tabResults));
  const overflow = await cdp.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
  record("No horizontal overflow on mobile terminal", overflow <= 2, String(overflow));
  await cdp.send("Emulation.clearDeviceMetricsOverride");

  record("No uncaught exceptions", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 600));

  const fails = results.filter((r) => !r.ok);
  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL ${results.length} | PASS ${results.length - fails.length} | FAIL ${fails.length}`);
  fails.forEach((f) => console.log("  FAIL:", f.name, "::", f.detail));
  cdp.ws.close();
  process.exit(0);
})().catch((e) => { console.error("HARNESS ERROR:", e.message); process.exit(2); });
