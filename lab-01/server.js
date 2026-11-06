const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Express Server",
    status: "success",
  });
});

app.get("/about", (req, res) => {
  res.status(200).json({
    name: "Ravella Lokesh",
    rollNumber: "252U1R1217",
    section: "AIDE-2B",
    course: "Backend Development Fundamentals",
    year: "Year II Term II",
  });
});

app.get("/time", (req, res) => {
  res.status(200).json({
    currentTime: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestedUrl: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});

module.exports = app;
