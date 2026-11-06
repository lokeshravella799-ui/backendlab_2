# Lab 3: Debugging Exercise Guide

This guide documents the 4 intentional bugs provided by faculty (Joel Prashanth D), detailing the root cause, symptoms, and the exact fixes implemented in the project.

---

### Bug 1: Port Conflict (`EADDRINUSE`)
- **Symptom:**  
  `Error: listen EADDRINUSE: address already in use :::3000`
- **Root Cause:**  
  A previous Node.js process was still running in the background and holding onto TCP port 3000, or multiple instances were initiated concurrently without dynamic port configuration.
- **How We Fixed It:**
  1. Configured port reading dynamically via environment variable: `const PORT = process.env.PORT || 3000`.
  2. Attached an `error` event listener on the server object to catch `EADDRINUSE` and attempt port fallback (`port + 1`):
     ```javascript
     server.on("error", (err) => {
       if (err.code === "EADDRINUSE") {
         initializeDBAndServer(Number(portToUse) + 1);
       }
     });
     ```
  3. Provided the Windows PowerShell command to identify and kill dangling processes if needed:
     ```powershell
     Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
     ```

---

### Bug 2: Wrong Import Path (`MODULE_NOT_FOUND`)
- **Symptom:**  
  `Error: Cannot find module './sqlite'` or `Cannot find module '../db/database'`
- **Root Cause:**  
  Using a relative file path (`./sqlite`) to import third-party packages installed in `node_modules`, instead of referencing the package name directly (`sqlite`).
- **How We Fixed It:**
  Corrected the module imports in `server.js`:
  ```javascript
  // BEFORE (Broken):
  const { open } = require("./sqlite");

  // AFTER (Fixed):
  const { open } = require("sqlite");
  const sqlite3 = require("sqlite3");
  ```

---

### Bug 3: Table-Name Typo (`SQLITE_ERROR: no such table`)
- **Symptom:**  
  `SQLITE_ERROR: no such table: books`
- **Root Cause:**  
  The schema creation statement defined the table in singular form (`CREATE TABLE IF NOT EXISTS book`), but SQL queries in the route handlers referenced the plural form (`FROM books`). SQLite is case-insensitive for table names but requires strict exact name matching.
- **How We Fixed It:**
  Standardized all queries across the codebase to use the singular table name `book`:
  ```javascript
  // BEFORE (Broken):
  SELECT * FROM books;

  // AFTER (Fixed):
  SELECT * FROM book;
  ```

---

### Bug 4: Missing `await` (`Promise { <pending> }` and Empty JSON)
- **Symptom:**  
  The API returned empty JSON `{}` to Postman or crashed with `TypeError: books.map is not a function`.
- **Root Cause:**  
  Asynchronous methods from promise-based libraries (like `sqlite`'s `db.all`, `db.get`, `db.run`) return a `Promise`. When called without the `await` keyword, the variable holds a pending promise rather than the actual query results. When Express serializes a pending Promise with `res.json()`, it produces `{}`.
- **How We Fixed It:**
  Ensured route handler functions are declared with `async`, and added `await` prior to every database execution:
  ```javascript
  // BEFORE (Broken):
  app.get("/books", (req, res) => {
    const books = db.all("SELECT * FROM book;"); // Missing await!
    res.json(books); // Emits {}
  });

  // AFTER (Fixed):
  app.get("/books", async (req, res) => {
    const books = await db.all("SELECT * FROM book;"); // Properly awaited
    res.status(200).json(books);
  });
  ```

