// Attach to an already-running headless Chrome on port 9333 and run E2E checks.
const { CDP, sleep } = require("./cdp.js");
const fs = require("fs");

const URL = "http://localhost:3000";
const OUT = "C:\\Users\\winch\\Downloads\\FinanceReportAnalyzer\\_qa\\shots";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " :: " + detail : ""));
}

async function attach(port = 9333) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const list = await res.json();
  const page = list.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");
  return CDP.connect(page.webSocketDebuggerUrl);
}

(async () => {
  const cdp = await attach(9333);
  const consoleErrors = [];
  const pageErrors = [];

  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  cdp.ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) {
      consoleErrors.push(m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    }
    if (m.method === "Runtime.exceptionThrown") {
      pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
  });

  await cdp.send("Page.navigate", { url: URL });
  await sleep(5000);

  // ---------- HOME PAGE ----------
  const title = await cdp.eval("document.title");
  record("Home page title", /Bursa Intelligence/.test(title || ""), title);
  record("No uncaught page exceptions on load", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 500));
  record("No console errors on load", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 500));

  const homeText = await cdp.eval("document.body.innerText");
  record("Home hero headline visible", /Bursa Malaysia Financial Intelligence/.test(homeText));
  record("Market pulse present", /FBM KLCI/.test(homeText));
  record("Popular equities present", /Popular Bursa Equities/.test(homeText));
  record("Market movers present", /Bursa Market Movers/.test(homeText));
  record("Disclosures present", /Recent Bursa Disclosures/.test(homeText));
  record("Sector grid present", /Bursa Malaysia Sector Performance/.test(homeText));
  record("Quick modules present", /Quick Research Modules/.test(homeText));
  await cdp.screenshot(OUT + "\\01-home.png");

  // ---------- THEME TOGGLE ----------
  const themeBefore = await cdp.eval("document.documentElement.className");
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Mode/.test(b.title||''))");
  await sleep(700);
  const themeAfter = await cdp.eval("document.documentElement.className");
  record("Theme toggle changes html class", themeBefore !== themeAfter, `${themeBefore} -> ${themeAfter}`);
  const bgAfter = await cdp.eval("getComputedStyle(document.body).backgroundColor");
  record("Theme toggle changes body background", bgAfter !== "rgb(9, 10, 12)", `bg=${bgAfter}`);
  await cdp.screenshot(OUT + "\\02-home-light.png");
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Mode/.test(b.title||''))");
  await sleep(500);

  // ---------- AUTOCOMPLETE ----------
  await cdp.typeInto("document.querySelector('input[type=text]')", "tena");
  await sleep(1500);
  const suggText = await cdp.eval("document.body.innerText");
  record("Autocomplete dropdown appears for 'tena'", /Matching Bursa Equities/.test(suggText));
  record("Autocomplete shows Tenaga Nasional", /Tenaga Nasional/.test(suggText));
  await cdp.screenshot(OUT + "\\03-autocomplete.png");

  // keyboard navigation
  await cdp.eval(`(() => {
    const el = document.querySelector('input[type=text]');
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', bubbles:true}));
    return true;
  })()`);
  await sleep(300);

  // ---------- SELECT SUGGESTION -> TERMINAL ----------
  await cdp.click("[...document.querySelectorAll('li')].find(li => /Tenaga Nasional/.test(li.innerText))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000, "terminal view");
  record("Selecting suggestion opens terminal workspace", true);
  await sleep(2000);
  const termText = await cdp.eval("document.body.innerText");
  record("Terminal shows Tenaga Nasional", /TENAGA NASIONAL|Tenaga Nasional/.test(termText));
  record("Terminal shows KPI strip", /P\/E RATIO/i.test(termText));
  record("Terminal shows filings sidebar", /Financial Reports/.test(termText));
  record("Terminal shows copilot", /AI Financial Research Copilot/.test(termText));
  record("Terminal shows overview table", /QoQ & YoY/.test(termText));
  await cdp.screenshot(OUT + "\\04-terminal.png");

  const badNumbers = await cdp.eval(`(() => {
    const t = document.body.innerText;
    const hits = [];
    for (const pat of ['NaN', 'Infinity', 'undefined', 'null%']) { if (t.includes(pat)) hits.push(pat); }
    return hits;
  })()`);
  record("No NaN/Infinity/undefined text in terminal", badNumbers.length === 0, badNumbers.join(","));

  // ---------- FILINGS LIST CHECK ----------
  const filingCards = await cdp.eval("[...document.querySelectorAll('div.cursor-pointer')].map(d=>d.innerText.split('\\n').slice(0,2).join(' | '))");
  console.log("   filings rendered:", JSON.stringify(filingCards).slice(0, 400));

  // ---------- INTERVAL SWITCH ----------
  const intervalOk = await cdp.click("[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '6M')");
  await sleep(600);
  record("Interval switch button clickable", !!intervalOk);
  const chartTickText = await cdp.eval("document.body.innerText.includes('Jun') || document.body.innerText.includes('Jul')");
  record("6M interval updates chart axis", chartTickText);

  // ---------- FINANCIALS CHART ----------
  await cdp.click("[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Revenue & PAT')");
  await sleep(900);
  const svgCount = await cdp.eval("document.querySelectorAll('svg.recharts-surface').length");
  record("Financials chart renders SVG", svgCount > 0, String(svgCount));
  const barCount = await cdp.eval("document.querySelectorAll('path.recharts-rectangle').length");
  record("Financials chart renders bars", barCount > 0, `${barCount} bars`);
  await cdp.screenshot(OUT + "\\05-financials.png");
  await cdp.click("[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Price Action')");
  await sleep(600);

  // ---------- FILINGS FILTER ----------
  await cdp.click("[...document.querySelectorAll('button')].find(b => b.innerText.trim().toLowerCase() === 'annual')");
  await sleep(600);
  const annualOnly = await cdp.eval("document.body.innerText.includes('Annual Audited')");
  record("Annual filings filter works", annualOnly);
  await cdp.click("[...document.querySelectorAll('button')].find(b => /^All \\(/.test(b.innerText.trim()))");
  await sleep(500);

  // ---------- COPILOT CHAT ----------
  await cdp.eval(`(() => {
    const inputs = [...document.querySelectorAll('input[type=text]')];
    const el = inputs[inputs.length - 1];
    el.scrollIntoView({block:'center'});
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, 'What drove revenue this quarter?');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(400);
  await cdp.eval(`(() => {
    const forms = [...document.querySelectorAll('form')];
    forms[forms.length - 1].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  await sleep(2000);
  const afterSend = await cdp.eval("document.body.innerText");
  record("Chat user message appears", /What drove revenue this quarter/.test(afterSend));
  await cdp.screenshot(OUT + "\\06a-chat-sending.png");
  await sleep(15000);
  const afterChat = await cdp.eval("document.body.innerText");
  record("Chat assistant reply arrived", !/Analyst Copilot is reviewing disclosures/.test(afterChat));
  record("No chat network error banner", !/Unable to connect to analyst service/.test(afterChat));
  await cdp.screenshot(OUT + "\\06b-chat.png");

  // ---------- EXPORT CSV ----------
  const exportClicked = await cdp.click("[...document.querySelectorAll('button')].find(b => /Export CSV/.test(b.innerText))");
  await sleep(1200);
  record("Export CSV button exists", !!exportClicked);

  // ---------- BACK TO START PAGE ----------
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Start Page/.test(b.innerText))");
  await sleep(1200);
  const backHome = await cdp.eval("document.body.innerText.includes('Bursa Malaysia Financial Intelligence')");
  record("Back to start page works", backHome);
  await cdp.screenshot(OUT + "\\07-back-home.png");

  // ---------- TERMINAL HEADER SEARCH ----------
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Maybank/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000, "terminal again");
  record("Popular equity tile opens terminal", true);
  await sleep(1200);

  await cdp.typeInto("document.querySelector('header input[type=text]')", "CIMB");
  await sleep(900);
  await cdp.eval(`(() => {
    const form = document.querySelector('header form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  await sleep(2000);
  const modalVisible = await cdp.eval("!!document.body.innerText.match(/Confirm Target & Query/)");
  record("Header search in terminal opens confirmation modal", modalVisible,
    modalVisible ? "" : "DEAD: modal not rendered in terminal view");
  await cdp.screenshot(OUT + "\\08-header-search.png");

  // ---------- HOME SEARCH AMBIGUOUS ----------
  await cdp.send("Page.navigate", { url: URL });
  await sleep(3500);
  await cdp.typeInto("document.querySelector('input[type=text]')", "what is the best bank in malaysia");
  await sleep(600);
  await cdp.eval("document.querySelector('form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}))");
  await sleep(1000);
  const ambiguousText = await cdp.eval("document.body.innerText");
  record("Ambiguous query shows company selector", /Please select the Bursa company/.test(ambiguousText));
  await cdp.screenshot(OUT + "\\09-ambiguous.png");
  await cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})); window.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));");
  await sleep(600);
  const escaped = await cdp.eval("!document.body.innerText.includes('Confirm Target & Query') && !document.body.innerText.includes('Please select the Bursa company')");
  record("Escape closes confirmation modal", escaped);

  // ---------- SEARCH SPECIFIC PROMPT ----------
  await cdp.typeInto("document.querySelector('input[type=text]')", "tenaga quarterly revenue");
  await sleep(600);
  await cdp.eval("document.querySelector('form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}))");
  await sleep(900);
  const modalText = await cdp.eval("document.body.innerText");
  record("Specific prompt identifies target company", /Tenaga/.test(modalText) && /Quarterly Revenue|quarterly revenue/i.test(modalText));
  await cdp.screenshot(OUT + "\\10-confirm.png");

  // confirm -> terminal + auto question
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Run Analysis on|View .* Financials/.test(b.innerText))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000, "terminal after confirm");
  await sleep(6000);
  const confirmedText = await cdp.eval("document.body.innerText");
  record("Confirming prompt loads target stock", /TENAGA NASIONAL|Tenaga Nasional/.test(confirmedText));
  record("Auto-sent instruction appears in copilot", /quarterly revenue/i.test(confirmedText));
  await cdp.screenshot(OUT + "\\11-confirmed.png");

  // ---------- MOBILE VIEWPORT ----------
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(1500);
  await cdp.screenshot(OUT + "\\12-mobile-terminal.png");
  const mobileTabs = await cdp.eval("[...document.querySelectorAll('button')].filter(b => ['filings','overview','summary','chat'].includes(b.innerText.trim().toLowerCase())).length");
  record("Mobile tab switcher present", mobileTabs === 4, String(mobileTabs));
  const overflowX = await cdp.eval("document.documentElement.scrollWidth > document.documentElement.clientWidth + 2");
  record("No horizontal overflow on mobile", !overflowX, String(await cdp.eval("document.documentElement.scrollWidth + ' vs ' + document.documentElement.clientWidth")));
  await cdp.send("Emulation.clearDeviceMetricsOverride");

  // ---------- FINAL ----------
  record("No uncaught page exceptions total", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 900));
  console.log("\n--- console errors/warnings ---\n" + (consoleErrors.slice(0, 25).join("\n") || "(none)"));
  console.log("\n--- page exceptions ---\n" + (pageErrors.slice(0, 25).join("\n") || "(none)"));

  const fails = results.filter((r) => !r.ok);
  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL ${results.length} | PASS ${results.length - fails.length} | FAIL ${fails.length}`);
  fails.forEach((f) => console.log("  FAIL:", f.name, "::", f.detail));
  cdp.ws.close();
  process.exit(0);
})().catch((e) => {
  console.error("E2E HARNESS ERROR:", e.message);
  process.exit(2);
});
