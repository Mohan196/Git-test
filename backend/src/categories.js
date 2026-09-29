// Expense categories. Ids must match the CATS list in ../index.html.
export const CATEGORIES = [
  { id: "housing",   name: "Housing",       budget: 18000 },
  { id: "food",      name: "Food & Dining", budget: 12000 },
  { id: "transport", name: "Transport",     budget: 6000 },
  { id: "utilities", name: "Utilities",     budget: 4500 },
  { id: "shopping",  name: "Shopping",      budget: 6000 },
  { id: "health",    name: "Health",        budget: 3000 },
  { id: "fun",       name: "Entertainment", budget: 3500 },
  { id: "other",     name: "Other",         budget: 2500 },
  { id: "sip",       name: "SIP",           budget: 8000 },
  { id: "emi",       name: "EMI",           budget: 12200 },
];

export const CATEGORY_IDS = new Set(CATEGORIES.map(c => c.id));

export const CURRENCIES = new Set(["INR", "USD", "EUR", "GBP"]);
