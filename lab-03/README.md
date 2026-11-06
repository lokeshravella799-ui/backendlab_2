# Lab 3: REST API, query parameters, validation, debugging

**Name:** Ravella Lokesh  
**Registration Number:** 252U1R1217  
**Section:** AIDE-2B  
**Department:** Computer Science & Engineering (Artificial Intelligence and Data Engineering)  
**Institution:** Aurora Higher Education and Research Academy  
**Faculty:** Joel Prashanth D  
**Course:** Backend Development Fundamentals · Year II Term II  

---

## Live Link

- **Primary Deployed URL:** `https://backend-lab-03-aurora.onrender.com`  
- **API Status Endpoint:** `https://backend-lab-03-aurora.onrender.com/`  
- **Books Collection Endpoint:** `https://backend-lab-03-aurora.onrender.com/books`  

*(Note: If viewing on free tier hosting, allow up to 30 seconds for initial server spin-up from cold sleep. Complete Postman verification screenshots and automated test suite results covering all endpoints are provided below).*

---

## Objective

The objective of Lab 3 is to advance the basic CRUD routes developed in Lab 2 into a professional, production-ready RESTful API. Key milestones include:
1. Adhering to REST resource-oriented architecture by naming endpoints as nouns (`/books`) and utilizing standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) to express actions.
2. Implementing flexible query parameters on `GET /books`:
   - `search_q`: Case-insensitive partial title matching using SQL `LIKE`.
   - `order_by`: Dynamic sorting by column with strict whitelist validation to prevent SQL injection.
   - `order`: Sort direction (`ASC` or `DESC`).
   - `limit` and `offset`: Safe numeric pagination.
   - `min_price` and `max_price`: Range filtering using SQL `BETWEEN` or comparison operators.
3. Establishing strict input validation on `POST /books` and `PUT /books/:bookId`:
   - Rejecting requests with missing `title`, missing `author`, or non-numeric/negative `price` with HTTP `400 Bad Request`.
4. Delivering consistent HTTP status codes:
   - `201 Created` for resource creation.
   - `200 OK` for successful queries, updates, and deletions.
   - `400 Bad Request` for invalid input parameters or malformed payloads.
   - `404 Not Found` for non-existent resource IDs.
   - `500 Internal Server Error` for unhandled exceptions.
5. Standardizing error and status messages using the uniform JSON format `{ "message": "..." }`.
6. Resolving four common backend debugging challenges: port conflict (`EADDRINUSE`), wrong import path, database table name typo, and missing asynchronous `await`.

---

## How to Run

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended; verified on Node.js v24)
- **npm** (v9.0.0 or higher)
- **Git**

### 2. Environment Variables
Copy `.env.example` to `.env` in the `lab-03` directory:
```bash
cp .env.example .env
```

| Variable Name | Description | Default / Example Value |
| :--- | :--- | :--- |
| `PORT` | Network port for Express HTTP server | `3000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `DB_PATH` | File path to local SQLite database | `./books.db` |

> *Rule: Real credentials and `.env` files are never committed to version control. The repository ignores `.env` via `.gitignore`.*

### 3. Installation
Navigate into the `lab-03/` folder and install dependencies:
```bash
cd lab-03
npm install
```

### 4. Running the Application

- **Production Mode:**
  ```bash
  npm start
  ```
- **Development Mode (with auto-restart via nodemon):**
  ```bash
  npm run dev
  ```
- **Run the Automated Test Suite (22 test cases):**
  ```bash
  npm test
  ```
- **Inspect SQLite Database Rows via Terminal:**
  ```bash
  npm run db:view
  ```

---

## Endpoints / Scripts Table

| HTTP Method | Endpoint / Route | Parameters (Query / Body / Path) | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | `200 OK` | Root health-check endpoint displaying API status and available routes. |
| `GET` | `/books` | `search_q` (string, default `""`)<br>`order_by` (col, default `"id"`)<br>`order` (`ASC`/`DESC`, default `"ASC"`)<br>`limit` (int, default `10`)<br>`offset` (int, default `0`)<br>`min_price` (num, optional)<br>`max_price` (num, optional) | `200 OK`<br>`400 Bad Request`<br>`500 Internal Error` | Retrieves paginated books collection with search, sort, and price-range filters. |
| `GET` | `/books/:bookId` | Path: `bookId` (positive integer) | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` | Retrieves a single book matching the supplied numeric ID. |
| `POST` | `/books` | Body: `{ title, author, price, pages }` | `201 Created`<br>`400 Bad Request`<br>`500 Internal Error` | Validates and creates a new book record in SQLite; returns the created entity with generated ID. |
| `PUT` | `/books/:bookId` | Path: `bookId`<br>Body: `{ title, author, price, pages }` | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` | Validates payload, verifies existence, and updates all fields of the specified book. |
| `DELETE` | `/books/:bookId` | Path: `bookId` (positive integer) | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` | Deletes the specified book from the database with consistent JSON confirmation message. |

---

## SQL Parameterization & Security Design

To uphold the core rule **"Use parameterized queries; never build SQL by joining user input into the string"**:

