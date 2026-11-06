const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const run = async () => {
  const db = await open({
    filename: path.join(__dirname, "..", "books.db"),
    driver: sqlite3.Database,
  });

  const pending = db.all("SELECT * FROM book;");
  console.log("Without await:", pending);
  console.log("JSON stringify:", JSON.stringify(pending));

  const resolved = await db.all("SELECT * FROM book LIMIT 2;");
  console.log("With await:", resolved);

  await db.close();
};

if (require.main === module) {
  run();
}
