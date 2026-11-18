const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "users.db");
let db = null;

const JWT_SECRET = "my_secret_key_lab4";

const initializeDBAndServer = async (port = process.env.PORT || 3000) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL
      );
    `);

    const count = await db.get("SELECT COUNT(*) AS count FROM user;");
    if (count.count === 0) {
      const sampleFile = path.join(__dirname, "sample-users.json");
      let usersToSeed = [];
      if (fs.existsSync(sampleFile)) {
        usersToSeed = JSON.parse(fs.readFileSync(sampleFile, "utf-8"));
      } else {
        usersToSeed = [
          { username: "ravella_lokesh", name: "Ravella Lokesh", password: "lokesh@password123" },
          { username: "john_doe", name: "John Doe", password: "password123" }
        ];
      }

      for (const u of usersToSeed) {
        const hashed = await bcrypt.hash(u.password, 10);
        await db.run(
          "INSERT INTO user (username, name, password) VALUES (?, ?, ?);",
          [u.username, u.name, hashed]
        );
      }
    }

    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        initializeDBAndServer(Number(port) + 1);
      }
    });

    return server;
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

if (require.main === module) {
  initializeDBAndServer();
}

app.get("/", (req, res) => {
  res.json({
    message: "Lab 4 JWT Authentication API is running",
    student: "Ravella Lokesh (252U1R1217)",
    section: "AIDE-2B",
  });
});

app.get(["/users", "/users/"], async (req, res) => {
  try {
    const users = await db.all("SELECT id, username, name FROM user;");
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post(["/register", "/register/"], async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "username is required" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "name is required" });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const existing = await db.get("SELECT id FROM user WHERE username = ?;", [username.trim()]);
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO user (username, name, password) VALUES (?, ?, ?);",
      [username.trim(), name.trim(), hashedPassword]
    );

    res.status(200).json({ message: "User created successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post(["/login", "/login/"], async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "username is required" });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "password is required" });
    }

    const user = await db.get("SELECT * FROM user WHERE username = ?;", [username.trim()]);
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const payload = { username: user.username };
    const jwt_token = jwt.sign(payload, JWT_SECRET);

    res.status(200).json({ jwt_token });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = { app, initializeDBAndServer };
