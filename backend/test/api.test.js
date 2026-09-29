import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db.js";
import { createApp } from "../src/server.js";

let server, base, db;

before(async () => {
  db = openDb(":memory:");
  server = createApp(db, { password: "" }).listen(0);
  await new Promise(r => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); db.close(); });

const call = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
};

test("health check and dashboard page are served", async () => {
  assert.deepEqual((await call("GET", "/api/health")).body, { ok: true });
  const page = await fetch(base + "/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Pocket Ledger/);
});

test("a fresh database is uninitialized with default budgets", async () => {
  const { body } = await call("GET", "/api/state");
  assert.equal(body.initialized, false);
  assert.equal(body.currency, "INR");
  assert.equal(body.budgets.emi, 12200);
  assert.equal(body.budgets.sip, 8000);
  assert.deepEqual(body.expenses, []);
});

test("import loads a ledger once and refuses to overwrite without replace", async () => {
  const ledger = {
    expenses: [
      { id: "seed0001", date: "2026-09-01", category: "housing", amount: 18000, note: "Rent" },
      { id: "seed0002", date: "2026-09-05", category: "emi", amount: 9800, note: "Car loan EMI" },
      { id: "seed0003", date: "2026-08-07", category: "sip", amount: 5000, note: "Index fund SIP" },
    ],
    budgets: { food: 10000 },
    currency: "INR",
    sample: true,
  };
  assert.equal((await call("POST", "/api/import", ledger)).status, 201);
  assert.equal((await call("POST", "/api/import", ledger)).status, 409);

  const { body } = await call("GET", "/api/state");
  assert.equal(body.initialized, true);
  assert.equal(body.sample, true);
  assert.equal(body.expenses.length, 3);
  assert.equal(body.budgets.food, 10000);
});

test("expenses can be added, read, updated, filtered and deleted", async () => {
  const created = await call("POST", "/api/expenses", { id: "abc12345", date: "2026-09-10", category: "food", amount: 450.456, note: " Lunch " });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, { id: "abc12345", date: "2026-09-10", category: "food", amount: 450.46, note: "Lunch" });

  assert.equal((await call("POST", "/api/expenses", { id: "abc12345", date: "2026-09-10", category: "food", amount: 1 })).status, 409);

  const noId = await call("POST", "/api/expenses", { date: "2026-09-11", category: "transport", amount: 120 });
  assert.equal(noId.status, 201);
  assert.ok(noId.body.id.length >= 4);

  const updated = await call("PUT", "/api/expenses/abc12345", { date: "2026-09-12", category: "food", amount: 500, note: "Team lunch" });
  assert.equal(updated.body.amount, 500);
  assert.equal(updated.body.note, "Team lunch");

  const sept = await call("GET", "/api/expenses?month=2026-09&category=food");
  assert.deepEqual(sept.body.map(e => e.id), ["abc12345"]);

  assert.equal((await call("DELETE", "/api/expenses/abc12345")).status, 204);
  assert.equal((await call("GET", "/api/expenses/abc12345")).status, 404);
  assert.equal((await call("DELETE", "/api/expenses/abc12345")).status, 404);
});

test("invalid input is rejected with a helpful message", async () => {
  const cases = [
    { date: "2026-02-30", category: "food", amount: 10 },
    { date: "2026-09-10", category: "crypto", amount: 10 },
    { date: "2026-09-10", category: "food", amount: -5 },
    { date: "2026-09-10", category: "food", amount: "10" },
    { date: "2026-09-10", category: "food", amount: 10, id: "a b" },
    { date: "2026-09-10", category: "food", amount: 10, note: "x".repeat(201) },
  ];
  for (const c of cases) {
    const r = await call("POST", "/api/expenses", c);
    assert.equal(r.status, 400, JSON.stringify(c));
    assert.equal(typeof r.body.error, "string");
  }
  const bad = await fetch(base + "/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
  assert.equal(bad.status, 400);
  assert.equal((await call("GET", "/api/expenses?month=2026-13")).status, 400);
  assert.equal((await call("GET", "/api/nope")).status, 404);
});

test("budgets and currency can be changed", async () => {
  const b = await call("PUT", "/api/budgets/emi", { amount: 15000 });
  assert.equal(b.body.emi, 15000);
  assert.equal((await call("PUT", "/api/budgets/emi", { amount: -1 })).status, 400);
  assert.equal((await call("PUT", "/api/budgets/nothing", { amount: 1 })).status, 404);

  assert.deepEqual((await call("PUT", "/api/settings", { currency: "USD" })).body, { currency: "USD" });
  assert.equal((await call("PUT", "/api/settings", { currency: "BTC" })).status, 400);
  assert.equal((await call("GET", "/api/state")).body.currency, "USD");
});

test("summary totals a month by category", async () => {
  const { body } = await call("GET", "/api/summary?month=2026-09");
  assert.equal(body.month, "2026-09");
  const emi = body.categories.find(c => c.id === "emi");
  assert.equal(emi.spent, 9800);
  assert.equal(emi.budget, 15000);
  assert.equal(body.total, body.categories.reduce((a, c) => a + c.spent, 0));
  assert.equal((await call("GET", "/api/summary")).status, 400);
});

test("CSV export escapes text and neutralises formulas", async () => {
  await call("POST", "/api/expenses", { id: "csv00001", date: "2026-09-20", category: "other", amount: 10, note: '=HYPERLINK("x"), "quoted"' });
  const res = await fetch(base + "/api/export.csv");
  assert.match(res.headers.get("content-type"), /text\/csv/);
  const text = await res.text();
  assert.match(text, /^date,category,amount,note\n/);
  assert.ok(text.includes(`2026-09-20,Other,10,"'=HYPERLINK(""x""), ""quoted"""`));
});

test("clearing removes all expenses and turns off the sample flag", async () => {
  assert.equal((await call("DELETE", "/api/expenses")).status, 204);
  const { body } = await call("GET", "/api/state");
  assert.deepEqual(body.expenses, []);
  assert.equal(body.sample, false);
  assert.equal(body.budgets.emi, 15000);
});

test("APP_PASSWORD turns on a login", async () => {
  const locked = createApp(openDb(":memory:"), { user: "me", password: "s3cret" }).listen(0);
  await new Promise(r => locked.once("listening", r));
  const url = `http://127.0.0.1:${locked.address().port}/api/health`;
  try {
    assert.equal((await fetch(url)).status, 401);
    const wrong = await fetch(url, { headers: { Authorization: "Basic " + Buffer.from("me:nope").toString("base64") } });
    assert.equal(wrong.status, 401);
    const ok = await fetch(url, { headers: { Authorization: "Basic " + Buffer.from("me:s3cret").toString("base64") } });
    assert.equal(ok.status, 200);
  } finally { locked.close(); }
});