1. **WHERE Clause & Values (`?` placeholders):**
   - User-supplied values for title search (`%search_q%`), minimum price, maximum price, pagination `LIMIT`, pagination `OFFSET`, and entity `id` are passed exclusively via parameterized arrays (`?` tokens).
   - This ensures the SQL engine treats incoming values strictly as literal data, preventing SQL Injection vulnerabilities.

2. **Order By & Sort Direction (Whitelist Validation):**
   - Since SQL standards do not allow column names or `ASC`/`DESC` keywords to be parameterized via `?`, dynamic values are sanitized against strict whitelists before injection:
     ```javascript
     const allowedColumns = ["id", "title", "author", "price", "pages"];
     if (!allowedColumns.includes(sanitizedOrderBy)) {
       return res.status(400).json({ message: "Invalid query parameter: 'order_by'" });
     }
     ```

---

## Screenshots

### 1. Successful Query & Filtering Operations

#### 1.1 GET /books - Default Retrieval & Pagination (200 OK)
Default retrieval returning the first 10 records ordered by `id ASC`.
![GET /books default](screenshots/01-get-all-books.png)

#### 1.2 GET /books?search_q=Clean - Partial Title Search using LIKE (200 OK)
Filter books where `title LIKE '%Clean%'`. Returns matching record *Clean Code*.
![GET /books search](screenshots/02-search-title-like.png)

#### 1.3 GET /books?order_by=price&order=DESC - Sorting by Price Descending (200 OK)
Sorts records by highest price first using whitelisted column ordering.
![GET /books sort](screenshots/03-sort-order-by-price-desc.png)

#### 1.4 GET /books?min_price=300&max_price=500 - Price Range Filter (200 OK)
Filters records using parameterized `price BETWEEN ? AND ?`.
![GET /books price range](screenshots/04-filter-price-range.png)

#### 1.5 GET /books?limit=3&offset=2 - Pagination with Limit & Offset (200 OK)
Returns 3 records after skipping the first 2 records using `LIMIT ? OFFSET ?`.
![GET /books pagination](screenshots/05-pagination-limit-offset.png)

#### 1.6 GET /books/1 - Retrieve Single Book by ID (200 OK)
Retrieves the unique record with primary key `id = 1`.
![GET /books/1 single](screenshots/06-get-book-by-id.png)

---

### 2. Creation, Update, and Deletion Operations

#### 2.1 POST /books - Create Book with Validation (201 Created)
Inserts a new book entity into the database and returns the created record with HTTP 201.
![POST /books create](screenshots/07-post-create-book-201.png)

#### 2.2 PUT /books/1 - Update Existing Book (200 OK)
Updates the title and price of book ID 1, returning the refreshed record with HTTP 200.
![PUT /books/1 update](screenshots/08-put-update-book-200.png)

#### 2.3 DELETE /books/10 - Delete Book by ID (200 OK)
Deletes book ID 10 and returns consistent JSON confirmation message `{ "message": "Book deleted successfully" }`.
![DELETE /books/10 delete](screenshots/09-delete-book-200.png)

---

### 3. Failure Cases & Input Validation

#### 3.1 POST /books - 400 Bad Request (Missing Title / Author)
Rejects invalid POST body when required string fields are omitted.
![POST 400 missing fields](screenshots/10-error-400-missing-fields.png)

#### 3.2 POST /books - 400 Bad Request (Non-numeric Price)
Rejects payload when `price` is passed as non-numeric string (`"free"`).
![POST 400 invalid price](screenshots/11-error-400-invalid-price.png)

#### 3.3 GET /books/9999 - 404 Not Found (Missing Record)
Returns standardized `{ "message": "Book not found with ID 9999" }` when the ID does not exist.
![GET 404 not found](screenshots/12-error-404-book-not-found.png)

#### 3.4 GET /books/invalid_id - 400 Bad Request (Invalid Path Parameter)
Rejects non-numeric ID parameter before query execution.
![GET 400 invalid id](screenshots/13-error-400-invalid-id.png)

---

### 4. Database & Server Terminal Verification

#### 4.1 SQLite Database View (`npm run db:view`)
Shows the underlying `book` relational table in SQLite with schema columns and sample records.
![SQLite Database View](screenshots/14-database-view.png)

#### 4.2 Server Startup (`npm start`)
Express server initializing SQLite asynchronous connection and binding to port 3000.
![Server Startup](screenshots/15-server-startup.png)

#### 4.3 Automated Test Suite Passing (`npm test`)
Comprehensive test runner output confirming 22 out of 22 test cases passed (100%).
![Automated Tests](screenshots/16-automated-tests-pass.png)

---

## Notes: Problems Faced and How You Solved Them

During the debugging exercise, the faculty provided a broken version of the application containing four common real-world bugs. Here is how each issue was diagnosed and resolved:

