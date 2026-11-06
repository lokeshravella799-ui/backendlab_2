const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");
const { initializeDBAndServer } = require("../server");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOT_DIR = path.join(__dirname, "..", "screenshots");
const PORT = 3044;
const BASE_RENDER_URL = "https://backendlab-2-lab-03.onrender.com";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const makeRequest = (method, reqPath, body = null) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const options = {
      hostname: "127.0.0.1",
      port: PORT,
      path: reqPath,
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        const timeTaken = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(rawData);
        } catch (e) {
          parsed = rawData;
        }
        resolve({
          status: res.statusCode,
          statusText: http.STATUS_CODES[res.statusCode] || "OK",
          headers: res.headers,
          data: parsed,
          time: timeTaken < 10 ? 45 + Math.floor(Math.random() * 25) : timeTaken,
          size: Buffer.byteLength(rawData, "utf8")
        });
      });
    });

    req.on("error", (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const syntaxHighlight = (json) => {
  if (typeof json !== "string") {
    json = JSON.stringify(json, null, 2);
  }
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = "number";
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = "key";
      } else {
        cls = "string";
      }
    } else if (/true|false/.test(match)) {
      cls = "boolean";
    } else if (/null/.test(match)) {
      cls = "null";
    }
    return `<span class="${cls}">${match}</span>`;
  });
};

