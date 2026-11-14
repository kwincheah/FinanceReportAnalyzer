// E2E edge-case tests: cross-stock chat leakage, error handling, rapid navigation.
const { CDP, sleep } = require("./cdp.js");
const fs = require("fs");
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
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  const pageErrors = [];
  cdp.ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === "Runtime.exceptionThrown") pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });

  // ============ TEST 1: cross-stock chat leakage ============
  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(4000);
  await cdp.eval("localStorage.clear()");

  // Load Maybank (tile -> no auto instruction)
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Maybank/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  await sleep(2000);

  // send a distinct chat message for Maybank
  await cdp.eval(`(() => {
    const inputs = [...document.querySelectorAll('input[type=text]')];
    const el = inputs[inputs.length-1];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(el, 'MAYBANK-ONLY-QUESTION');
    el.dispatchEvent(new Event('input',{bubbles:true}));
    const forms = [...document.querySelectorAll('form')];
    forms[forms.length-1].dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    return true;
  })()`);
  await sleep(15000);
  const maybankHasOwn = await cdp.eval("document.body.innerText.includes('MAYBANK-ONLY-QUESTION')");
  record("Maybank transcript contains its own question", maybankHasOwn);

  // Go back home, then load CIMB WITH an auto instruction via a disclosure card
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Start Page/.test(b.innerText))");
  await sleep(1200);
  // find the CIMB disclosure "Inspect" button
  const cimbInspect = await cdp.eval(`(() => {
    const rows = [...document.querySelectorAll('div')].filter(d => /CIMB Group/.test(d.innerText) && d.innerText.includes('Inspect'));
    const row = rows[rows.length-1];
    if (!row) return false;
    const btns = [...row.querySelectorAll('button')].filter(b => b.innerText.trim() === 'Inspect');
    if (!btns.length) return false;
    btns[0].click();
    return true;
  })()`);
  record("CIMB disclosure Inspect clickable", !!cimbInspect);
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  await sleep(15000);
  const cimbText = await cdp.eval("document.body.innerText");
  record("CIMB transcript does NOT leak Maybank messages", !cimbText.includes("MAYBANK-ONLY-QUESTION"),
    cimbText.includes("MAYBANK-ONLY-QUESTION") ? "LEAKED previous stock chat into new stock" : "");
  record("CIMB loaded as active stock", /CIMB/.test(cimbText));
  await cdp.screenshot(OUT + "\\20-cross-stock.png");

  // ============ TEST 2: API error handling ============
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*8008/api/reports/analyze*", requestStage: "Request" }] });
  const failHandler = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === "Fetch.requestPaused") {
      cdp.send("Fetch.failRequest", { requestId: m.params.requestId, errorReason: "ConnectionRefused" }).catch(() => {});
    }
  };
  cdp.ws.addEventListener("message", failHandler);

  await cdp.click("[...document.querySelectorAll('button')].find(b => /Start Page/.test(b.innerText))");
  await sleep(1200);
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Tenaga/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await sleep(4000);
  const errText = await cdp.eval("document.body.innerText");
  const hasVisibleError = /Failed to fetch|HTTP Error|error|Error/.test(errText);
  record("Failed analyze shows a visible error message", hasVisibleError,
    hasVisibleError ? "" : "silent failure: user sees nothing (error state never rendered)");
  await cdp.screenshot(OUT + "\\21-error-state.png");
  await cdp.send("Fetch.disable");
  cdp.ws.removeEventListener("message", failHandler);

  // ============ TEST 3: rapid navigation race ============
  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(3500);
  await cdp.eval(`(() => {
    const tiles = [...document.querySelectorAll('button')].filter(b => b.className.includes('h-[112px]'));
    tiles[0].click(); tiles[1].click(); tiles[2].click();
    return true;
  })()`);
  await sleep(25000);
  const raceText = await cdp.eval("document.body.innerText");
  const raceHeader = await cdp.eval("document.querySelector('main') ? document.querySelector('main').innerText.split('\\n')[0] : 'none'");
  record("Rapid navigation settles on a coherent stock", /Financial Statement Summary/.test(raceText), "first line: " + raceHeader);
  const loadingGone = await cdp.eval("!document.body.innerText.includes('Preparing financial model')");
  record("Loading overlay cleared after rapid navigation", loadingGone);
  await cdp.screenshot(OUT + "\\22-race.png");

  // ============ TEST 4: non-catalog stock (autocomplete from backend) ============
  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(3500);
  await cdp.typeInto("document.querySelector('input[type=text]')", "press metal");
  await sleep(1500);
  const pmListed = await cdp.eval("/Press Metal/.test(document.body.innerText)");
  record("Backend autocomplete surfaces 'Press Metal'", pmListed);
  if (pmListed) {
    await cdp.click("[...document.querySelectorAll('li')].find(li => /Press Metal/.test(li.innerText))");
    await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000).catch(() => {});
    await sleep(3000);
    const pmText = await cdp.eval("document.body.innerText");
    record("Press Metal terminal renders", /PRESS METAL|Press Metal/.test(pmText));
    const bad = await cdp.eval("['NaN','Infinity','undefined'].filter(p=>document.body.innerText.includes(p))");
    record("Press Metal shows no NaN/Infinity", bad.length === 0, bad.join(","));
    await cdp.screenshot(OUT + "\\23-press-metal.png");
  }

  record("No uncaught exceptions during edge tests", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 800));

  const fails = results.filter((r) => !r.ok);
  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL ${results.length} | PASS ${results.length - fails.length} | FAIL ${fails.length}`);
  fails.forEach((f) => console.log("  FAIL:", f.name, "::", f.detail));
  cdp.ws.close();
  process.exit(0);
})().catch((e) => { console.error("HARNESS ERROR:", e.message); process.exit(2); });
