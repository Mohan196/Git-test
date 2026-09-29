import express from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { openDb } from "./db.js";
import { CATEGORIES, CATEGORY_IDS, CURRENCIES } from "./categories.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(HERE, "../../index.html");
const MAX_AMOUNT = 1e9;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// ---------- Validation ----------
function isRealDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function parseExpense(body, { requireId = false } = {}) {
  if (!body || typeof body !== "object") throw new HttpError(400, "Send the expense as a JSON object.");
  const { id, date, category, amount, note = "" } = body;
  if (!isRealDate(date)) throw new HttpError(400, "date must be a real calendar date in YYYY-MM-DD format.");
  if (!CATEGORY_IDS.has(category)) throw new HttpError(400, `category must be one of: ${[...CATEGORY_IDS].join(", ")}.`);
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT)
    throw new HttpError(400, "amount must be a number greater than 0.");
  if (typeof note !== "string" || note.length > 200) throw new HttpError(400, "note must be text of at most 200 characters.");
  if (id !== undefined && (typeof id !== "string" || !/^[A-Za-z0-9_-]{4,64}$/.test(id)))
    throw new HttpError(400, "id may only contain letters, digits, '-' and '_' (4 to 64 characters).");
  if (requireId && id === undefined) throw new HttpError(400, "id is required.");
  return { id: id ?? randomUUID(), date, category, amount: Math.round(amount * 100) / 100, note: note.trim() };
}

function parseBudget(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT)
    throw new HttpError(400, "amount must be a number of 0 or more.");
  return Math.round(amount * 100) / 100;
}

function parseMonth(month) {
  if (month === undefined) return undefined;
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, "month must be in YYYY-MM format.");
  return month;
}

const csvCell = v => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheets from running cell text as a formula
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Optional HTTP Basic auth: set APP_PASSWORD (and optionally APP_USER) to require a login.
function basicAuth(user, password) {
  const expected = Buffer.from(`${user}:${password}`);
  return (req, res, next) => {
    const header = req.get("authorization") || "";
    const given = Buffer.from(header.startsWith("Basic ") ? Buffer.from(header.slice(6), "base64").toString() : "");
    if (given.length === expected.length && timingSafeEqual(given, expected)) return next();
    res.set("WWW-Authenticate", 'Basic realm="Pocket Ledger", charset="UTF-8"').status(401).send("Login required.");
  };
}

// ---------- App ----------
export function createApp(db, { password = process.env.APP_PASSWORD, user = process.env.APP_USER || "ledger" } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => { res.set("X-Content-Type-Options", "nosniff"); next(); });
  if (password) app.use(basicAuth(user, password));
  app.use(express.json({ limit: "5mb" }));

  const api = express.Router();

  api.get("/health", (req, res) => res.json({ ok: true }));

  api.get("/categories", (req, res) => res.json(CATEGORIES));

  // Everything the dashboard needs in one request.
  api.get("/state", (req, res) => {
    const s = db.settings();
    res.json({
      initialized: s.initialized === "true",
      sample: s.sample === "true",
      currency: s.currency || "INR",
      budgets: db.budgets(),
      expenses: db.listExpenses(),
    });
  });

  api.get("/expenses", (req, res) => {
    const month = parseMonth(req.query.month);
    const category = req.query.category;
    if (category !== undefined && !CATEGORY_IDS.has(category)) throw new HttpError(400, "Unknown category.");
    let rows = db.listExpenses(month);
    if (category) rows = rows.filter(r => r.category === category);
    res.json(rows);
  });

  api.get("/expenses/:id", (req, res) => {
    const row = db.getExpense(req.params.id);
    if (!row) throw new HttpError(404, "No expense with that id.");
    res.json(row);
  });

  api.post("/expenses", (req, res) => {
    const e = parseExpense(req.body);
    if (db.getExpense(e.id)) throw new HttpError(409, "An expense with that id already exists.");
    res.status(201).json(db.addExpense(e));
  });

  api.put("/expenses/:id", (req, res) => {
    const e = parseExpense({ ...req.body, id: req.params.id });
    if (!db.updateExpense(req.params.id, e)) throw new HttpError(404, "No expense with that id.");
    res.json(db.getExpense(req.params.id));
  });

  api.delete("/expenses/:id", (req, res) => {
    if (!db.deleteExpense(req.params.id)) throw new HttpError(404, "No expense with that id.");
    res.status(204).end();
  });

  // Removes every expense (used by "Clear sample data"). Budgets and settings are kept.
  api.delete("/expenses", (req, res) => {
    db.clearExpenses();
    res.status(204).end();
  });

  api.get("/budgets", (req, res) => res.json(db.budgets()));

  api.put("/budgets/:category", (req, res) => {
    if (!CATEGORY_IDS.has(req.params.category)) throw new HttpError(404, "Unknown category.");
    db.setBudget(req.params.category, parseBudget(req.body?.amount));
    res.json(db.budgets());
  });

  api.put("/settings", (req, res) => {
    const { currency } = req.body || {};
    if (!CURRENCIES.has(currency)) throw new HttpError(400, `currency must be one of: ${[...CURRENCIES].join(", ")}.`);
    db.setSetting("currency", currency);
    res.json({ currency });
  });

  // Month totals per category, for other clients or reports.
  api.get("/summary", (req, res) => {
    const month = parseMonth(req.query.month);
    if (!month) throw new HttpError(400, "month is required, in YYYY-MM format.");
    const rows = db.summary(month);
    const budgets = db.budgets();
    const total = rows.reduce((a, r) => a + r.total, 0);
    const budgetTotal = Object.values(budgets).reduce((a, v) => a + v, 0);
    res.json({
      month, total, budgetTotal, remaining: budgetTotal - total,
      categories: CATEGORIES.map(c => {
        const r = rows.find(x => x.category === c.id);
        return { id: c.id, name: c.name, spent: r?.total ?? 0, count: r?.count ?? 0, budget: budgets[c.id] ?? 0 };
      }),
    });
  });

  // Loads a whole ledger at once: first-run sample data, or data moved over from browser storage.
  // Refuses to overwrite an existing ledger unless "replace": true is sent.
  api.post("/import", (req, res) => {
    const { expenses, budgets = {}, currency, sample = false, replace = false } = req.body || {};
    if (!Array.isArray(expenses) || expenses.length > 50000) throw new HttpError(400, "expenses must be an array of at most 50,000 items.");
    if (db.settings().initialized === "true" && !replace) throw new HttpError(409, "The ledger already has data. Send \"replace\": true to overwrite it.");
    const parsed = expenses.map(e => parseExpense(e));
    if (new Set(parsed.map(e => e.id)).size !== parsed.length) throw new HttpError(400, "Expense ids must be unique.");
    const cleanBudgets = {};
    for (const [c, v] of Object.entries(budgets)) {
      if (!CATEGORY_IDS.has(c)) throw new HttpError(400, `Unknown budget category: ${c}.`);
      cleanBudgets[c] = parseBudget(v);
    }
    if (currency !== undefined && !CURRENCIES.has(currency)) throw new HttpError(400, "Unknown currency.");
    db.importLedger({ expenses: parsed, budgets: cleanBudgets, currency, sample, replace });
    res.status(201).json({ imported: parsed.length });
  });

  // Spreadsheet-friendly download of every expense.
  api.get("/export.csv", (req, res) => {
    const rows = db.listExpenses();
    const name = Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]));
    const lines = ["date,category,amount,note", ...rows.map(r => [r.date, name[r.category] ?? r.category, r.amount, r.note].map(csvCell).join(","))];
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", 'attachment; filename="pocket-ledger.csv"');
    res.send(lines.join("\n") + "\n");
  });

  app.use("/api", api);
  app.use("/api", (req, res) => res.status(404).json({ error: "No such API endpoint." }));

  // The dashboard itself.
  app.get(["/", "/index.html"], (req, res) => res.sendFile(FRONTEND));

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const message = err instanceof HttpError ? err.message
      : err.type === "entity.parse.failed" ? "Request body is not valid JSON."
      : err.type === "entity.too.large" ? "Request body is too large."
      : "Something went wrong on the server.";
    res.status(status).json({ error: message });
  });

  return app;
}

// ---------- Start ----------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const dbPath = process.env.DB_PATH || join(HERE, "../data/ledger.db");
  const db = openDb(dbPath);
  const server = createApp(db).listen(port, () => {
    console.log(`Pocket Ledger running at http://localhost:${port}  (database: ${dbPath})`);
    if (!process.env.APP_PASSWORD) console.log("Tip: set APP_PASSWORD to require a login before exposing this to the internet.");
  });
  const stop = () => server.close(() => { db.close(); process.exit(0); });
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
