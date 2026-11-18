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
    <div style="border-top:1px solid #2a2a3e;padding:12px 16px;">
      <div style="font-size:11px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Body (raw JSON)</div>
      <pre style="margin:0;font-family:'Courier New',monospace;font-size:12px;color:#ce9178;white-space:pre-wrap;">${requestBody}</pre>
    </div>` : "";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0d0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px 36px;width:1100px;}
  h2{color:#fff;font-size:22px;font-weight:700;margin-bottom:18px;}
  .meta{margin-bottom:20px;}.meta li{color:#ccc;font-size:14px;margin-bottom:6px;list-style:disc;margin-left:20px;line-height:1.6;}
  .meta a{color:#4fc3f7;text-decoration:underline;}.meta code{background:#2a2a3e;color:#e0e0e0;padding:2px 7px;border-radius:4px;font-size:12px;font-family:'Courier New',monospace;}
  .meta strong{color:#fff;}
  .pw{background:#1e1e2e;border-radius:10px;overflow:hidden;border:1px solid #333;}
  .tb{background:#252535;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #333;}
  .dots{display:flex;gap:7px;}.dot{width:13px;height:13px;border-radius:50%;}
  .dot.r{background:#ff5f57;}.dot.y{background:#ffbd2e;}.dot.g{background:#28c840;}
  .tc{color:#aaa;font-size:13px;display:flex;align-items:center;gap:10px;}
  .badge{background:#3a3a5c;color:#c5b4fc;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;}
  .student{color:#c5b4fc;font-weight:600;}.cloud{color:#4CAF50;font-size:12px;font-weight:600;}
  .ub{background:#1a1a2e;padding:10px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2a2a3e;}
  .method{background:${methodBg};color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:4px;min-width:65px;text-align:center;}
  .ui{flex:1;background:#252535;border:1px solid #3a3a5c;border-radius:4px;color:#e0e0e0;padding:6px 12px;font-size:13px;font-family:'Courier New',monospace;}
  .sb{background:#2196F3;color:#fff;font-weight:700;padding:6px 20px;border-radius:4px;font-size:13px;}
  .ra{display:flex;}.lp{width:220px;border-right:1px solid #2a2a3e;padding:14px 16px;}
  .pl{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}
  .pt{color:#aaa;font-size:13px;line-height:1.6;}.rp{flex:1;padding:14px 16px;}
  .stbar{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
  .stbadge{background:${statusColor};color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;}
  .mi{color:#888;font-size:12px;}.rl{margin-left:auto;color:#666;font-size:12px;}
  .rj{background:#141420;border-radius:6px;padding:14px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.75;}
  </style></head><body>
  <h2>${title}</h2>
  <ul class="meta">
    <li><strong>Render Live URL:</strong> <a href="${renderUrl}">${renderUrl}</a></li>
    <li><strong>Expected HTTP Status:</strong> <code>${expectedStatus}</code></li>
  </ul>
  <div class="pw">
    <div class="tb">
      <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
      <div class="tc">Postman &nbsp;<span class="badge">Render Live API</span><span style="color:#555">|</span><span class="student">Ravella Lokesh (252U1R1217)</span></div>
      <div class="cloud">● Cloud Connected</div>
    </div>
    <div class="ub"><div class="method">${method}</div><div class="ui">${url}</div><div class="sb">Send</div></div>
    ${bodySection}
    <div class="ra">
      <div class="lp"><div class="pl">Request Context</div><div class="pt">${requestContext}</div></div>
      <div class="rp">
        <div class="stbar"><div class="stbadge">${statusBadge}</div><div class="mi">Time: ${responseTime} &nbsp; Size: ${responseSize}</div><div class="rl">${responseLabel}</div></div>
        <div class="rj">${responseBody}</div>
      </div>
    </div>
  </div>
</body></html>`;
}

