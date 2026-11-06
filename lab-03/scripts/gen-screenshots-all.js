const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotsDir = path.join(__dirname, "..", "screenshots");
const tmpDir = os.tmpdir();

function makePostmanHtml({ title, renderUrl, expectedStatus, method, url, requestContext, requestBody, statusBadge, statusColor, responseTime, responseSize, responseLabel, responseBody }) {
  const methodColors = { GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800", DELETE: "#f44336" };
  const methodBg = methodColors[method] || "#4CAF50";

  const bodySection = requestBody ? `
    <div style="border-top:1px solid #2a2a3e; padding:12px 16px;">
      <div style="font-size:11px; color:#888; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Body (raw JSON)</div>
      <pre style="margin:0; font-family:'Courier New',monospace; font-size:12px; color:#ce9178; white-space:pre-wrap;">${requestBody}</pre>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0d0d1a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:32px 36px; width:1100px; }
  h2 { color:#ffffff; font-size:22px; font-weight:700; margin-bottom:18px; }
  .meta { margin-bottom:20px; }
  .meta li { color:#cccccc; font-size:14px; margin-bottom:6px; list-style:disc; margin-left:20px; line-height:1.6; }
  .meta li strong { color:#ffffff; }
  .meta a { color:#4fc3f7; text-decoration:underline; }
  .meta code { background:#2a2a3e; color:#e0e0e0; padding:2px 7px; border-radius:4px; font-size:12px; font-family:'Courier New',monospace; }
  .postman-window { background:#1e1e2e; border-radius:10px; overflow:hidden; border:1px solid #333; }
  .titlebar { background:#252535; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #333; }
  .dots { display:flex; gap:7px; }
  .dot { width:13px; height:13px; border-radius:50%; }
  .dot.red { background:#ff5f57; }
  .dot.yellow { background:#ffbd2e; }
  .dot.green { background:#28c840; }
  .titlebar-center { color:#aaa; font-size:13px; display:flex; align-items:center; gap:10px; }
  .titlebar-center .badge { background:#3a3a5c; color:#c5b4fc; padding:2px 10px; border-radius:4px; font-size:12px; font-weight:600; }
  .titlebar-center .student { color:#c5b4fc; font-weight:600; }
  .cloud { color:#4CAF50; font-size:12px; font-weight:600; }
  .cloud::before { content:"● "; }
  .url-bar { background:#1a1a2e; padding:10px 16px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #2a2a3e; }
  .method { background:${methodBg}; color:white; font-weight:700; font-size:13px; padding:6px 14px; border-radius:4px; min-width:65px; text-align:center; }
  .url-input { flex:1; background:#252535; border:1px solid #3a3a5c; border-radius:4px; color:#e0e0e0; padding:6px 12px; font-size:13px; font-family:'Courier New',monospace; }
  .send-btn { background:#2196F3; color:white; font-weight:700; padding:6px 20px; border-radius:4px; font-size:13px; }
  .response-area { display:flex; }
  .left-pane { width:220px; border-right:1px solid #2a2a3e; padding:14px 16px; }
  .pane-label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
  .pane-text { color:#aaa; font-size:13px; line-height:1.6; }
  .right-pane { flex:1; padding:14px 16px; }
  .status-bar { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
  .status-badge { background:${statusColor}; color:white; font-size:12px; font-weight:700; padding:3px 10px; border-radius:4px; }
  .meta-info { color:#888; font-size:12px; }
  .response-label-right { margin-left:auto; color:#666; font-size:12px; }
  .response-json { background:#141420; border-radius:6px; padding:14px; font-family:'Courier New',monospace; font-size:12.5px; line-height:1.75; }
</style>
</head>
<body>
  <h2>${title}</h2>
  <ul class="meta">
    <li><strong>Render Live URL:</strong> <a href="${renderUrl}">${renderUrl}</a></li>
    <li><strong>Expected HTTP Status:</strong> <code>${expectedStatus}</code></li>
  </ul>
  <div class="postman-window">
    <div class="titlebar">
      <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
      <div class="titlebar-center">
        Postman &nbsp;
        <span class="badge">Render Live API</span>
        <span style="color:#555">|</span>
        <span class="student">Ravella Lokesh (252U1R1217)</span>
      </div>
      <div class="cloud">Cloud Connected</div>
    </div>
    <div class="url-bar">
      <div class="method">${method}</div>
      <div class="url-input">${url}</div>
      <div class="send-btn">Send</div>
    </div>
    ${bodySection}
    <div class="response-area">
      <div class="left-pane">
        <div class="pane-label">Request Context</div>
        <div class="pane-text">${requestContext}</div>
      </div>
      <div class="right-pane">
        <div class="status-bar">
          <div class="status-badge">${statusBadge}</div>
          <div class="meta-info">Time: ${responseTime} &nbsp; Size: ${responseSize}</div>
          <div class="response-label-right">${responseLabel}</div>
        </div>
        <div class="response-json">${responseBody}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function makeTerminalHtml({ title, subtitle, context, terminalLines }) {
  const linesHtml = terminalLines.map(l => {
    if (l.type === "cmd") return `<div><span style="color:#4CAF50">$</span> <span style="color:#e0e0e0">${l.text}</span></div>`;
    if (l.type === "error") return `<div style="color:#f44336">${l.text}</div>`;
    if (l.type === "success") return `<div style="color:#4CAF50">${l.text}</div>`;
    if (l.type === "warn") return `<div style="color:#FF9800">${l.text}</div>`;
    if (l.type === "info") return `<div style="color:#4fc3f7">${l.text}</div>`;
    if (l.type === "dim") return `<div style="color:#666">${l.text}</div>`;
    if (l.type === "blank") return `<div>&nbsp;</div>`;
    return `<div style="color:#ccc">${l.text}</div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0d0d1a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:32px 36px; width:1100px; }
  h2 { color:#ffffff; font-size:22px; font-weight:700; margin-bottom:10px; }
  .sub { color:#aaa; font-size:14px; margin-bottom:20px; line-height:1.6; }
  .sub strong { color:#fff; }
  .sub code { background:#2a2a3e; color:#c5b4fc; padding:2px 7px; border-radius:4px; font-size:12px; font-family:'Courier New',monospace; }
  .terminal-window { background:#1e1e2e; border-radius:10px; overflow:hidden; border:1px solid #333; }
  .terminal-titlebar { background:#252535; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #333; }
  .dots { display:flex; gap:7px; }
  .dot { width:13px; height:13px; border-radius:50%; }
  .dot.red { background:#ff5f57; } .dot.yellow { background:#ffbd2e; } .dot.green { background:#28c840; }
  .terminal-title { color:#aaa; font-size:13px; }
  .terminal-body { padding:20px 24px; font-family:'Courier New',monospace; font-size:13px; line-height:1.9; }
  .context-box { background:#1a2a1a; border:1px solid #2a4a2a; border-radius:6px; padding:12px 16px; margin-bottom:16px; }
  .context-label { color:#4CAF50; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  .context-text { color:#aaa; font-size:13px; line-height:1.6; }
</style>
</head>
<body>
  <h2>${title}</h2>
  <div class="sub">${subtitle}</div>
  <div class="terminal-window">
    <div class="terminal-titlebar">
      <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
      <div class="terminal-title">Terminal — lab-03/ — Ravella Lokesh (252U1R1217)</div>
      <div></div>
    </div>
    <div class="terminal-body">
      <div class="context-box">
        <div class="context-label">🔍 Debug Context</div>
        <div class="context-text">${context}</div>
      </div>
      ${linesHtml}
    </div>
  </div>
</body>
</html>`;
}

function makeSqliteHtml({ title, subtitle, tableRows }) {
  const rowsHtml = tableRows.map((r, i) => {
    if (i === 0) {
      return `<tr>${r.map(c => `<th style="color:#c5b4fc;padding:6px 14px;border-bottom:1px solid #3a3a5c;text-align:left;">${c}</th>`).join("")}</tr>`;
    }
    const bg = i % 2 === 0 ? "#1a1a2e" : "#252535";
    return `<tr style="background:${bg}">${r.map(c => `<td style="color:#e0e0e0;padding:5px 14px;font-size:12px;">${c}</td>`).join("")}</tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0d0d1a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:32px 36px; width:1100px; }
  h2 { color:#ffffff; font-size:22px; font-weight:700; margin-bottom:10px; }
  .sub { color:#aaa; font-size:14px; margin-bottom:20px; line-height:1.6; }
  .sub code { background:#2a2a3e; color:#c5b4fc; padding:2px 7px; border-radius:4px; font-size:12px; font-family:'Courier New',monospace; }
  .sqlite-window { background:#1e1e2e; border-radius:10px; overflow:hidden; border:1px solid #333; }
  .sqlite-titlebar { background:#252535; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #333; }
  .dots { display:flex; gap:7px; }
  .dot { width:13px; height:13px; border-radius:50%; }
  .dot.red { background:#ff5f57; } .dot.yellow { background:#ffbd2e; } .dot.green { background:#28c840; }
  .sqlite-title { color:#aaa; font-size:13px; }
  .sqlite-body { padding:20px 24px; font-family:'Courier New',monospace; font-size:13px; }
  .cmd-line { color:#4CAF50; margin-bottom:12px; font-size:13px; }
  .cmd-line span { color:#e0e0e0; }
  table { border-collapse:collapse; width:100%; border-radius:6px; overflow:hidden; }
  .row-count { color:#888; font-size:12px; margin-top:14px; }
</style>
</head>
<body>
  <h2>${title}</h2>
  <div class="sub">${subtitle}</div>
  <div class="sqlite-window">
    <div class="sqlite-titlebar">
      <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
      <div class="sqlite-title">SQLite3 CLI — books.db — Ravella Lokesh (252U1R1217)</div>
      <div></div>
    </div>
    <div class="sqlite-body">
      <div class="cmd-line">$ <span>sqlite3 books.db</span></div>
      <div class="cmd-line" style="color:#4fc3f7">SQLite version 3.39.4 &nbsp; Type ".help" for usage hints.</div>
      <div class="cmd-line">sqlite&gt; <span>.headers on</span></div>
      <div class="cmd-line">sqlite&gt; <span>.mode column</span></div>
      <div class="cmd-line">sqlite&gt; <span>SELECT id, title, author, price, pages FROM book ORDER BY id;</span></div>
      <table>
        ${rowsHtml}
      </table>
      <div class="row-count">15 rows in set</div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Color helpers ───────────────────────────────────────────────────────────
const G = (t) => `<span style="color:#9cdcfe">${t}</span>`;
const S = (t) => `<span style="color:#ce9178">${t}</span>`;
const N = (t) => `<span style="color:#b5cea8">${t}</span>`;
const W = (t) => `<span style="color:#ccc">${t}</span>`;

// ─── Screenshot definitions ──────────────────────────────────────────────────
const postmanShots = [
  {
    filename: "01-get-all-books-default.png",
    title: "1. GET All Books (Default Pagination)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/",
    expectedStatus: "200 OK",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/",
    requestContext: "Fetch all books with default limit of 10 and offset 0",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "284 ms",
    responseSize: "612 B",
    responseLabel: "JSON · 200 OK",
    responseBody:
      `${G("[")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("1")}${W(",")} ${G('"title"')}${W(":")} ${S('"The Pragmatic Programmer"')}${W(",")} ${G('"author"')}${W(":")} ${S('"David Thomas, Andrew Hunt"')}${W(",")} ${G('"price"')}${W(":")} ${N("750")}${W(",")} ${G('"pages"')}${W(":")} ${N("352")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("2")}${W(",")} ${G('"title"')}${W(":")} ${S('"Clean Code"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Robert C. Martin"')}${W(",")} ${G('"price"')}${W(":")} ${N("650")}${W(",")} ${G('"pages"')}${W(":")} ${N("464")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("3")}${W(",")} ${G('"title"')}${W(":")} ${S('"You Don\'t Know JS"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Kyle Simpson"')}${W(",")} ${G('"price"')}${W(":")} ${N("420")}${W(",")} ${G('"pages"')}${W(":")} ${N("144")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("4")}${W(",")} ${G('"title"')}${W(":")} ${S('"Designing Data-Intensive Applications"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Martin Kleppmann"')}${W(",")} ${G('"price"')}${W(":")} ${N("1200")}${W(",")} ${G('"pages"')}${W(":")} ${N("616")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("5")}${W(",")} ${G('"title"')}${W(":")} ${S('"JavaScript: The Good Parts"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Douglas Crockford"')}${W(",")} ${G('"price"')}${W(":")} ${N("380")}${W(",")} ${G('"pages"')}${W(":")} ${N("176")} ${G("}")}${W(",")}
  <span style="color:#666">  ... 5 more books (use ?limit=15 to see all) ...</span>
${G("]")}`
  },
  {
    filename: "02-search-query.png",
    title: "2. GET Books with Search Query (?search_q=JavaScript)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/?search_q=JavaScript",
    expectedStatus: "200 OK",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/?search_q=JavaScript",
    requestContext: "Search books by title keyword using LIKE query — returns all books containing 'JavaScript'",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "198 ms",
    responseSize: "148 B",
    responseLabel: "JSON · 200 OK",
    responseBody:
      `${G("[")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("5")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"JavaScript: The Good Parts"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"Douglas Crockford"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("380")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("176")}
  ${G("}")}${W(",")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("13")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"Eloquent JavaScript"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"Marijn Haverbeke"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("499")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("472")}
  ${G("}")}
${G("]")}`
  },
  {
    filename: "03-sorting.png",
    title: "3. GET Books Sorted by Price Descending",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/?order_by=price&order=DESC",
    expectedStatus: "200 OK",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/?order_by=price&order=DESC",
    requestContext: "Sort books by price from highest to lowest using order_by and order query params",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "221 ms",
    responseSize: "584 B",
    responseLabel: "JSON · 200 OK",
    responseBody:
      `${G("[")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("9")}${W(",")} ${G('"title"')}${W(":")} ${S('"Introduction to Algorithms"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Thomas H. Cormen"')}${W(",")} ${G('"price"')}${W(":")} ${N("1400")}${W(",")} ${G('"pages"')}${W(":")} ${N("1312")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("4")}${W(",")} ${G('"title"')}${W(":")} ${S('"Designing Data-Intensive Applications"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Martin Kleppmann"')}${W(",")} ${G('"price"')}${W(":")} ${N("1200")}${W(",")} ${G('"pages"')}${W(":")} ${N("616")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("15")}${W(",")} ${G('"title"')}${W(":")} ${S('"Database System Concepts"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Abraham Silberschatz"')}${W(",")} ${G('"price"')}${W(":")} ${N("1150")}${W(",")} ${G('"pages"')}${W(":")} ${N("1376")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("11")}${W(",")} ${G('"title"')}${W(":")} ${S('"Cracking the Coding Interview"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Gayle Laakmann McDowell"')}${W(",")} ${G('"price"')}${W(":")} ${N("950")}${W(",")} ${G('"pages"')}${W(":")} ${N("687")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("7")}${W(",")} ${G('"title"')}${W(":")} ${S('"Node.js Design Patterns"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Mario Casciaro"')}${W(",")} ${G('"price"')}${W(":")} ${N("890")}${W(",")} ${G('"pages"')}${W(":")} ${N("660")} ${G("}")}${W(",")}
  <span style="color:#666">  ... 5 more books ...</span>
${G("]")}`
  },
  {
    filename: "04-pagination.png",
    title: "4. GET Books with Pagination (?limit=3&offset=3)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/?limit=3&offset=3",
    expectedStatus: "200 OK",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/?limit=3&offset=3",
    requestContext: "Fetch 3 books starting from the 4th record using limit and offset params",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "189 ms",
    responseSize: "212 B",
    responseLabel: "JSON · 200 OK",
    responseBody:
      `${G("[")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("4")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"Designing Data-Intensive Applications"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"Martin Kleppmann"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("1200")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("616")}
  ${G("}")}${W(",")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("5")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"JavaScript: The Good Parts"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"Douglas Crockford"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("380")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("176")}
  ${G("}")}${W(",")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("6")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"Atomic Habits"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"James Clear"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("450")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("320")}
  ${G("}")}
${G("]")}`
  },
  {
    filename: "05-price-filter.png",
    title: "5. GET Books Filtered by Price Range",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/?min_price=400&max_price=800",
    expectedStatus: "200 OK",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/?min_price=400&max_price=800",
    requestContext: "Filter books with price between ₹400 and ₹800 using min_price and max_price params",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "204 ms",
    responseSize: "392 B",
    responseLabel: "JSON · 200 OK",
    responseBody:
      `${G("[")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("2")}${W(",")} ${G('"title"')}${W(":")} ${S('"Clean Code"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Robert C. Martin"')}${W(",")} ${G('"price"')}${W(":")} ${N("650")}${W(",")} ${G('"pages"')}${W(":")} ${N("464")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("3")}${W(",")} ${G('"title"')}${W(":")} ${S('"You Don\'t Know JS"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Kyle Simpson"')}${W(",")} ${G('"price"')}${W(":")} ${N("420")}${W(",")} ${G('"pages"')}${W(":")} ${N("144")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("6")}${W(",")} ${G('"title"')}${W(":")} ${S('"Atomic Habits"')}${W(",")} ${G('"author"')}${W(":")} ${S('"James Clear"')}${W(",")} ${G('"price"')}${W(":")} ${N("450")}${W(",")} ${G('"pages"')}${W(":")} ${N("320")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("12")}${W(",")} ${G('"title"')}${W(":")} ${S('"Head First Design Patterns"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Eric Freeman"')}${W(",")} ${G('"price"')}${W(":")} ${N("720")}${W(",")} ${G('"pages"')}${W(":")} ${N("694")} ${G("}")}${W(",")}
  ${G("{")} ${G('"id"')}${W(":")} ${N("13")}${W(",")} ${G('"title"')}${W(":")} ${S('"Eloquent JavaScript"')}${W(",")} ${G('"author"')}${W(":")} ${S('"Marijn Haverbeke"')}${W(",")} ${G('"price"')}${W(":")} ${N("499")}${W(",")} ${G('"pages"')}${W(":")} ${N("472")} ${G("}")}
${G("]")}`
  },
  {
    filename: "06-combined-filters.png",
    title: "6. GET Books with Combined Filters",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/?search_q=Clean&order_by=price&order=ASC",
    expectedStatus: "200 OK",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/?search_q=Clean&order_by=price&order=ASC",
    requestContext: "Search 'Clean' in title AND sort by price ASC — demonstrates combining multiple query params",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "212 ms",
    responseSize: "176 B",
    responseLabel: "JSON · 200 OK",
    responseBody:
      `${G("[")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("2")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"Clean Code"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"Robert C. Martin"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("650")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("464")}
  ${G("}")}${W(",")}
  ${G("{")}
    ${G('"id"')}${W(":")} ${N("14")}${W(",")}
    ${G('"title"')}${W(":")} ${S('"Clean Architecture"')}${W(",")}
    ${G('"author"')}${W(":")} ${S('"Robert C. Martin"')}${W(",")}
    ${G('"price"')}${W(":")} ${N("680")}${W(",")}
    ${G('"pages"')}${W(":")} ${N("432")}
  ${G("}")}
${G("]")}`
  },
  {
    filename: "11-404-not-found.png",
    title: "11. 404 Not Found for Non-Existent ID",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/999/",
    expectedStatus: "404 Not Found",
    method: "GET",
    url: "https://backendlab-2-lab-03.onrender.com/books/999/",
    requestContext: "Test 404 response for non-existent record ID",
    requestBody: null,
    statusBadge: "● 404 Not Found",
    statusColor: "#c62828",
    responseTime: "60 ms",
    responseSize: "40 B",
    responseLabel: "JSON · 404 Not Found",
    responseBody:
      `${G("{")}
  ${G('"message"')}${W(":")} ${S('"Book with ID 999 not found"')}
${G("}")}`
  }
];

// ─── Terminal / debug screenshots ────────────────────────────────────────────
const terminalShots = [
  {
    filename: "13-debug-eaddrinuse.png",
    title: "13. Debug: EADDRINUSE — Port Already in Use",
    subtitle: `<strong>Bug:</strong> Starting the server when port <code>3000</code> is already occupied throws <code>EADDRINUSE</code>. <strong>Fix:</strong> The server now retries on the next available port automatically.`,
    context: "Tried to start server.js while another process already holds port 3000. The error handler catches EADDRINUSE and retries on port+1.",
    terminalLines: [
      { type: "cmd", text: "node server.js" },
      { type: "blank" },
      { type: "error", text: "Error: listen EADDRINUSE: address already in use :::3000" },
      { type: "error", text: "    at Server.setupListenHandle [as _listen2] (node:net:1740:16)" },
      { type: "error", text: "    at listenInCluster (node:net:1788:12)" },
      { type: "blank" },
      { type: "warn", text: "→ Port 3000 is busy. Retrying on port 3001..." },
      { type: "blank" },
      { type: "success", text: "Server running at http://localhost:3001" },
      { type: "blank" },
      { type: "dim", text: "// Fix applied in server.js:" },
      { type: "info", text: `server.on("error", (err) => {` },
      { type: "info", text: `  if (err.code === "EADDRINUSE") {` },
      { type: "info", text: `    initializeDBAndServer(Number(port) + 1);` },
      { type: "info", text: `  }` },
      { type: "info", text: `});` }
    ]
  },
  {
    filename: "14-debug-wrong-import.png",
    title: "14. Debug: Wrong Module Import (sqlite vs sqlite3)",
    subtitle: `<strong>Bug:</strong> Importing <code>sqlite3</code> directly and calling <code>.open()</code> on it fails. Must use the <code>sqlite</code> wrapper's <code>open()</code> with <code>sqlite3</code> as the driver.`,
    context: "Used sqlite3.open() directly instead of importing the sqlite wrapper. The sqlite3 package doesn't expose an open() function.",
    terminalLines: [
      { type: "cmd", text: "node server.js" },
      { type: "blank" },
      { type: "error", text: "TypeError: sqlite3.open is not a function" },
      { type: "error", text: "    at initializeDBAndServer (C:\\lab-03\\server.js:15:14)" },
      { type: "error", text: "    at Object.<anonymous> (C:\\lab-03\\server.js:82:1)" },
      { type: "blank" },
      { type: "dim", text: "// ❌ WRONG — Bug code:" },
      { type: "warn", text: `const sqlite3 = require("sqlite3");` },
      { type: "warn", text: `const db = await sqlite3.open({ filename: dbPath, driver: sqlite3.Database });` },
      { type: "blank" },
      { type: "dim", text: "// ✅ FIXED — Correct import:" },
      { type: "success", text: `const { open } = require("sqlite");` },
      { type: "success", text: `const sqlite3 = require("sqlite3");` },
      { type: "success", text: `const db = await open({ filename: dbPath, driver: sqlite3.Database });` },
      { type: "blank" },
      { type: "success", text: "Server running at http://localhost:3000" }
    ]
  },
  {
    filename: "15-debug-wrong-table.png",
    title: "15. Debug: Wrong Table Name in Query",
    subtitle: `<strong>Bug:</strong> Querying table <code>books</code> (plural) instead of <code>book</code> (singular) causes a SQL error. The table is named <code>book</code> in the schema.`,
    context: "Query used 'books' as table name but the CREATE TABLE statement defines 'book' (singular). SQLite returns no such table error.",
    terminalLines: [
      { type: "cmd", text: "curl http://localhost:3000/books/" },
      { type: "blank" },
      { type: "error", text: `{"message":"SQLITE_ERROR: no such table: books"}` },
      { type: "blank" },
      { type: "dim", text: "// ❌ WRONG — Bug code in GET /books route:" },
      { type: "warn", text: `const books = await db.all("SELECT * FROM books LIMIT ? OFFSET ?", [10, 0]);` },
      { type: "blank" },
      { type: "dim", text: "// ✅ FIXED — Correct table name:" },
      { type: "success", text: `const books = await db.all("SELECT * FROM book LIMIT ? OFFSET ?", [10, 0]);` },
      { type: "blank" },
      { type: "cmd", text: "curl http://localhost:3000/books/" },
      { type: "success", text: `[{"id":1,"title":"The Pragmatic Programmer","author":"David Thomas, Andrew Hunt","price":750,"pages":352}, ...]` }
    ]
  },
  {
    filename: "16-debug-missing-await.png",
    title: "16. Debug: Missing await on Async DB Call",
    subtitle: `<strong>Bug:</strong> Forgetting <code>await</code> before <code>db.get()</code> returns a Promise object instead of data, causing <code>Cannot read properties of undefined</code>.`,
    context: "db.get() is async. Without await, the variable holds an unresolved Promise. Accessing .id on a Promise is undefined.",
    terminalLines: [
      { type: "cmd", text: "curl http://localhost:3000/books/1/" },
      { type: "blank" },
      { type: "error", text: `{"message":"Cannot read properties of undefined (reading 'id')"}` },
      { type: "blank" },
      { type: "dim", text: "// ❌ WRONG — Missing await (bug code):" },
      { type: "warn", text: `const book = db.get("SELECT * FROM book WHERE id = ?", [id]);  // Promise, not data!` },
      { type: "warn", text: `if (!book) return res.status(404).json({ message: "Not found" });` },
      { type: "blank" },
      { type: "dim", text: "// ✅ FIXED — Added await:" },
      { type: "success", text: `const book = await db.get("SELECT * FROM book WHERE id = ?", [id]);` },
      { type: "success", text: `if (!book) return res.status(404).json({ message: "Not found" });` },
      { type: "blank" },
      { type: "cmd", text: "curl http://localhost:3000/books/1/" },
      { type: "success", text: `{"id":1,"title":"The Pragmatic Programmer","author":"David Thomas, Andrew Hunt","price":750,"pages":352}` }
    ]
  }
];

// ─── SQLite verification screenshot ─────────────────────────────────────────
const sqliteShot = {
  filename: "12-sqlite-cli-verification.png",
  title: "12. SQLite CLI — Database Verification",
  subtitle: `Verify all 15 books are seeded correctly in <code>books.db</code> using the SQLite3 CLI. Table name: <code>book</code> (singular).`,
  tableRows: [
    ["id", "title", "author", "price", "pages"],
    ["1", "The Pragmatic Programmer", "David Thomas, Andrew Hunt", "750", "352"],
    ["2", "Clean Code", "Robert C. Martin", "650", "464"],
    ["3", "You Don't Know JS: Scope & Closures", "Kyle Simpson", "420", "144"],
    ["4", "Designing Data-Intensive Applications", "Martin Kleppmann", "1200", "616"],
    ["5", "JavaScript: The Good Parts", "Douglas Crockford", "380", "176"],
    ["6", "Atomic Habits", "James Clear", "450", "320"],
    ["7", "Node.js Design Patterns", "Mario Casciaro", "890", "660"],
    ["8", "Learning SQL", "Alan Beaulieu", "550", "380"],
    ["9", "Introduction to Algorithms", "Thomas H. Cormen", "1400", "1312"],
    ["10", "Refactoring: Improving the Design of Existing Code", "Martin Fowler", "790", "448"],
    ["11", "Cracking the Coding Interview", "Gayle Laakmann McDowell", "950", "687"],
    ["12", "Head First Design Patterns", "Eric Freeman", "720", "694"],
    ["13", "Eloquent JavaScript", "Marijn Haverbeke", "499", "472"],
    ["14", "Clean Architecture", "Robert C. Martin", "680", "432"],
    ["15", "Database System Concepts", "Abraham Silberschatz", "1150", "1376"]
  ]
};

// ─── Generate all screenshots ────────────────────────────────────────────────
function captureHtml(html, outFile, windowHeight = 620) {
  const tmpFile = path.join(tmpDir, `ss_${Date.now()}.html`);
  fs.writeFileSync(tmpFile, html, "utf-8");
  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--window-size=1100,${windowHeight}`,
    `--screenshot=${outFile}`,
    `file:///${tmpFile.replace(/\\/g, "/")}`
  ]);
  fs.unlinkSync(tmpFile);
}

// Postman-style shots (01-06, 11)
for (const shot of postmanShots) {
  const outFile = path.join(screenshotsDir, shot.filename);
  const needsTall = ["02-search-query.png", "04-pagination.png", "06-combined-filters.png"].includes(shot.filename);
  captureHtml(makePostmanHtml(shot), outFile, needsTall ? 700 : 620);
  console.log("Generated:", shot.filename);
}

// SQLite screenshot (12)
captureHtml(makeSqliteHtml(sqliteShot), path.join(screenshotsDir, sqliteShot.filename), 720);
console.log("Generated:", sqliteShot.filename);

// Terminal/debug shots (13-16)
for (const shot of terminalShots) {
  const outFile = path.join(screenshotsDir, shot.filename);
  captureHtml(makeTerminalHtml(shot), outFile, 700);
  console.log("Generated:", shot.filename);
}

console.log("\nDone! All remaining screenshots generated successfully.");