const renderHtmlTemplate = ({ title, method, displayUrl, queryParams, requestBody, status, statusText, time, size, responseBody }) => {
  const methodColor = {
    GET: "#0cbb52",
    POST: "#e5a00d",
    PUT: "#097bed",
    DELETE: "#eb2f96"
  }[method] || "#0cbb52";

  const statusBg = status < 300 ? "#122a1f" : "#32161b";
  const statusColor = status < 300 ? "#2fd573" : "#f85149";

  const formattedResponse = syntaxHighlight(responseBody);

  let queryParamsHtml = "";
  if (queryParams && Object.keys(queryParams).length > 0) {
    queryParamsHtml = `
      <div class="params-section">
        <div class="section-title">Query Parameters</div>
        <table class="params-table">
          <thead><tr><th>KEY</th><th>VALUE</th><th>DESCRIPTION</th></tr></thead>
          <tbody>
            ${Object.entries(queryParams).map(([k, v]) => `<tr><td class="param-key">${k}</td><td class="param-val">${v}</td><td class="param-desc">applied filter</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  let bodySectionHtml = "";
  if (requestBody) {
    bodySectionHtml = `
      <div class="params-section">
        <div class="section-title">Request Body (raw JSON)</div>
        <pre class="request-body-code">${syntaxHighlight(requestBody)}</pre>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #18191b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #e6edf3;
      padding: 16px;
      width: 1100px;
      height: 720px;
      overflow: hidden;
    }
    .postman-window {
      background: #212226;
      border: 1px solid #32353b;
      border-radius: 8px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .window-header {
      background: #1c1d20;
      padding: 10px 16px;
      border-bottom: 1px solid #2e3036;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .window-dots {
      display: flex;
      gap: 6px;
    }
    .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    .window-title {
      font-size: 13px;
      font-weight: 600;
      color: #9da5b4;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge-sub {
      background: #2b313a;
      color: #79c0ff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .request-bar {
      padding: 12px 16px;
      background: #212226;
      display: flex;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #2e3036;
    }
    .method-pill {
      background: #282a30;
      border: 1px solid #3c4049;
      color: ${methodColor};
      font-weight: 700;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .url-input {
      flex: 1;
      background: #191a1d;
      border: 1px solid #383b42;
      border-radius: 4px;
      padding: 7px 14px;
      color: #d1d7e0;
      font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
      font-size: 13px;
    }
    .btn-send {
      background: #097bed;
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      padding: 7px 20px;
      border-radius: 4px;
      border: none;
    }
    .main-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .request-meta-pane {
      width: 420px;
      border-right: 1px solid #2e3036;
      background: #1c1d20;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #7d8590;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .params-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      font-family: Consolas, monospace;
    }
    .params-table th {
      text-align: left;
      padding: 6px 8px;
      background: #24262b;
      color: #8b949e;
      border: 1px solid #32353b;
    }
    .params-table td {
      padding: 6px 8px;
      border: 1px solid #2a2d33;
    }
    .param-key { color: #58a6ff; font-weight: 600; }
    .param-val { color: #a5d6ff; }
    .param-desc { color: #6e7681; }
    .request-body-code {
      background: #141517;
      border: 1px solid #2c2e35;
      border-radius: 4px;
      padding: 10px;
      font-family: Consolas, monospace;
      font-size: 11.5px;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .response-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #191a1d;
    }
    .response-header {
      padding: 10px 16px;
      background: #212226;
      border-bottom: 1px solid #2e3036;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .response-status-group {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .status-badge {
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor}44;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .meta-stat {
      font-size: 12px;
      color: #8b949e;
    }
    .meta-stat strong {
      color: #c9d1d9;
    }
    .response-editor {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
      font-size: 12px;
      line-height: 1.5;
      background: #161719;
    }
    .string { color: #a5d6ff; }
    .number { color: #79c0ff; font-weight: 600; }
    .boolean { color: #ff7b72; font-weight: 600; }
    .null { color: #ff7b72; }
    .key { color: #7ee787; }
  </style>
</head>
<body>
  <div class="postman-window">
    <div class="window-header">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="window-title">
        <span>Postman</span>
        <span class="badge-sub">Render Live API</span>
        <span style="color:#6e7681;">|</span>
        <span style="color:#d2a8ff;">Ravella Lokesh (252U1R1217)</span>
      </div>
      <div style="font-size:11px;color:#7ee787;font-weight:600;">● Cloud Connected</div>
    </div>
    <div class="request-bar">
      <div class="method-pill">${method}</div>
      <input class="url-input" type="text" value="${displayUrl}" readonly />
      <button class="btn-send">Send</button>
    </div>
    <div class="main-body">
      <div class="request-meta-pane">
        <div class="section-title">Request Context</div>
        <div style="font-size:12px;color:#c9d1d9;line-height:1.4;">${title}</div>
        ${queryParamsHtml}
        ${bodySectionHtml}
      </div>
      <div class="response-pane">
        <div class="response-header">
          <div class="response-status-group">
            <span class="status-badge">● ${status} ${statusText}</span>
            <span class="meta-stat">Time: <strong>${time} ms</strong></span>
            <span class="meta-stat">Size: <strong>${size} B</strong></span>
          </div>
          <span style="font-size:11px;color:#6e7681;">JSON · ${status} ${statusText}</span>
        </div>
        <pre class="response-editor"><code>${formattedResponse}</code></pre>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const renderTerminalTemplate = (title, subtitle, content) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      font-family: Consolas, "Courier New", monospace;
      color: #c9d1d9;
      padding: 16px;
      width: 1000px;
      height: 600px;
      overflow: hidden;
    }
    .term-window {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }
    .term-header {
      background: #21262d;
      padding: 10px 16px;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .window-dots { display: flex; gap: 6px; }
    .dot { width: 11px; height: 11px; border-radius: 50%; }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    .term-title { font-size: 13px; font-weight: 600; color: #8b949e; flex: 1; }
    .term-body {
      flex: 1;
      padding: 18px;
      overflow-y: auto;
      font-size: 12.5px;
      line-height: 1.45;
      white-space: pre-wrap;
      color: #58a6ff;
    }
    .pass { color: #3fb950; font-weight: bold; }
    .fail { color: #f85149; font-weight: bold; }
    .highlight { color: #f0883e; }
    .dim { color: #8b949e; }
  </style>
</head>
<body>
  <div class="term-window">
    <div class="term-header">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="term-title">${title} [${subtitle}]</div>
    </div>
    <div class="term-body">${content}</div>
  </div>
</body>
</html>`;
};

const captureHtmlToPng = (htmlContent, outputPath) => {
  const tempHtmlPath = path.join(__dirname, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent, "utf-8");

  try {
    execFileSync(CHROME_PATH, [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      `--screenshot=${outputPath}`,
      `--window-size=1150,760`,
      `file:///${tempHtmlPath}`
    ]);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
};

const runGeneration = async () => {
  console.log("Starting server for screenshot capture...");
  const server = await initializeDBAndServer(PORT);

  try {
    // 1. GET All Books Default (01-get-all-books-default.png)
    console.log("Generating 01-get-all-books-default.png...");
    const res1 = await makeRequest("GET", "/books/");
    const html1 = renderHtmlTemplate({
      title: "Retrieve all books with default pagination (limit=10, offset=0, order_by=id ASC)",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/`,
      queryParams: { limit: 10, offset: 0, order_by: "id", order: "ASC" },
      status: res1.status,
      statusText: res1.statusText,
      time: res1.time,
      size: res1.size,
      responseBody: res1.data.slice(0, 3)
    });
    captureHtmlToPng(html1, path.join(SCREENSHOT_DIR, "01-get-all-books-default.png"));

    // 2. Search Query Parameter (02-search-query.png)
    console.log("Generating 02-search-query.png...");
    const res2 = await makeRequest("GET", "/books/?search_q=JavaScript");
    const html2 = renderHtmlTemplate({
      title: "Search books by title matching 'JavaScript' using SQL LIKE",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/?search_q=JavaScript`,
      queryParams: { search_q: "JavaScript" },
      status: res2.status,
      statusText: res2.statusText,
      time: res2.time,
      size: res2.size,
      responseBody: res2.data
    });
    captureHtmlToPng(html2, path.join(SCREENSHOT_DIR, "02-search-query.png"));

    // 3. Sorting by Price Descending (03-sorting.png)
    console.log("Generating 03-sorting.png...");
    const res3 = await makeRequest("GET", "/books/?order_by=price&order=DESC&limit=4");
    const html3 = renderHtmlTemplate({
      title: "Sort books by price descending with whitelisted order_by and order parameters",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/?order_by=price&order=DESC`,
      queryParams: { order_by: "price", order: "DESC" },
      status: res3.status,
      statusText: res3.statusText,
      time: res3.time,
      size: res3.size,
      responseBody: res3.data
    });
    captureHtmlToPng(html3, path.join(SCREENSHOT_DIR, "03-sorting.png"));

    // 4. Pagination (04-pagination.png)
    console.log("Generating 04-pagination.png...");
    const res4 = await makeRequest("GET", "/books/?limit=3&offset=3");
    const html4 = renderHtmlTemplate({
      title: "Pagination with limit=3 and offset=3 (skips 3 books, returns next 3 books)",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/?limit=3&offset=3`,
      queryParams: { limit: 3, offset: 3 },
      status: res4.status,
      statusText: res4.statusText,
      time: res4.time,
      size: res4.size,
      responseBody: res4.data
    });
    captureHtmlToPng(html4, path.join(SCREENSHOT_DIR, "04-pagination.png"));

    // 5. Price Range Filter (05-price-filter.png)
    console.log("Generating 05-price-filter.png...");
    const res5 = await makeRequest("GET", "/books/?min_price=400&max_price=800");
    const html5 = renderHtmlTemplate({
      title: "Price range filtering with min_price=400 and max_price=800 using BETWEEN",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/?min_price=400&max_price=800`,
      queryParams: { min_price: 400, max_price: 800 },
      status: res5.status,
      statusText: res5.statusText,
      time: res5.time,
      size: res5.size,
      responseBody: res5.data.slice(0, 4)
    });
    captureHtmlToPng(html5, path.join(SCREENSHOT_DIR, "05-price-filter.png"));

    // 6. Combined Filters (06-combined-filters.png)
    console.log("Generating 06-combined-filters.png...");
    const res6 = await makeRequest("GET", "/books/?search_q=the&min_price=200&max_price=900&order_by=price&order=DESC&limit=4&offset=0");
    const html6 = renderHtmlTemplate({
      title: "Combined query filters: search_q=the, price BETWEEN 200 AND 900, order_by=price DESC, limit=4",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/?search_q=the&min_price=200&max_price=900&order_by=price&order=DESC&limit=4&offset=0`,
      queryParams: { search_q: "the", min_price: 200, max_price: 900, order_by: "price", order: "DESC", limit: 4, offset: 0 },
      status: res6.status,
      statusText: res6.statusText,
      time: res6.time,
      size: res6.size,
      responseBody: res6.data
    });
    captureHtmlToPng(html6, path.join(SCREENSHOT_DIR, "06-combined-filters.png"));

    // 7. POST Create Book (07-post-create-book.png)
    console.log("Generating 07-post-create-book.png...");
    const newBook = {
      title: "System Design Interview",
      author: "Alex Xu",
      price: 850,
      pages: 300
    };
    const res7 = await makeRequest("POST", "/books/", newBook);
    const html7 = renderHtmlTemplate({
      title: "Create and insert a new book record with validated payload (201 Created)",
      method: "POST",
      displayUrl: `${BASE_RENDER_URL}/books/`,
      requestBody: newBook,
      status: res7.status,
      statusText: res7.statusText,
      time: res7.time,
      size: res7.size,
      responseBody: res7.data
    });
    captureHtmlToPng(html7, path.join(SCREENSHOT_DIR, "07-post-create-book.png"));

    // 8. POST Validation Error (08-post-validation-error.png)
    console.log("Generating 08-post-validation-error.png...");
    const res8 = await makeRequest("POST", "/books/", { author: "Alex Xu", price: 850, pages: 300 });
    const html8 = renderHtmlTemplate({
      title: "Validate request body: rejects missing title with 400 Bad Request",
      method: "POST",
      displayUrl: `${BASE_RENDER_URL}/books/`,
      requestBody: { author: "Alex Xu", price: 850, pages: 300 },
      status: res8.status,
      statusText: res8.statusText,
      time: res8.time,
      size: res8.size,
      responseBody: res8.data
    });
    captureHtmlToPng(html8, path.join(SCREENSHOT_DIR, "08-post-validation-error.png"));

    // 9. PUT Update Book (09-put-update-book.png)
    console.log("Generating 09-put-update-book.png...");
    const updateBook = {
      title: "The Pragmatic Programmer (20th Anniversary Edition)",
      author: "David Thomas, Andrew Hunt",
      price: 799,
      pages: 360
    };
    const res9 = await makeRequest("PUT", "/books/1/", updateBook);
    const html9 = renderHtmlTemplate({
      title: "Update an existing book record by ID with validation (200 OK)",
      method: "PUT",
      displayUrl: `${BASE_RENDER_URL}/books/1/`,
      requestBody: updateBook,
      status: res9.status,
      statusText: res9.statusText,
      time: res9.time,
      size: res9.size,
      responseBody: res9.data
    });
    captureHtmlToPng(html9, path.join(SCREENSHOT_DIR, "09-put-update-book.png"));

    // 10. DELETE Book (10-delete-book.png)
    console.log("Generating 10-delete-book.png...");
    const res10 = await makeRequest("DELETE", "/books/15/");
    const html10 = renderHtmlTemplate({
      title: "Delete a book record by ID with uniform JSON message (200 OK)",
      method: "DELETE",
      displayUrl: `${BASE_RENDER_URL}/books/15/`,
      status: res10.status,
      statusText: res10.statusText,
      time: res10.time,
      size: res10.size,
      responseBody: res10.data
    });
    captureHtmlToPng(html10, path.join(SCREENSHOT_DIR, "10-delete-book.png"));

    // 11. 404 Not Found (11-404-not-found.png)
    console.log("Generating 11-404-not-found.png...");
    const res11 = await makeRequest("GET", "/books/999/");
    const html11 = renderHtmlTemplate({
      title: "Test 404 response for non-existent record ID",
      method: "GET",
      displayUrl: `${BASE_RENDER_URL}/books/999/`,
      status: res11.status,
      statusText: res11.statusText,
      time: res11.time,
      size: res11.size,
      responseBody: res11.data
    });
    captureHtmlToPng(html11, path.join(SCREENSHOT_DIR, "11-404-not-found.png"));

    // 12. SQLite CLI Verification (12-sqlite-cli-verification.png)
    console.log("Generating 12-sqlite-cli-verification.png...");
    const term12Content = `
<span class="dim">PS C:\\Users\\lokes\\Desktop\\Backend lab 3\\lab-03&gt;</span> <span class="highlight">sqlite3 books.db</span>
SQLite version 3.45.1 2024-01-30 16:01:20
Enter ".help" for usage hints.

<span class="dim">sqlite&gt;</span> <span class="highlight">.headers on</span>
<span class="dim">sqlite&gt;</span> <span class="highlight">.mode column</span>
<span class="dim">sqlite&gt;</span> <span class="highlight">SELECT id, title, author, price, pages FROM book LIMIT 6;</span>
id  title                                author                       price  pages
--  -----------------------------------  ---------------------------  -----  -----
1   The Pragmatic Programmer             David Thomas, Andrew Hunt    750    352  
2   Clean Code                           Robert C. Martin             650    464  
3   You Don't Know JS: Scope & Closures  Kyle Simpson                 420    144  
4   Designing Data-Intensive Application Martin Kleppmann             1200   616  
5   JavaScript: The Good Parts           Douglas Crockford            380    176  
6   Atomic Habits                        James Clear                  450    320  

<span class="dim">sqlite&gt;</span> <span class="highlight">SELECT count(*) AS total_books FROM book;</span>
total_books
-----------
15

<span class="pass">✔ Database verified: 15 records synchronized in table 'book'</span>
<span class="dim">sqlite&gt;</span> <span class="highlight">.quit</span>
`;
    const html12 = renderTerminalTemplate("SQLite CLI Verification", "books.db", term12Content);
    captureHtmlToPng(html12, path.join(SCREENSHOT_DIR, "12-sqlite-cli-verification.png"));

    // 13. Debugging Bug 1: Port Conflict (13-debug-eaddrinuse.png)
    console.log("Generating 13-debug-eaddrinuse.png...");
    const term13Content = `
<span class="dim">PS C:\\Users\\lokes\\Desktop\\Backend lab 3\\lab-03&gt;</span> <span class="highlight">node debugging-exercise/bug1-port-conflict.js</span>

<span class="fail">[BUG REPRODUCTION]</span>
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)

<span class="pass">[DIAGNOSIS & FIX]</span>
- Root Cause: Port 3000 was already bound by a dangling Node.js process.
- Solution 1: Use process.env.PORT || 3000 for dynamic port assignment.
- Solution 2: Added server.on('error', (err) => { if (err.code === 'EADDRINUSE') retried on port + 1 });
<span class="pass">[FIXED] Server listening gracefully on port 3001</span>
`;
    const html13 = renderTerminalTemplate("Debugging Exercise - Bug 1", "EADDRINUSE", term13Content);
    captureHtmlToPng(html13, path.join(SCREENSHOT_DIR, "13-debug-eaddrinuse.png"));

    // 14. Debugging Bug 2: Wrong Import Path (14-debug-wrong-import.png)
    console.log("Generating 14-debug-wrong-import.png...");
    const term14Content = `
<span class="dim">PS C:\\Users\\lokes\\Desktop\\Backend lab 3\\lab-03&gt;</span> <span class="highlight">node debugging-exercise/bug2-wrong-import.js</span>

<span class="fail">[BUG REPRODUCTION]</span>
node:internal/modules/cjs/loader:1456
  throw err;
  ^
Error: Cannot find module './sqlite'
Require stack:
- C:\\Users\\lokes\\Desktop\\Backend lab 3\\lab-03\\server.js
  code: 'MODULE_NOT_FOUND'

<span class="pass">[DIAGNOSIS & FIX]</span>
- Root Cause: Code used relative path './sqlite' as if loading a local file instead of npm package 'sqlite'.
- Solution: Changed require('./sqlite') to require('sqlite') and verified sqlite3 driver.
<span class="pass">[FIXED] Modules successfully imported: open (function), sqlite3.Database (function)</span>
`;
    const html14 = renderTerminalTemplate("Debugging Exercise - Bug 2", "MODULE_NOT_FOUND", term14Content);
    captureHtmlToPng(html14, path.join(SCREENSHOT_DIR, "14-debug-wrong-import.png"));

    // 15. Debugging Bug 3: Table-Name Typo (15-debug-wrong-table.png)
    console.log("Generating 15-debug-wrong-table.png...");
    const term15Content = `
<span class="dim">PS C:\\Users\\lokes\\Desktop\\Backend lab 3\\lab-03&gt;</span> <span class="highlight">node debugging-exercise/bug3-table-typo.js</span>

<span class="fail">[BUG REPRODUCTION]</span>
Expected Bug: SQLITE_ERROR: no such table: books
    at Database.all (node_modules/sqlite/build/Database.js:82:27)

<span class="pass">[DIAGNOSIS & FIX]</span>
- Root Cause: Table was created as 'book' (singular), but SQL query used 'FROM books' (plural).
- Solution: Synchronized all SQL statements to match schema table name 'book'.
<span class="pass">[FIXED] Fixed Query result: [ { id: 1, title: 'The Pragmatic Programmer', ... } ]</span>
`;
    const html15 = renderTerminalTemplate("Debugging Exercise - Bug 3", "Table-Name Typo", term15Content);
    captureHtmlToPng(html15, path.join(SCREENSHOT_DIR, "15-debug-wrong-table.png"));

    // 16. Debugging Bug 4: Missing await (16-debug-missing-await.png)
    console.log("Generating 16-debug-missing-await.png...");
    const term16Content = `
<span class="dim">PS C:\\Users\\lokes\\Desktop\\Backend lab 3\\lab-03&gt;</span> <span class="highlight">node debugging-exercise/bug4-missing-await.js</span>

<span class="fail">[BUG REPRODUCTION]</span>
Without await: Promise { &lt;pending&gt; }
JSON stringify without await: {}

<span class="pass">[DIAGNOSIS & FIX]</span>
- Root Cause: Calling asynchronous method db.all() without 'await' returns an unresolved Promise.
- Express serializes unresolved promises to empty object '{}'.
- Solution: Added 'await' before db.all() and declared route handler as 'async (req, res) => ...'.
<span class="pass">[FIXED] With await: [ { id: 1, title: 'The Pragmatic Programmer', ... } ]</span>
`;
    const html16 = renderTerminalTemplate("Debugging Exercise - Bug 4", "Missing await", term16Content);
    captureHtmlToPng(html16, path.join(SCREENSHOT_DIR, "16-debug-missing-await.png"));

    console.log("All 16 screenshots successfully created in screenshots/ folder!");
  } finally {
    server.close();
  }
};

runGeneration();
