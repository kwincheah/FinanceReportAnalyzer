// Minimal Chrome DevTools Protocol driver (no external deps).
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DIR = path.join(os.tmpdir(), "dsh-cdp-profile-" + process.pid);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function launch(port = 9222) {
  const proc = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--window-size=1600,1100",
    `--user-data-dir=${USER_DIR}`,
    `--remote-debugging-port=${port}`,
    "about:blank",
  ], { stdio: "ignore" });

  let target = null;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page && page.webSocketDebuggerUrl) { target = page; break; }
    } catch (e) { /* not up yet */ }
    await sleep(150);
  }
  if (!target) { proc.kill(); throw new Error("Could not connect to Chrome DevTools"); }
  return { proc, target };
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (e) => reject(new Error("ws error"));
    });
    return new CDP(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error("CDP timeout: " + method)); }
      }, 45000);
    });
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error("JS EXCEPTION: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    }
    return r.result?.value;
  }
  async waitFor(expression, timeoutMs = 30000, label = expression) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      try {
        const v = await this.eval(expression);
        if (v) return v;
      } catch (e) { /* page navigating */ }
      await sleep(200);
    }
    throw new Error("waitFor timed out: " + label);
  }
  async screenshot(file) {
    const r = await this.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(file, Buffer.from(r.data, "base64"));
  }
  async click(selectorExpr) {
    // selectorExpr is a JS expression yielding an element handle via DOM
    const ok = await this.eval(`(() => {
      const el = ${selectorExpr};
      if (!el) return false;
      el.scrollIntoView({block:'center'});
      el.click();
      return true;
    })()`);
    return ok;
  }
  async typeInto(selectorExpr, text) {
    const ok = await this.eval(`(() => {
      const el = ${selectorExpr};
      if (!el) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, ${JSON.stringify(text)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    return ok;
  }
}

module.exports = { launch, CDP, sleep };
