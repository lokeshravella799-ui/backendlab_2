/**
 * Lab 3: REST API, query parameters, validation, debugging
 * Backend Development Fundamentals · Year II Term II · Aurora
 * Faculty: Yugandhar Gurjalwar
 * Student: Ravella Lokesh (252U1R1217) · Section: AIDE-2B
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Middleware: parse incoming JSON request bodies
app.use(express.json());

// Path to SQLite database file
const dbPath = process.env.DB_PATH || path.join(__dirname, "books.db");

// Database instance variable
let db = null;

/**
 * Initialize SQLite database and seed initial records if empty
 */
const initializeDBAndServer = async (portToUse = process.env.PORT || 3000) => {
  try {
    // 1. Open SQLite database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("Database connected successfully at:", dbPath);

    // 2. Create 'book' table if it doesn't already exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `;
    await db.exec(createTableQuery);

    // 3. Seed sample books if table is empty
    const countResult = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (countResult.count === 0) {
      const sampleFile = path.join(__dirname, "sample-books.json");
      let sampleBooks = [];
      if (fs.existsSync(sampleFile)) {
        sampleBooks = JSON.parse(fs.readFileSync(sampleFile, "utf-8"));
      } else {
        sampleBooks = [
          {
            title: "The Alchemist",
            author: "Paulo Coelho",
            price: 399,
            pages: 208,
          },
          {
            title: "Atomic Habits",
            author: "James Clear",
            price: 499,
            pages: 320,
          },
          {
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            price: 450,
            pages: 281,
          },
          { title: "1984", author: "George Orwell", price: 350, pages: 328 },
          {
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            price: 299,
            pages: 180,
          },
          {
            title: "Pride and Prejudice",
            author: "Jane Austen",
            price: 250,
            pages: 279,
          },
          {
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            price: 599,
            pages: 310,
          },
          {
            title: "Rich Dad Poor Dad",
            author: "Robert Kiyosaki",
            price: 420,
            pages: 336,
          },
          {
            title: "Clean Code",
            author: "Robert C. Martin",
            price: 850,
            pages: 464,
          },
          {
            title: "The Pragmatic Programmer",
            author: "Andrew Hunt",
            price: 799,
            pages: 352,
          },
        ];
      }

      for (const b of sampleBooks) {
        await db.run(
          "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
          [b.title, b.author, b.price, b.pages],
        );
      }
      console.log(`Successfully seeded ${sampleBooks.length} sample books.`);
    }

    // 4. Start HTTP Server with port conflict handling
    const server = app.listen(portToUse, () => {
      console.log(`Server running at http://localhost:${portToUse}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(
          `Port ${portToUse} is in use. Trying port ${Number(portToUse) + 1}...`,
        );
        initializeDBAndServer(Number(portToUse) + 1);
      } else {
        console.error("Server error:", err);
      }
    });

    return server;
  } catch (error) {
    console.error(`Failed to initialize database and server: ${error.message}`);
    process.exit(1);
  }
};

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

/**
 * Root Status Endpoint
 * GET /
 */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Lab 3: REST API with Query Parameters and Validation is running",
    student: "Ravella Lokesh (252U1R1217)",
    endpoints: {
      "GET /books": "Search, filter, sort, paginate books collection",
      "GET /books/:bookId": "Retrieve a single book by ID",
      "POST /books": "Create a new book with validation",
      "PUT /books/:bookId": "Update an existing book by ID",
      "DELETE /books/:bookId": "Delete a book by ID",
    },
  });
});

/**
 * GET /books
 * Retrieve books with query parameters:
 * - search_q: partial title match with LIKE (default: "")
 * - order_by: column to sort by (default: "id")
 * - order: sort direction "ASC" or "DESC" (default: "ASC")
 * - limit: number of records per page (default: 10)
 * - offset: number of records to skip (default: 0)
 * - min_price & max_price: price range filter using BETWEEN or inequality conditions
 */
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

    // 1. Validate and sanitize pagination parameters
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "Invalid query parameter: 'limit' must be a positive integer",
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message:
          "Invalid query parameter: 'offset' must be a non-negative integer",
      });
    }

    // 2. Validate and whitelist sorting columns (prevent SQL injection)
    const allowedSortColumns = ["id", "title", "author", "price", "pages"];
    const sanitizedOrderBy = allowedSortColumns.includes(
      String(order_by).toLowerCase(),
    )
      ? String(order_by).toLowerCase()
      : null;

    if (!sanitizedOrderBy) {
      return res.status(400).json({
        message: `Invalid query parameter: 'order_by' must be one of [${allowedSortColumns.join(", ")}]`,
      });
    }

    // 3. Validate sort direction
    const sanitizedOrder = String(order).toUpperCase();
    if (sanitizedOrder !== "ASC" && sanitizedOrder !== "DESC") {
      return res.status(400).json({
        message:
          "Invalid query parameter: 'order' must be either 'ASC' or 'DESC'",
      });
    }

    // 4. Construct SQL query with parameterized WHERE conditions
    const whereClauses = [];
    const queryParams = [];

    // Search partial title match (case-insensitive LIKE)
    if (typeof search_q === "string" && search_q.trim() !== "") {
      whereClauses.push("title LIKE ?");
      queryParams.push(`%${search_q.trim()}%`);
    }

    // Price range filtering
    const hasMinPrice = min_price !== undefined && min_price !== "";
    const hasMaxPrice = max_price !== undefined && max_price !== "";

    if (hasMinPrice && hasMaxPrice) {
      const minNum = parseFloat(min_price);
      const maxNum = parseFloat(max_price);

      if (isNaN(minNum) || isNaN(maxNum)) {
        return res.status(400).json({
          message:
            "Invalid query parameter: 'min_price' and 'max_price' must be numbers",
        });
      }
      if (minNum > maxNum) {
        return res.status(400).json({
          message:
            "Invalid query parameter: 'min_price' cannot be greater than 'max_price'",
        });
      }

      whereClauses.push("price BETWEEN ? AND ?");
      queryParams.push(minNum, maxNum);
    } else if (hasMinPrice) {
      const minNum = parseFloat(min_price);
      if (isNaN(minNum)) {
        return res.status(400).json({
          message: "Invalid query parameter: 'min_price' must be a number",
        });
      }
      whereClauses.push("price >= ?");
      queryParams.push(minNum);
    } else if (hasMaxPrice) {
      const maxNum = parseFloat(max_price);
      if (isNaN(maxNum)) {
        return res.status(400).json({
          message: "Invalid query parameter: 'max_price' must be a number",
        });
      }
      whereClauses.push("price <= ?");
      queryParams.push(maxNum);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Build finalized parameterized SQL query
    const sqlQuery = `
      SELECT id, title, author, price, pages
      FROM book
      ${whereSql}
      ORDER BY ${sanitizedOrderBy} ${sanitizedOrder}
      LIMIT ? OFFSET ?;
    `;

    queryParams.push(parsedLimit, parsedOffset);

    // Execute safe parameterized query
    const books = await db.all(sqlQuery, queryParams);

    res.status(200).json(books);
  } catch (error) {
    console.error(`Error in GET /books: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /books/:bookId
 * Retrieve a single book by ID
 */
app.get(["/books/:bookId", "/books/:bookId/"], async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);

    // Validate ID
    if (isNaN(parsedId) || parsedId <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid book ID. Must be a positive integer." });
    }

    // Parameterized query using '?'
    const book = await db.get(
      "SELECT id, title, author, price, pages FROM book WHERE id = ?;",
      [parsedId],
    );

    if (!book) {
      return res
        .status(404)
        .json({ message: `Book not found with ID ${parsedId}` });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error(`Error in GET /books/:bookId: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /books
 * Create a new book with strict body validation:
 * Rejects missing title, missing author, or non-numeric price with 400 and clear message
 */
app.post(["/books", "/books/"], async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validation: Title
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message:
          "Invalid request: 'title' is required and must be a non-empty string.",
      });
    }

    // Validation: Author
    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        message:
          "Invalid request: 'author' is required and must be a non-empty string.",
      });
    }

    // Validation: Price (must be numeric and non-negative)
    if (
      price === undefined ||
      price === null ||
      price === "" ||
      isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message:
          "Invalid request: 'price' is required and must be a valid non-negative number.",
      });
    }

    // Validation: Pages (optional or positive number)
    const parsedPages = pages !== undefined ? Number(pages) : 100;
    if (isNaN(parsedPages) || parsedPages <= 0) {
      return res.status(400).json({
        message: "Invalid request: 'pages' must be a positive integer.",
      });
    }

    // Parameterized insert query
    const insertQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(insertQuery, [
      title.trim(),
      author.trim(),
      Math.round(Number(price)),
      Math.round(parsedPages),
    ]);

    // Return 201 Created with the new book record
    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: Math.round(Number(price)),
      pages: Math.round(parsedPages),
    };

    res.status(201).json(createdBook);
  } catch (error) {
    console.error(`Error in POST /books: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PUT /books/:bookId
 * Update an existing book by ID
 */
app.put(["/books/:bookId", "/books/:bookId/"], async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);

    // Validate ID
    if (isNaN(parsedId) || parsedId <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid book ID. Must be a positive integer." });
    }

    // Verify existing record
    const existingBook = await db.get("SELECT id FROM book WHERE id = ?;", [
      parsedId,
    ]);
    if (!existingBook) {
      return res
        .status(404)
        .json({ message: `Book not found with ID ${parsedId}` });
    }

    const { title, author, price, pages } = req.body;

    // Validate body fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message:
          "Invalid request: 'title' is required and must be a non-empty string.",
      });
    }
    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        message:
          "Invalid request: 'author' is required and must be a non-empty string.",
      });
    }
    if (
      price === undefined ||
      price === null ||
      price === "" ||
      isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message:
          "Invalid request: 'price' is required and must be a valid non-negative number.",
      });
    }

    const parsedPages = pages !== undefined ? Number(pages) : 100;
    if (isNaN(parsedPages) || parsedPages <= 0) {
      return res.status(400).json({
        message: "Invalid request: 'pages' must be a positive integer.",
      });
    }

    // Parameterized update query
    const updateQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateQuery, [
      title.trim(),
      author.trim(),
      Math.round(Number(price)),
      Math.round(parsedPages),
      parsedId,
    ]);

    // Return 200 OK with updated record
    res.status(200).json({
      id: parsedId,
      title: title.trim(),
      author: author.trim(),
      price: Math.round(Number(price)),
      pages: Math.round(parsedPages),
    });
  } catch (error) {
    console.error(`Error in PUT /books/:bookId: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /books/:bookId
 * Delete a book by ID
 */
app.delete(["/books/:bookId", "/books/:bookId/"], async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);

    // Validate ID
    if (isNaN(parsedId) || parsedId <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid book ID. Must be a positive integer." });
    }

    // Check if book exists
    const existingBook = await db.get("SELECT id FROM book WHERE id = ?;", [
      parsedId,
    ]);
    if (!existingBook) {
      return res
        .status(404)
        .json({ message: `Book not found with ID ${parsedId}` });
    }

    // Parameterized delete query
    await db.run("DELETE FROM book WHERE id = ?;", [parsedId]);

    // Return 200 OK with consistent message format
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(`Error in DELETE /books/:bookId: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Start DB and Server if executed directly
if (require.main === module) {
  initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer };
