const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
let db = null;
const JWT_SECRET = "my_secret_key_lab4";

const initializeDBAndServer = async (port = process.env.PORT || 8000) => {
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
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL
      );
    `);

    const userCount = await db.get("SELECT COUNT(*) AS count FROM user;");
    if (userCount.count === 0) {
      const sampleUserFile = path.join(__dirname, "sample-users.json");
      let usersToSeed = [];
      if (fs.existsSync(sampleUserFile)) {
        usersToSeed = JSON.parse(fs.readFileSync(sampleUserFile, "utf-8"));
      } else {
        usersToSeed = [
          { username: "ravella_lokesh", name: "Ravella Lokesh", password: "lokesh@password123" }
        ];
      }
      for (const u of usersToSeed) {
        const hashed = await bcrypt.hash(u.password, 10);
        await db.run(
          "INSERT INTO user (username, name, password) VALUES (?, ?, ?);",
          [u.username, u.name, hashed]
        );
      }
    }

    const count = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (count.count === 0) {
      const sampleFile = path.join(__dirname, "sample-books.json");
      let booksToSeed = [];
      if (fs.existsSync(sampleFile)) {
        booksToSeed = JSON.parse(fs.readFileSync(sampleFile, "utf-8"));
      } else {
        booksToSeed = [
          { title: "The Alchemist", author: "Paulo Coelho", price: 399, pages: 208 },
          { title: "Atomic Habits", author: "James Clear", price: 499, pages: 320 },
          { title: "To Kill a Mockingbird", author: "Harper Lee", price: 450, pages: 281 },
          { title: "1984", author: "George Orwell", price: 350, pages: 328 },
          { title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 299, pages: 180 },
          { title: "Pride and Prejudice", author: "Jane Austen", price: 250, pages: 279 },
          { title: "The Hobbit", author: "J.R.R. Tolkien", price: 599, pages: 310 },
          { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", price: 420, pages: 336 },
          { title: "Clean Code", author: "Robert C. Martin", price: 850, pages: 464 },
          { title: "The Pragmatic Programmer", author: "Andrew Hunt", price: 799, pages: 352 },
          { title: "Design Patterns", author: "Erich Gamma", price: 920, pages: 395 },
          { title: "Refactoring", author: "Martin Fowler", price: 680, pages: 448 }
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

app.get(["/users", "/users/"], async (req, res) => {
  try {
    const users = await db.all("SELECT id, username, name FROM user;");
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.all(["/register", "/register/"], async (req, res) => {
  try {
    const username = req.body?.username || req.query?.username;
    const name = req.body?.name || req.query?.name;
    const password = req.body?.password || req.query?.password;

    if (!username || typeof username !== "string" || username.trim() === "") {
      return res.status(400).json({ message: "username is required" });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ message: "name is required" });
    }

    if (!password || typeof password !== "string" || password.trim() === "") {
      return res.status(400).json({ message: "password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const existing = await db.get("SELECT id FROM user WHERE username = ?;", [username.trim()]);
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO user (username, name, password) VALUES (?, ?, ?);",
      [username.trim(), name.trim(), hashedPassword]
    );

    res.status(200).json({ message: "User created successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.all(["/login", "/login/"], async (req, res) => {
  try {
    const username = req.body?.username || req.query?.username;
    const password = req.body?.password || req.query?.password;

    if (!username || typeof username !== "string" || username.trim() === "") {
      return res.status(400).json({ message: "username is required" });
    }

    if (!password || typeof password !== "string" || password.trim() === "") {
      return res.status(400).json({ message: "password is required" });
    }

    const user = await db.get("SELECT * FROM user WHERE username = ?;", [username.trim()]);
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const payload = { username: user.username };
    const jwt_token = jwt.sign(payload, JWT_SECRET);

    res.status(200).json({ jwt_token });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = { app, initializeDBAndServer };
