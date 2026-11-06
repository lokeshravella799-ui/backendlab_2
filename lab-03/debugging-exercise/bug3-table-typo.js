const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const run = async () => {
  const db = await open({
    filename: path.join(__dirname, "..", "books.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    );
  `);

  try {
    await db.all("SELECT * FROM books;");
  } catch (err) {
    console.log("Expected Bug:", err.message);
  }

  const rows = await db.all("SELECT * FROM book LIMIT 1;");
  console.log("Fixed Query result:", rows);

  await db.close();
};

if (require.main === module) {
  run();
}
