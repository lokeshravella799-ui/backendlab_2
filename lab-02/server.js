const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `);

    const countResult = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (countResult.count === 0) {
      await db.run(`
        INSERT INTO book (title, author, price, pages) VALUES
        ('The Alchemist', 'Paulo Coelho', 399, 208),
        ('Atomic Habits', 'James Clear', 499, 320),
        ('To Kill a Mockingbird', 'Harper Lee', 450, 281),
        ('1984', 'George Orwell', 350, 328),
        ('The Great Gatsby', 'F. Scott Fitzgerald', 299, 180),
        ('Pride and Prejudice', 'Jane Austen', 250, 279),
        ('The Hobbit', 'J.R.R. Tolkien', 599, 310),
        ('Rich Dad Poor Dad', 'Robert Kiyosaki', 420, 336),
        ('Clean Code', 'Robert C. Martin', 850, 464),
        ('The Pragmatic Programmer', 'Andrew Hunt', 799, 352);
      `);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/", (req, res) => {
  res.send({
    message: "Lab 2 SQLite CRUD API is running",
  });
});

app.get("/books/", async (req, res) => {
  try {
    const books = await db.all("SELECT * FROM book ORDER BY id ASC;");
    res.send(books);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (isNaN(bookId) || Number(bookId) <= 0) {
      return res.status(400).send({ error: "Invalid book ID" });
    }
    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) {
      return res.status(404).send({ error: "Book not found" });
    }
    res.send(book);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).send({ error: "Invalid request data" });
    }
    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
      [title, author, price, pages]
    );
    res.status(201).send({
      id: result.lastID,
      title,
      author,
      price,
      pages,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (isNaN(bookId) || Number(bookId) <= 0) {
      return res.status(400).send({ error: "Invalid book ID" });
    }
    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) {
      return res.status(404).send({ error: "Book not found" });
    }
    const { title, author, price, pages } = req.body;
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).send({ error: "Invalid request data" });
    }
    await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
      [title, author, price, pages, bookId]
    );
    res.send({
      id: Number(bookId),
      title,
      author,
      price,
      pages,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (isNaN(bookId) || Number(bookId) <= 0) {
      return res.status(400).send({ error: "Invalid book ID" });
    }
    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) {
      return res.status(404).send({ error: "Book not found" });
    }
    await db.run("DELETE FROM book WHERE id = ?;", [bookId]);
    res.send({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = app;
