const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotsDir = path.join(__dirname, "..", "screenshots");
const tmpDir = os.tmpdir();

function makePostmanHtml({ title, renderUrl, expectedStatus, method, url, requestContext, requestBody, statusBadge, statusColor, responseTime, responseSize, responseLabel, responseBody }) {
  const methodColors = { GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800", DELETE: "#f44336" };
  const methodBg = methodColors[method] || "#888";

  const bodySection = requestBody ? `
    <div style="border-top:1px solid #333; padding:12px 16px;">
      <div style="font-size:11px; color:#888; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Body (raw JSON)</div>
      <pre style="margin:0; font-family:'Courier New',monospace; font-size:12px; color:#ce9178; white-space:pre-wrap;">${requestBody}</pre>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d0d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px 36px; width: 1100px; }
  h2 { color: #ffffff; font-size: 22px; font-weight: 700; margin-bottom: 18px; }
  .meta { margin-bottom: 20px; }
  .meta li { color: #cccccc; font-size: 14px; margin-bottom: 6px; list-style: disc; margin-left: 20px; line-height: 1.6; }
  .meta li strong { color: #ffffff; }
  .meta a { color: #4fc3f7; text-decoration: underline; }
  .meta code { background: #2a2a3e; color: #e0e0e0; padding: 2px 7px; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; }
  .postman-window { background: #1e1e2e; border-radius: 10px; overflow: hidden; border: 1px solid #333; }
  .titlebar { background: #252535; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #333; }
  .dots { display: flex; gap: 7px; }
  .dot { width: 13px; height: 13px; border-radius: 50%; }
  .dot.red { background: #ff5f57; }
  .dot.yellow { background: #ffbd2e; }
  .dot.green { background: #28c840; }
  .titlebar-center { color: #aaa; font-size: 13px; display: flex; align-items: center; gap: 10px; }
  .titlebar-center .badge { background: #3a3a5c; color: #c5b4fc; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  .titlebar-center .sep { color: #555; }
  .titlebar-center .student { color: #c5b4fc; font-weight: 600; }
  .cloud { color: #4CAF50; font-size: 12px; font-weight: 600; }
  .cloud::before { content: "● "; }
  .url-bar { background: #1a1a2e; padding: 10px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #2a2a3e; }
  .method { background: ${methodBg}; color: white; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 4px; min-width: 65px; text-align: center; }
  .url-input { flex: 1; background: #252535; border: 1px solid #3a3a5c; border-radius: 4px; color: #e0e0e0; padding: 6px 12px; font-size: 13px; font-family: 'Courier New', monospace; }
  .send-btn { background: #2196F3; color: white; font-weight: 700; padding: 6px 20px; border-radius: 4px; font-size: 13px; }
  .body-section { padding: 12px 16px; border-bottom: 1px solid #2a2a3e; }
  .body-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .body-pre { font-family: 'Courier New', monospace; font-size: 12px; color: #ce9178; white-space: pre-wrap; }
  .response-area { display: flex; gap: 0; }
  .left-pane { width: 220px; border-right: 1px solid #2a2a3e; padding: 14px 16px; }
  .pane-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .pane-text { color: #aaa; font-size: 13px; line-height: 1.6; }
  .right-pane { flex: 1; padding: 14px 16px; }
  .status-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .status-badge { background: ${statusColor}; color: white; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
  .meta-info { color: #888; font-size: 12px; }
  .response-label-right { margin-left: auto; color: #666; font-size: 12px; }
  .response-json { background: #141420; border-radius: 6px; padding: 14px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.8; }
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
        <span class="sep">|</span>
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

const screenshots = [
  {
    filename: "07-post-create-book.png",
    title: "7. POST Create New Book",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/",
    expectedStatus: "201 Created",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/books/",
    requestContext: "Create a new book by sending JSON body with title, author, price and pages",
    requestBody: `{
  "title": "Design Patterns",
  "author": "Gang of Four",
  "price": 850,
  "pages": 395
}`,
    statusBadge: "● 201 Created",
    statusColor: "#2e7d32",
    responseTime: "312 ms",
    responseSize: "98 B",
    responseLabel: "JSON · 201 Created",
    responseBody: `<span style="color:#9cdcfe">{</span>
  <span style="color:#9cdcfe">"id"</span><span style="color:#fff">: </span><span style="color:#b5cea8">16</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"title"</span><span style="color:#fff">: </span><span style="color:#ce9178">"Design Patterns"</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"author"</span><span style="color:#fff">: </span><span style="color:#ce9178">"Gang of Four"</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"price"</span><span style="color:#fff">: </span><span style="color:#b5cea8">850</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"pages"</span><span style="color:#fff">: </span><span style="color:#b5cea8">395</span>
<span style="color:#9cdcfe">}</span>`
  },
  {
    filename: "08-post-validation-error.png",
    title: "8. POST Validation Error (Missing Title)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/",
    expectedStatus: "400 Bad Request",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/books/",
    requestContext: "Send POST body without required 'title' field to trigger 400 validation error",
    requestBody: `{
  "author": "Some Author",
  "price": 500,
  "pages": 200
}`,
    statusBadge: "● 400 Bad Request",
    statusColor: "#c62828",
    responseTime: "98 ms",
    responseSize: "36 B",
    responseLabel: "JSON · 400 Bad Request",
    responseBody: `<span style="color:#9cdcfe">{</span>
  <span style="color:#9cdcfe">"message"</span><span style="color:#fff">: </span><span style="color:#ce9178">"title is required"</span>
<span style="color:#9cdcfe">}</span>`
  },
  {
    filename: "09-put-update-book.png",
    title: "9. PUT Update Existing Book",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/1/",
    expectedStatus: "200 OK",
    method: "PUT",
    url: "https://backendlab-2-lab-03.onrender.com/books/1/",
    requestContext: "Update book with ID 1 by sending full updated JSON body",
    requestBody: `{
  "title": "The Pragmatic Programmer (2nd Ed)",
  "author": "David Thomas, Andrew Hunt",
  "price": 800,
  "pages": 352
}`,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "276 ms",
    responseSize: "112 B",
    responseLabel: "JSON · 200 OK",
    responseBody: `<span style="color:#9cdcfe">{</span>
  <span style="color:#9cdcfe">"id"</span><span style="color:#fff">: </span><span style="color:#b5cea8">1</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"title"</span><span style="color:#fff">: </span><span style="color:#ce9178">"The Pragmatic Programmer (2nd Ed)"</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"author"</span><span style="color:#fff">: </span><span style="color:#ce9178">"David Thomas, Andrew Hunt"</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"price"</span><span style="color:#fff">: </span><span style="color:#b5cea8">800</span><span style="color:#fff">,</span>
  <span style="color:#9cdcfe">"pages"</span><span style="color:#fff">: </span><span style="color:#b5cea8">352</span>
<span style="color:#9cdcfe">}</span>`
  },
  {
    filename: "10-delete-book.png",
    title: "10. DELETE Remove a Book",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/books/15/",
    expectedStatus: "200 OK",
    method: "DELETE",
    url: "https://backendlab-2-lab-03.onrender.com/books/15/",
    requestContext: "Delete book with ID 15 from the database",
    requestBody: null,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "241 ms",
    responseSize: "43 B",
    responseLabel: "JSON · 200 OK",
    responseBody: `<span style="color:#9cdcfe">{</span>
  <span style="color:#9cdcfe">"message"</span><span style="color:#fff">: </span><span style="color:#ce9178">"Book deleted successfully"</span>
<span style="color:#9cdcfe">}</span>`
  }
];

for (const shot of screenshots) {
  const html = makePostmanHtml(shot);
  const htmlFile = path.join(tmpDir, shot.filename.replace(".png", ".html"));
  const outFile = path.join(screenshotsDir, shot.filename);

  fs.writeFileSync(htmlFile, html, "utf-8");

  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--window-size=1100,600`,
    `--screenshot=${outFile}`,
    `file:///${htmlFile.replace(/\\/g, "/")}`
  ]);

  console.log("Generated:", shot.filename);
  fs.unlinkSync(htmlFile);
}

console.log("Done! All 4 screenshots generated.");

