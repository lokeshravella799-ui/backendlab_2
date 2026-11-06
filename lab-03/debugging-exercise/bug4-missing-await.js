/**
 * DEBUGGING EXERCISE - BUG 4: MISSING AWAIT
 *
 * Faculty Scenario:
 * An asynchronous Promise-returning database function is invoked without `await`:
 *   const books = db.all("SELECT * FROM book;"); // Missing await!
 *   res.json(books);
 *
 * Result:
 * - `books` is assigned an unresolved `Promise { <pending> }` object.
 * - When passed to `res.json(books)` or logged, it serializes to `{}` (empty object)
 *   instead of an array of records.
 * - If subsequent lines try to access array methods (e.g. `books.map` or `books.length`),
 *   it causes `TypeError: books.map is not a function`.
 *
 * Broken Code:
 * app.get("/books", (req, res) => {
 *   const books = db.all("SELECT * FROM book;"); // MISSING await!
 *   res.json(books); // Sends {} to client!
 * });
 *
 * Fixed Code:
 * app.get("/books", async (req, res) => {
 *   const books = await db.all("SELECT * FROM book;"); // FIXED with async/await
 *   res.json(books); // Sends actual array of book objects
 * });
 */

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const runDemo = async () => {
  const db = await open({
    filename: path.join(__dirname, "..", "books.db"),
    driver: sqlite3.Database,
  });

  console.log("Simulating Missing Await Bug:");

  // 1. Without await:
  const pendingPromise = db.all("SELECT * FROM book;");
  console.log("-> Without await:", pendingPromise);
  console.log("-> JSON.stringify without await:", JSON.stringify(pendingPromise)); // Outputs "{}"

  // 2. With await:
  const resolvedData = await db.all("SELECT * FROM book LIMIT 2;");
  console.log("-> [FIXED] With await:", resolvedData);

  await db.close();
};

if (require.main === module) {
  runDemo();
}

