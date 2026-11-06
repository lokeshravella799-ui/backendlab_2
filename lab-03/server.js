const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
let db = null;

const initializeDBAndServer = async (port = process.env.PORT || 3000) => {
  try {
    db = await open({
      filename: dbPath,
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

    const count = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (count.count === 0) {
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
        ('The Pragmatic Programmer', 'Andrew Hunt', 799, 352),
        ('Design Patterns', 'Erich Gamma', 920, 395),
        ('Refactoring', 'Martin Fowler', 680, 448);
      `);
    }

    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        initializeDBAndServer(Number(port) + 1);
      }
    });

    return server;
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

if (require.main === module) {
  initializeDBAndServer();
}

app.get("/", (req, res) => {
  res.json({
    message: "Lab 3 REST API is running",
  });
});

app.get(["/books", "/books/"], async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ message: "Invalid query parameter: 'limit' must be a positive integer" });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ message: "Invalid query parameter: 'offset' must be a non-negative integer" });
    }

    const validColumns = ["id", "title", "author", "price", "pages"];
    if (!validColumns.includes(order_by.toLowerCase())) {
      return res.status(400).json({ message: "Invalid query parameter: 'order_by'" });
    }

    const sortOrder = order.toUpperCase();
    if (sortOrder !== "ASC" && sortOrder !== "DESC") {
      return res.status(400).json({ message: "Invalid query parameter: 'order'" });
    }

    let conditions = [];
    let params = [];

    if (search_q) {
      conditions.push("title LIKE ?");
      params.push(`%${search_q}%`);
    }

    if (min_price !== undefined && max_price !== undefined) {
      const min = Number(min_price);
      const max = Number(max_price);
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ message: "min_price and max_price must be numbers" });
      }
      if (min > max) {
        return res.status(400).json({ message: "min_price cannot be greater than max_price" });
      }
      conditions.push("price BETWEEN ? AND ?");
      params.push(min, max);
    } else if (min_price !== undefined) {
      const min = Number(min_price);
      if (isNaN(min)) {
        return res.status(400).json({ message: "min_price must be a number" });
      }
      conditions.push("price >= ?");
      params.push(min);
    } else if (max_price !== undefined) {
      const max = Number(max_price);
      if (isNaN(max)) {
        return res.status(400).json({ message: "max_price must be a number" });
      }
      conditions.push("price <= ?");
      params.push(max);
    }

    let whereClause = "";
    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    const query = `
      SELECT id, title, author, price, pages
      FROM book
      ${whereClause}
      ORDER BY ${order_by.toLowerCase()} ${sortOrder}
      LIMIT ? OFFSET ?;
    `;

    params.push(limitNum, offsetNum);

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get(["/books/:bookId", "/books/:bookId/"], async (req, res) => {
  try {
    const { bookId } = req.params;
    const id = parseInt(bookId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const book = await db.get("SELECT * FROM book WHERE id = ?;", [id]);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post(["/books", "/books/"], async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "title is required" });
    }

    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({ message: "author is required" });
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "price must be a valid number" });
    }

    const pageCount = pages ? Number(pages) : 100;
    if (isNaN(pageCount) || pageCount <= 0) {
      return res.status(400).json({ message: "pages must be a positive integer" });
    }

    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
      [title.trim(), author.trim(), Number(price), pageCount]
    );

    res.status(201).json({
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      pages: pageCount,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put(["/books/:bookId", "/books/:bookId/"], async (req, res) => {
  try {
    const { bookId } = req.params;
    const id = parseInt(bookId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const existing = await db.get("SELECT id FROM book WHERE id = ?;", [id]);
    if (!existing) {
      return res.status(404).json({ message: "Book not found" });
    }

    const { title, author, price, pages } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "title is required" });
    }

    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({ message: "author is required" });
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "price must be a valid number" });
    }

    const pageCount = pages ? Number(pages) : 100;

    await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
      [title.trim(), author.trim(), Number(price), pageCount, id]
    );

    res.status(200).json({
      id,
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      pages: pageCount,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete(["/books/:bookId", "/books/:bookId/"], async (req, res) => {
  try {
    const { bookId } = req.params;
    const id = parseInt(bookId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const existing = await db.get("SELECT id FROM book WHERE id = ?;", [id]);
    if (!existing) {
      return res.status(404).json({ message: "Book not found" });
    }

    await db.run("DELETE FROM book WHERE id = ?;", [id]);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = { app, initializeDBAndServer };
