// Verify export CSV / memo contents by intercepting Blob creation.
const { CDP, sleep } = require("./cdp.js");
const fs = require("fs");

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
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(4000);
  await cdp.click("[...document.querySelectorAll('button')].find(b => /Maybank/.test(b.innerText) && b.className.includes('h-[112px]'))");
  await cdp.waitFor("document.body.innerText.includes('Financial Statement Summary')", 60000);
  await sleep(2000);

  // patch createObjectURL
  await cdp.eval(`(() => {
    window.__captured = [];
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      blob.text().then(t => window.__captured.push(t));
      return orig(blob);
    };
    return true;
  })()`);

  await cdp.click("[...document.querySelectorAll('button')].find(b => /Export CSV/.test(b.innerText))");
  await sleep(1500);
  const csv = await cdp.eval("window.__captured && window.__captured[0]");
  console.log("=== CSV ===\n" + csv);
  fs.writeFileSync("C:\\Users\\winch\\Downloads\\FinanceReportAnalyzer\\_qa\\export.csv", csv || "");

  await cdp.click("[...document.querySelectorAll('button')].find(b => /Export Memo/.test(b.innerText))");
  await sleep(1500);
  const memo = await cdp.eval("window.__captured && window.__captured[1]");
  console.log("\n=== MEMO (first 1400 chars) ===\n" + String(memo).slice(0, 1400));
  fs.writeFileSync("C:\\Users\\winch\\Downloads\\FinanceReportAnalyzer\\_qa\\export_memo.md", memo || "");

  // CSV structural sanity
  const rows = (csv || "").split("\n");
  console.log("\nCSV row count:", rows.length);
  const cols = rows.map((r) => (r.match(/",?"/g) || []).length + 1);
  console.log("CSV columns per row:", cols.join(","));
  console.log("Consistent column count:", new Set(cols).size === 1);

  // Check the memo's audit score formatting
  const m = (memo || "").match(/Confidence Score: ([^)]*)/);
  console.log("Memo confidence text:", m && m[1]);

  // Check the audit badge text in the UI
  const badge = await cdp.eval("[...document.querySelectorAll('span')].map(s=>s.innerText).filter(t=>/Audit/.test(t)).slice(0,3)");
  console.log("Audit badge text in UI:", JSON.stringify(badge));

  cdp.ws.close();
  process.exit(0);
})();