### 1. Port Conflict (`EADDRINUSE`)
- **Symptom:**  
  Starting the server caused `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause:**  
  A previous Node.js instance had not terminated cleanly and remained bound to port 3000, or multiple processes were run on the same hardcoded port.
- **Solution:**
  1. Modified `server.js` to read from `process.env.PORT || 3000`.
  2. Registered an `'error'` event listener on the server object. When `err.code === 'EADDRINUSE'`, the server gracefully logs a warning and attempts fallback to `port + 1`:
     ```javascript
     server.on("error", (err) => {
       if (err.code === "EADDRINUSE") {
         console.warn(`Port ${portToUse} in use. Retrying on ${portToUse + 1}...`);
         initializeDBAndServer(Number(portToUse) + 1);
       }
     });
     ```
  3. Utilized PowerShell process termination when releasing the port manually:
     ```powershell
     Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
     ```

### 2. Wrong Import Path (`MODULE_NOT_FOUND`)
- **Symptom:**  
  `Error: Cannot find module './sqlite'` on application launch.
- **Root Cause:**  
  The import statement used a relative path (`./sqlite`) as if searching for a local JavaScript file, rather than referencing the installed npm package `sqlite`.
- **Solution:**  
  Corrected the import in `server.js` to import directly from the package name:
  ```javascript
  // BEFORE (Broken):
  const { open } = require("./sqlite");

  // AFTER (Fixed):
  const { open } = require("sqlite");
  const sqlite3 = require("sqlite3");
  ```

### 3. Table-Name Typo (`SQLITE_ERROR: no such table`)
- **Symptom:**  
  Endpoint queries failed with `SQLITE_ERROR: no such table: books`.
- **Root Cause:**  
  The DDL statement created the singular table `book` (`CREATE TABLE IF NOT EXISTS book`), but route queries attempted to select from `books` (plural).
- **Solution:**  
  Standardized all SQL statements across route handlers to reference the exact table name `book`.

### 4. Missing `await` (`Promise { <pending> }` and Empty JSON Responses)
- **Symptom:**  
  The endpoint `GET /books` sent `{}` (empty object) back to Postman instead of an array of book objects, with no explicit error thrown.
- **Root Cause:**  
  Methods provided by promise-based database wrappers (such as `db.all` and `db.get`) return a `Promise`. Omitting the `await` keyword resulted in the pending promise object being passed directly to `res.json()`, which serializes unresolved promises to empty `{}`.
- **Solution:**  
  Marked all route handlers as `async` and prepended `await` to every database call:
  ```javascript
  // BEFORE (Broken):
  app.get("/books", (req, res) => {
    const books = db.all("SELECT * FROM book;"); // Missing await
    res.json(books);
  });

  // AFTER (Fixed):
  app.get("/books", async (req, res) => {
    const books = await db.all("SELECT * FROM book;"); // Correctly awaited
    res.status(200).json(books);
  });
  ```

---

## Viva Questions & Answers

### Q1: What is the difference between a Query Parameter and a Path Parameter?
- **Path Parameters (e.g., `/books/:bookId`):**
  - Path parameters are part of the URL path itself.
  - Used to identify a **specific resource instance** (essential for pointing to one unique record, e.g., `/books/4`).
  - Hierarchical and required by the route pattern.
- **Query Parameters (e.g., `/books?search_q=Clean&limit=5&order_by=price`):**
  - Appear after the `?` delimiter in the URL as `key=value` pairs separated by `&`.
  - Used to **filter, search, sort, or paginate** a collection without altering the resource identity.
  - Optional; routes provide standard default values when omitted.

---

### Q2: What does "stateless" mean in the context of RESTful APIs?
- In REST architecture, **statelessness** means that every HTTP request from a client must contain **all the context and information** needed by the server to understand and process that request.
- The server does **not store any client session state** between successive requests.
- **Benefits:**
  - **Horizontal Scalability:** Any server instance in a cluster can handle any incoming request.
  - **Reliability & Simplicity:** Server crashes do not corrupt client session memory; requests can simply be retried on alternate nodes.
  - **Visibility & Caching:** Monitoring tools and caches can inspect standalone requests and responses without consulting external session stores.

---

### Q3: Which HTTP status code should be returned for bad input versus a missing record?
- **Bad Input: `400 Bad Request`**
  - Returned when the client sends malformed syntax, invalid data types, out-of-range parameters, or fails body validation (e.g., passing a non-numeric string for `price`, omitting a required field like `title`, or requesting `min_price > max_price`).
  - Indicates that the client made an error in the request composition and should modify the request before resending.
- **Missing Record: `404 Not Found`**
  - Returned when the request is syntactically valid and properly formatted, but the targeted resource identified by the URI does not exist in the database (e.g., `GET /books/9999`).
  - Indicates that the resource URI is currently unresolvable.

---

## Postman Collection Usage

A complete Postman test collection with 16 automated assertions is included in the project:
`lab-03-postman-collection.json`

### Steps to Import & Execute:
1. Open Postman.
2. Click **Import** (top left) and select `lab-03/lab-03-postman-collection.json`.
3. Verify the collection variable `baseUrl` is set to `http://localhost:3000` (or your deployed URL).
4. Run individual requests or use the **Collection Runner** to execute all success and failure tests automatically.

