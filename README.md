# Git-test
This is testing git

## Pocket Ledger: personal expense tracker

A personal expense dashboard with charts, budgets, expense categories, and EMI and SIP tracking. It comes in two parts:

- **Front end:** `index.html`, a single page written in HTML, CSS and plain JavaScript. It uses Chart.js for the charts.
- **Back end:** `backend/`, a Node.js + Express REST API that stores your data in a SQLite database file.

**What it shows**
- Month summary: total spent (with change vs. last month), budget remaining, daily average with a month-end projection, and top category
- Six-month stacked bar chart of spending by category
- Donut chart of this month's category split, with amounts and percentages
- Running total vs. budget pace, compared with the previous month
- Per-category budgets with editable limits and On track / Near limit / Over budget status
- EMI & SIP panel: loan EMIs paid and SIP amounts invested this month, their share of total outflow, and SIP totals over the last six months
- Spending by day of week
- A transactions table you can filter by category and search, with delete

**Categories:** Housing, Food & Dining, Transport, Utilities, Shopping, Health, Entertainment, Other, SIP and EMI.

## Running it with the back end

Needs Node.js 22.13 or newer. SQLite is built into Node, so there's nothing else to install.

```bash
cd backend
npm install
npm start
```

Open http://localhost:3000. The label under the title reads **Saved on your server**, and your data is kept in `backend/data/ledger.db`.

On first start the database is empty. The dashboard fills it with sample data, or, if this browser already has your own entries from the file-only mode, it moves those to the server instead. Use **Clear sample data** to start fresh.

Settings (environment variables):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `DB_PATH` | `backend/data/ledger.db` | Where the SQLite database file is stored |
| `APP_PASSWORD` | not set | When set, the browser asks for a login before showing anything. **Set this before putting the server on the internet.** |
| `APP_USER` | `ledger` | Username for that login |

Run the API tests with `npm test` in `backend/`.

### Deploying with Docker

```bash
docker build -t pocket-ledger .
docker run -d -p 3000:3000 -v ledger-data:/data -e APP_PASSWORD=choose-a-password pocket-ledger
```

The `ledger-data` volume keeps the database when the container is replaced. This image runs on any host that runs Docker containers, such as Render, Railway, Fly.io or a VPS. Give the host a persistent disk mounted at `/data`, or your data is lost on each redeploy.

## Running it without a server

Open `index.html` directly in a browser, or host it as a static page (for example on GitHub Pages). The dashboard then saves to that browser's localStorage, so the data stays on that one device.

## API

All endpoints are under `/api` and use JSON. Expenses look like `{ "id", "date": "YYYY-MM-DD", "category", "amount", "note" }`.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Returns `{ "ok": true }` |
| GET | `/api/state` | Everything the dashboard needs: expenses, budgets, currency, sample flag |
| GET | `/api/categories` | Category ids, names and default budgets |
| GET | `/api/expenses?month=YYYY-MM&category=id` | List expenses (both filters optional) |
| GET | `/api/expenses/:id` | One expense |
| POST | `/api/expenses` | Add an expense (`id` optional) |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| DELETE | `/api/expenses` | Delete all expenses |
| GET | `/api/budgets` | Budgets by category |
| PUT | `/api/budgets/:category` | Set a budget: `{ "amount": 5000 }` |
| PUT | `/api/settings` | Set the currency: `{ "currency": "INR" }` (INR, USD, EUR, GBP) |
| GET | `/api/summary?month=YYYY-MM` | Month totals, spend and budget per category |
| POST | `/api/import` | Load a whole ledger; send `"replace": true` to overwrite existing data |
| GET | `/api/export.csv` | Download every expense as a CSV file |

Example:

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-29","category":"sip","amount":5000,"note":"Index fund SIP"}'
```