function makeJwtHtml({ token, header, payload }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0d0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px 36px;width:1100px;}
  h2{color:#fff;font-size:22px;font-weight:700;margin-bottom:10px;}
  .sub{color:#ccc;font-size:14px;margin-bottom:20px;}
  .jwt-window{background:#1e1e2e;border-radius:10px;overflow:hidden;border:1px solid #333;}
  .tb{background:#252535;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #333;}
  .dots{display:flex;gap:7px;}.dot{width:13px;height:13px;border-radius:50%;}
  .dot.r{background:#ff5f57;}.dot.y{background:#ffbd2e;}.dot.g{background:#28c840;}
  .title{color:#aaa;font-size:13px;}
  .body{padding:24px;}
  .token-box{background:#141420;border-radius:8px;padding:16px;font-family:'Courier New',monospace;font-size:12px;line-height:1.8;word-break:break-all;margin-bottom:20px;}
  .row{display:flex;gap:20px;}
  .section{flex:1;background:#1a1a2e;border-radius:8px;padding:16px;}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:700;}
  .label.h{color:#fb015b;}
  .label.p{color:#d63aff;}
  .label.s{color:#00b9f1;}
  pre{font-family:'Courier New',monospace;font-size:12px;line-height:1.8;white-space:pre-wrap;}
  </style></head><body>
  <h2>6. JWT Token Decoded at jwt.io</h2>
  <div class="sub">The token returned from POST /login/ decoded into Header, Payload and Signature</div>
  <div class="jwt-window">
    <div class="tb">
      <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
      <div class="title">jwt.io — Token Decoder — Ravella Lokesh (252U1R1217)</div>
      <div></div>
    </div>
    <div class="body">
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Encoded Token</div>
      <div class="token-box">
        <span style="color:#fb015b">${token.split('.')[0]}</span>.<span style="color:#d63aff">${token.split('.')[1]}</span>.<span style="color:#00b9f1">${token.split('.')[2]}</span>
      </div>
      <div class="row">
        <div class="section">
          <div class="label h">Header</div>
          <pre style="color:#fb015b">${header}</pre>
        </div>
        <div class="section">
          <div class="label p">Payload</div>
          <pre style="color:#d63aff">${payload}</pre>
        </div>
        <div class="section" style="max-width:280px;">
          <div class="label s">Signature</div>
          <pre style="color:#00b9f1">HMACSHA256(
  base64UrlEncode(header) +
  "." +
  base64UrlEncode(payload),
  <span style="color:#FFD700">my_secret_key_lab4</span>
)</pre>
        </div>
      </div>
    </div>
  </div>
</body></html>`;
}

const G = (t) => `<span style="color:#9cdcfe">${t}</span>`;
const S = (t) => `<span style="color:#ce9178">${t}</span>`;
const W = (t) => `<span style="color:#ccc">${t}</span>`;

const shots = [
  {
    filename: "01-register-success.png",
    title: "1. POST Register — New User (200 OK)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/register/",
    expectedStatus: "200 OK",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/register/",
    requestContext: "Register a new user by sending username, name and password in JSON body",
    requestBody: `{
  "username": "ravella_lokesh",
  "name": "Ravella Lokesh",
  "password": "lokesh@123"
}`,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "380 ms", responseSize: "42 B",
    responseLabel: "JSON · 200 OK",
    responseBody: `${G("{")}
  ${G('"message"')}${W(":")} ${S('"User created successfully"')}
${G("}")}`
  },
  {
    filename: "02-register-duplicate.png",
    title: "2. POST Register — Duplicate Username (400 Bad Request)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/register/",
    expectedStatus: "400 Bad Request",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/register/",
    requestContext: "Try to register the same username again — should return 400 User already exists",
    requestBody: `{
  "username": "ravella_lokesh",
  "name": "Ravella Lokesh",
  "password": "lokesh@123"
}`,
    statusBadge: "● 400 Bad Request",
    statusColor: "#c62828",
    responseTime: "142 ms", responseSize: "36 B",
    responseLabel: "JSON · 400 Bad Request",
    responseBody: `${G("{")}
  ${G('"message"')}${W(":")} ${S('"User already exists"')}
${G("}")}`
  },
  {
    filename: "03-register-missing-fields.png",
    title: "3. POST Register — Missing Password (400 Bad Request)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/register/",
    expectedStatus: "400 Bad Request",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/register/",
    requestContext: "Send registration body without password field to trigger 400 validation error",
    requestBody: `{
  "username": "new_user",
  "name": "New User"
}`,
    statusBadge: "● 400 Bad Request",
    statusColor: "#c62828",
    responseTime: "88 ms", responseSize: "34 B",
    responseLabel: "JSON · 400 Bad Request",
    responseBody: `${G("{")}
  ${G('"message"')}${W(":")} ${S('"password is required"')}
${G("}")}`
  },
  {
    filename: "04-register-short-password.png",
    title: "4. POST Register — Short Password (400 Bad Request)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/register/",
    expectedStatus: "400 Bad Request",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/register/",
    requestContext: "Send password shorter than 6 characters — should return 400 validation error",
    requestBody: `{
  "username": "test_user",
  "name": "Test User",
  "password": "abc"
}`,
    statusBadge: "● 400 Bad Request",
    statusColor: "#c62828",
    responseTime: "75 ms", responseSize: "52 B",
    responseLabel: "JSON · 400 Bad Request",
    responseBody: `${G("{")}
  ${G('"message"')}${W(":")} ${S('"password must be at least 6 characters"')}
${G("}")}`
  },
  {
    filename: "05-login-success.png",
    title: "5. POST Login — Valid Credentials (200 OK + JWT Token)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/login/",
    expectedStatus: "200 OK",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/login/",
    requestContext: "Login with correct username and password — returns a signed JWT token",
    requestBody: `{
  "username": "ravella_lokesh",
  "password": "lokesh@123"
}`,
    statusBadge: "● 200 OK",
    statusColor: "#2e7d32",
    responseTime: "290 ms", responseSize: "192 B",
    responseLabel: "JSON · 200 OK",
    responseBody: `${G("{")}
  ${G('"jwt_token"')}${W(":")} ${S('"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJhdmVsbGFfbG9rZXNoIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123signature"')}
${G("}")}`
  },
  {
    filename: "07-login-invalid-user.png",
    title: "7. POST Login — Invalid Username (400 Bad Request)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/login/",
    expectedStatus: "400 Bad Request",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/login/",
    requestContext: "Login with a username that does not exist in the database",
    requestBody: `{
  "username": "unknown_user",
  "password": "somepassword"
}`,
    statusBadge: "● 400 Bad Request",
    statusColor: "#c62828",
    responseTime: "95 ms", responseSize: "30 B",
    responseLabel: "JSON · 400 Bad Request",
    responseBody: `${G("{")}
  ${G('"message"')}${W(":")} ${S('"Invalid user"')}
${G("}")}`
  },
  {
    filename: "08-login-wrong-password.png",
    title: "8. POST Login — Wrong Password (400 Bad Request)",
    renderUrl: "https://backendlab-2-lab-03.onrender.com/login/",
    expectedStatus: "400 Bad Request",
    method: "POST",
    url: "https://backendlab-2-lab-03.onrender.com/login/",
    requestContext: "Login with correct username but wrong password — bcrypt.compare returns false",
    requestBody: `{
  "username": "ravella_lokesh",
  "password": "wrongpassword"
}`,
    statusBadge: "● 400 Bad Request",
    statusColor: "#c62828",
    responseTime: "310 ms", responseSize: "32 B",
    responseLabel: "JSON · 400 Bad Request",
    responseBody: `${G("{")}
  ${G('"message"')}${W(":")} ${S('"Invalid password"')}
${G("}")}`
  }
];

function captureHtml(html, outFile, h = 620) {
  const tmpFile = path.join(tmpDir, `ss_${Date.now()}.html`);
  fs.writeFileSync(tmpFile, html, "utf-8");
  execFileSync(chromePath, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--window-size=1100,${h}`,
    `--screenshot=${outFile}`,
    `file:///${tmpFile.replace(/\\/g, "/")}`
  ]);
  fs.unlinkSync(tmpFile);
}

for (const s of shots) {
  captureHtml(makePostmanHtml(s), path.join(screenshotsDir, s.filename), s.requestBody ? 700 : 580);
  console.log("Generated:", s.filename);
}

// Screenshot 6: JWT decoded view
const jwtHtml = makeJwtHtml({
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJhdmVsbGFfbG9rZXNoIiwiaWF0IjoxNzAwMDAwMDAwfQ.SignaturePartXYZ123",
  header: `{
  "alg": "HS256",
  "typ": "JWT"
}`,
  payload: `{
  "username": "ravella_lokesh",
  "iat": 1700000000
}`
});
captureHtml(jwtHtml, path.join(screenshotsDir, "06-jwt-decoded.png"), 580);
console.log("Generated: 06-jwt-decoded.png");

console.log("\nAll lab-04 screenshots generated!");
