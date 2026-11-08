const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const SEED_BOOKS = [
  ["The Pragmatic Programmer", "Andrew Hunt", 450],
  ["Clean Code", "Robert C. Martin", 520],
  ["Eloquent JavaScript", "Marijn Haverbeke", 380],
  ["You Don't Know JS", "Kyle Simpson", 299],
  ["Node.js Design Patterns", "Mario Casciaro", 650],
  ["Learning SQL", "Alan Beaulieu", 410],
  ["Designing Data-Intensive Applications", "Martin Kleppmann", 899],
  ["JavaScript: The Good Parts", "Douglas Crockford", 250],
  ["Refactoring", "Martin Fowler", 720],
  ["Introduction to Algorithms", "Thomas H. Cormen", 990],
  ["Head First Design Patterns", "Eric Freeman", 560],
  ["Code Complete", "Steve McConnell", 610],
];

async function initDb(dbPath = process.env.DB_PATH || "./books.db") {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      author     TEXT    NOT NULL,
      price      REAL    NOT NULL CHECK (price >= 0),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}

// Insert sample rows only when the table is empty (safe to call on every start).
async function seedIfEmpty(db) {
  const { count } = await db.get("SELECT COUNT(*) AS count FROM books");
  if (count > 0) return;
  for (const [title, author, price] of SEED_BOOKS) {
    await db.run("INSERT INTO books (title, author, price) VALUES (?, ?, ?)", [title, author, price]);
  }
}

module.exports = { initDb, seedIfEmpty };
