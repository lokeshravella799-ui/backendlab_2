const express = require("express");
const path = require("path");
const fs = require("fs");
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
      const sampleFile = path.join(__dirname, "sample-books.json");
      let booksToSeed = [];
      if (fs.existsSync(sampleFile)) {
        booksToSeed = JSON.parse(fs.readFileSync(sampleFile, "utf-8"));
      } else {
        booksToSeed = [
          { title: "The Pragmatic Programmer", author: "David Thomas, Andrew Hunt", price: 750, pages: 352 },
          { title: "Clean Code", author: "Robert C. Martin", price: 650, pages: 464 },
          { title: "You Don't Know JS: Scope & Closures", author: "Kyle Simpson", price: 420, pages: 144 },
          { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 1200, pages: 616 },
          { title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 380, pages: 176 },
          { title: "Atomic Habits", author: "James Clear", price: 450, pages: 320 },
          { title: "Node.js Design Patterns", author: "Mario Casciaro", price: 890, pages: 660 },
          { title: "Learning SQL", author: "Alan Beaulieu", price: 550, pages: 380 },
          { title: "Introduction to Algorithms", author: "Thomas H. Cormen", price: 1400, pages: 1312 },
          { title: "Refactoring: Improving the Design of Existing Code", author: "Martin Fowler", price: 790, pages: 448 },
          { title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", price: 950, pages: 687 },
          { title: "Head First Design Patterns", author: "Eric Freeman", price: 720, pages: 694 },
          { title: "Eloquent JavaScript", author: "Marijn Haverbeke", price: 499, pages: 472 },
          { title: "Clean Architecture", author: "Robert C. Martin", price: 680, pages: 432 },
          { title: "Database System Concepts", author: "Abraham Silberschatz", price: 1150, pages: 1376 }
        ];
      }

      for (const b of booksToSeed) {
        await db.run(
          "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
          [b.title, b.author, b.price, b.pages]
        );
      }
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
    student: "Ravella Lokesh (252U1R1217)",
    section: "AIDE-2B"
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

    if (isNaN(limitNum) || limitNum < 0) {
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
      return res.status(404).json({ message: `Book with ID ${id} not found` });
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
      return res.status(404).json({ message: `Book with ID ${id} not found` });
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
      return res.status(404).json({ message: `Book with ID ${id} not found` });
    }

    await db.run("DELETE FROM book WHERE id = ?;", [id]);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = { app, initializeDBAndServer };
