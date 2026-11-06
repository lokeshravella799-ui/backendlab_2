// Lab 1: Web Server using Express.js
// Student: Ravella Lokesh (252U1R1217) · Section: AIDE-2B

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// 1. Home route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Express Server",
    status: "success"
  });
});

// 2. About route
app.get("/about", (req, res) => {
  res.status(200).json({
    name: "Ravella Lokesh",
    rollNumber: "252U1R1217",
    section: "AIDE-2B",
    course: "Backend Development Fundamentals",
    year: "Year II Term II"
  });
});

// 3. Time route
app.get("/time", (req, res) => {
  res.status(200).json({
    currentTime: new Date().toISOString()
  });
});

// 4. Unknown route handler (404)
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestedUrl: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});

module.exports = app;

