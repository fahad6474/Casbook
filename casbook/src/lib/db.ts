import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'cashbook.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'all',
      color TEXT NOT NULL DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'Partner'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'withdrawal')),
      category_id INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL CHECK(amount > 0),
      partner_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (partner_id) REFERENCES partners(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);

  // Seed default categories
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, type, color) VALUES (?, ?, ?)');
    const cats = [
      ['Sales Revenue', 'income', '#22c55e'],
      ['Service Income', 'income', '#16a34a'],
      ['Other Income', 'income', '#4ade80'],
      ['Office Supplies', 'expense', '#ef4444'],
      ['Rent & Utilities', 'expense', '#dc2626'],
      ['Salaries', 'expense', '#f97316'],
      ['Marketing', 'expense', '#fb923c'],
      ['Travel', 'expense', '#eab308'],
      ['Food & Entertainment', 'expense', '#a855f7'],
      ['Equipment', 'expense', '#8b5cf6'],
      ['Miscellaneous', 'all', '#6366f1'],
      ['Owner Withdrawal', 'withdrawal', '#ec4899'],
      ['Partner Withdrawal', 'withdrawal', '#f43f5e'],
    ];
    const insertMany = db.transaction((cats: string[][]) => {
      for (const cat of cats) insertCat.run(cat[0], cat[1], cat[2]);
    });
    insertMany(cats);
  }

  // Seed default partners
  const partCount = (db.prepare('SELECT COUNT(*) as c FROM partners').get() as { c: number }).c;
  if (partCount === 0) {
    const insertPart = db.prepare('INSERT OR IGNORE INTO partners (name, role) VALUES (?, ?)');
    insertPart.run('Owner', 'Owner');
    insertPart.run('Partner', 'Partner');
  }
}

export default getDb;
