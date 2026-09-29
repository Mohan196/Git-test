import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CATEGORIES } from "./categories.js";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS expenses (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL,
    category   TEXT NOT NULL,
    amount     REAL NOT NULL CHECK (amount > 0),
    note       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);

  CREATE TABLE IF NOT EXISTS budgets (
    category TEXT PRIMARY KEY,
    amount   REAL NOT NULL CHECK (amount >= 0)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

// Opens (or creates) the database and returns a small data-access layer.
// Pass ":memory:" for a throwaway database (used by the tests).
export function openDb(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);

  // SIP and EMI were retired as categories: drop them from sample data, move the user's own entries to Other.
  const isSample = db.prepare("SELECT value FROM settings WHERE key = 'sample'").get()?.value === "true";
  db.prepare(isSample
    ? "DELETE FROM expenses WHERE category IN ('sip', 'emi')"
    : "UPDATE expenses SET category = 'other' WHERE category IN ('sip', 'emi')").run();
  db.prepare("DELETE FROM budgets WHERE category IN ('sip', 'emi')").run();

  const insertBudget = db.prepare("INSERT OR IGNORE INTO budgets (category, amount) VALUES (?, ?)");
  for (const c of CATEGORIES) insertBudget.run(c.id, c.budget);

  const q = {
    allExpenses: db.prepare("SELECT id, date, category, amount, note FROM expenses ORDER BY date DESC, amount DESC"),
    monthExpenses: db.prepare("SELECT id, date, category, amount, note FROM expenses WHERE substr(date, 1, 7) = ? ORDER BY date DESC, amount DESC"),
    getExpense: db.prepare("SELECT id, date, category, amount, note FROM expenses WHERE id = ?"),
    insertExpense: db.prepare("INSERT INTO expenses (id, date, category, amount, note) VALUES (?, ?, ?, ?, ?)"),
    updateExpense: db.prepare("UPDATE expenses SET date = ?, category = ?, amount = ?, note = ? WHERE id = ?"),
    deleteExpense: db.prepare("DELETE FROM expenses WHERE id = ?"),
    deleteAll: db.prepare("DELETE FROM expenses"),
    budgets: db.prepare("SELECT category, amount FROM budgets"),
    setBudget: db.prepare("INSERT INTO budgets (category, amount) VALUES (?, ?) ON CONFLICT (category) DO UPDATE SET amount = excluded.amount"),
    settings: db.prepare("SELECT key, value FROM settings"),
    setSetting: db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value"),
    summary: db.prepare("SELECT category, SUM(amount) AS total, COUNT(*) AS count FROM expenses WHERE substr(date, 1, 7) = ? GROUP BY category"),
  };

  const tx = fn => {
    db.exec("BEGIN");
    try { const r = fn(); db.exec("COMMIT"); return r; }
    catch (e) { db.exec("ROLLBACK"); throw e; }
  };

  return {
    listExpenses: month => (month ? q.monthExpenses.all(month) : q.allExpenses.all()).map(plain),
    getExpense: id => plain(q.getExpense.get(id)),
    addExpense: e => { q.insertExpense.run(e.id, e.date, e.category, e.amount, e.note); return plain(q.getExpense.get(e.id)); },
    updateExpense: (id, e) => q.updateExpense.run(e.date, e.category, e.amount, e.note, id).changes > 0,
    deleteExpense: id => q.deleteExpense.run(id).changes > 0,
    clearExpenses: () => tx(() => { q.deleteAll.run(); q.setSetting.run("sample", "false"); }),

    budgets: () => Object.fromEntries(q.budgets.all().map(r => [r.category, r.amount])),
    setBudget: (category, amount) => q.setBudget.run(category, amount),

    settings: () => Object.fromEntries(q.settings.all().map(r => [r.key, r.value])),
    setSetting: (key, value) => q.setSetting.run(key, String(value)),

    summary: month => q.summary.all(month).map(plain),

    // Loads a full ledger in one transaction (first-run sample data, or data moved from browser storage).
    importLedger: ({ expenses, budgets, currency, sample, replace }) => tx(() => {
      if (replace) q.deleteAll.run();
      for (const e of expenses) q.insertExpense.run(e.id, e.date, e.category, e.amount, e.note);
      for (const [c, v] of Object.entries(budgets || {})) q.setBudget.run(c, v);
      if (currency) q.setSetting.run("currency", currency);
      q.setSetting.run("sample", String(Boolean(sample)));
      q.setSetting.run("initialized", "true");
    }),

    close: () => db.close(),
  };
}

// node:sqlite returns null-prototype rows; convert them to ordinary objects for JSON.
const plain = row => (row ? { ...row } : row);
