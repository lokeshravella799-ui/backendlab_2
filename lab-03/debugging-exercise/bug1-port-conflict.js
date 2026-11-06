/**
 * DEBUGGING EXERCISE - BUG 1: PORT CONFLICT (EADDRINUSE)
 *
 * Faculty Scenario:
 * Running two instances of the server, or restarting nodemon while the port is still
 * occupied by a previous dangling node process, throws the error:
 *   "Error: listen EADDRINUSE: address already in use :::3000"
 *
 * Code with BUG:
 * const PORT = 3000;
 * app.listen(PORT); // Crashes if 3000 is occupied!
 *
 * FIX:
 * 1. Allow configurable PORT via process.env.PORT || 3000
 * 2. Handle the 'error' event on the HTTP server object to detect 'EADDRINUSE'
 *    and fallback to port + 1 or inform the developer cleanly.
 * 3. Command to free port in Windows PowerShell:
 *    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
 */

const express = require("express");
const app = express();

const startServerWithConflictHandling = (initialPort = 3000) => {
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : initialPort;

  const server = app.listen(port, () => {
    console.log(`[FIXED] Server listening gracefully on port ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[WARN] Port ${port} is occupied (EADDRINUSE). Automatically attempting port ${port + 1}...`);
      startServerWithConflictHandling(port + 1);
    } else {
      console.error("[ERROR] Unexpected server error:", err);
    }
  });
};

module.exports = { startServerWithConflictHandling };

