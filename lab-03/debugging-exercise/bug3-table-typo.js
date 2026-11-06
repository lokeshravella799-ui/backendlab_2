/**
 * DEBUGGING EXERCISE - BUG 3: TABLE-NAME TYPO (NO SUCH TABLE)
 *
 * Faculty Scenario:
 * The table was created in the schema as singular `book`:
 *   CREATE TABLE IF NOT EXISTS book (...);
 * But a query references plural `books` (or vice versa):
 *   SELECT * FROM books;
 *
 * Runtime Error:
 *   "SQLITE_ERROR: no such table: books"
 *
 * Broken Code:
 * const getBooksQuery = "SELECT * FROM books;";
 * const books = await db.all(getBooksQuery); // Throws SQLITE_ERROR!
 *
 * Fixed Code:
 * const getBooksQuery = "SELECT * FROM book;"; // Match exact schema table name
 * const books = await db.all(getBooksQuery);
 */

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const runDemo = async () => {
  const db = await open({
    filename: path.join(__dirname, "..", "books.db"),
    driver: sqlite3.Database,
  });

  // Ensure table exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    );
  `);

  console.log("Simulating Table Name Typo Bug:");
  try {
    // Intentional bug demonstration
    await db.all("SELECT * FROM books;");
  } catch (err) {
    console.error("-> Caught Expected Bug:", err.message);
  }

  // Fixed execution
  const fixedRows = await db.all("SELECT * FROM book LIMIT 1;");
  console.log("-> [FIXED] Successfully queried table 'book':", fixedRows);

  await db.close();
};

if (require.main === module) {
  runDemo();
}

