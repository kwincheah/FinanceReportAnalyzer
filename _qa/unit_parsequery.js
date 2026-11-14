const path = require("path");
const { parseQuery } = require("./compiled/constants/bursaData.js");

const results = [];
function check(name, cond, detail = "") {
  results.push({ name, ok: !!cond, detail });
  console.log((cond ? "PASS " : "FAIL ") + name + (detail ? " :: " + detail : ""));
}

const cases = [
  // [query, expected code or null, expected instruction contains]
  ["maybank", "1155", null],
  ["1155", "1155", null],
  ["Maybank quarterly revenue", "1155", "quarterly revenue"],
  ["tenaga", "5347", null],
  ["tenaga quarterly revenue", "5347", "quarterly revenue"],
  ["the largest bank in malaysia", "1155", null],
  ["biggest glove maker in malaysia", "7113", null],
  ["top glove", "7113", null],
  ["mr diy", "5296", null],
  ["MR D.I.Y.", "5296", null],
  ["public bank", "1295", null],
  ["cimb", "1023", null],
  ["what is the best bank in malaysia", null, null],
  ["", null, null],
  ["   ", null, null],
  ["???", null, null],
  ["analyze the quarterly financial report of cimb", "1023", "executive summary"],
  ["ytl power", "6742", null],
  ["petronas chem", "5183", null],
  ["nonexistent company xyz", null, null],
];

for (const [q, expectCode, instrContains] of cases) {
  let res;
  try {
    res = parseQuery(q);
  } catch (e) {
    check(`parseQuery(${JSON.stringify(q)}) does not throw`, false, e.message);
    continue;
  }
  const code = res.company ? res.company.code : null;
  const ok = code === expectCode;
  let extra = ok ? "" : `got ${code}, expected ${expectCode}`;
  if (ok && instrContains && !res.instruction.toLowerCase().includes(instrContains.toLowerCase())) {
    check(`parseQuery(${JSON.stringify(q)}) -> ${code} instruction ~ ${instrContains}`, false, `instruction="${res.instruction}"`);
    continue;
  }
  check(`parseQuery(${JSON.stringify(q)}) -> ${expectCode}`, ok, extra);
}

// instruction leakage checks
const r1 = parseQuery("Maybank quarterly revenue");
console.log("\n'Maybank quarterly revenue' =>", JSON.stringify({ code: r1.company && r1.company.code, instruction: r1.instruction }));
const r2 = parseQuery("cimb debt and cash");
console.log("'cimb debt and cash' =>", JSON.stringify({ code: r2.company && r2.company.code, instruction: r2.instruction }));
const r3 = parseQuery("what is the best bank in malaysia");
console.log("'what is the best bank in malaysia' =>", JSON.stringify({ code: r3.company && r3.company.code, instruction: r3.instruction }));
const r4 = parseQuery("maybank");
console.log("'maybank' =>", JSON.stringify({ code: r4.company && r4.company.code, instruction: r4.instruction }));

// Any company whose instruction still contains the company name (leak)?
let leak = false;
for (const q of ["Maybank quarterly revenue", "tenaga revenue", "cimb debt", "top glove outlook"]) {
  const r = parseQuery(q);
  if (r.company && r.instruction.toLowerCase().includes(r.company.name.toLowerCase().replace(/\./g, ""))) {
    console.log("LEAK:", q, "=>", r.instruction);
    leak = true;
  }
}
check("Instruction strips company name", !leak);

const fails = results.filter((r) => !r.ok);
console.log("\n" + "=".repeat(60));
console.log(`TOTAL ${results.length} | PASS ${results.length - fails.length} | FAIL ${fails.length}`);
fails.forEach((f) => console.log("  FAIL:", f.name, "::", f.detail));
