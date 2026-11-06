const express = require("express");
const app = express();

const startServerWithConflictHandling = (initialPort = 3000) => {
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : initialPort;

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is in use. Trying port ${port + 1}...`);
      startServerWithConflictHandling(port + 1);
    } else {
      console.log("Server error:", err);
    }
  });
};

module.exports = { startServerWithConflictHandling };
