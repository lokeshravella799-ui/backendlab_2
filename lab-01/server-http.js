const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: "Welcome to Node.js HTTP Server",
      student: "Ravella Lokesh (252U1R1217)",
      section: "AIDE-2B",
    })
  );
});

server.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
});
