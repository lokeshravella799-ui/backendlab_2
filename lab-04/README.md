# Lab 4: Registration, Login and JWT

> **🔗 Live Deployment URL:** [https://backendlab-2-lab-04.onrender.com](https://backendlab-2-lab-04.onrender.com)

---

## 📋 Student Information

| Field | Details |
|-------|---------|
| **Name** | Ravella Lokesh |
| **Registration Number** | 252U1R1217 |
| **Section** | AIDE-2B |
| **Course** | Backend Development Fundamentals · Year II Term II |
| **Faculty** | Mr Joel Prashanth D |
| **College** | Aurora Deemed-to-be-University |

---

## 🎯 Objective

Add user registration and login with hashed passwords and JWT tokens. Users can register with a unique username and name; passwords are stored only as bcrypt hashes. On successful login, a JSON Web Token (JWT) is returned. The token contains only the username in the payload (never the password). Wrong credentials and duplicate usernames are rejected with `400 Bad Request`.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment for backend execution |
| **Express.js** | Web framework for routing and building RESTful APIs |
| **SQLite** | Lightweight, self-contained, file-based relational database |
| **sqlite / sqlite3** | Asynchronous promise-based Node.js SQLite client and driver |
| **bcrypt** | Library to hash passwords before storing them in the database |
| **jsonwebtoken** | Library to sign and verify JSON Web Tokens (JWT) |
| **nodemon** | Development tool for automated server restarts on file modifications |
| **Postman** | API request testing and screenshot capture |
| **Git & GitHub** | Distributed version control and remote code repository |
| **Render** | Cloud hosting platform for live application deployment |

---

## 🗄️ Database Structure

**Database File:** `users.db`

**Table:** `user`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Unique identifier for each user |
| `username` | TEXT NOT NULL UNIQUE | Unique username (login credential) |
| `name` | TEXT NOT NULL | Full name of the user |
| `password` | TEXT NOT NULL | bcrypt hash of the password (never plain text) |

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** (v18.x or v20.x LTS)
- **npm** (comes bundled with Node.js)

### Steps

1. **Navigate to the lab-04 directory:**
   ```bash
   cd lab-04
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file from `.env.example`:
   ```env
   PORT=3000
   JWT_SECRET=my_secret_key_lab4
   ```

4. **Start the server (Production):**
   ```bash
   npm start
   ```

5. **Start with auto-reload (Development):**
   ```bash
   npm run dev
   ```

6. **Local Server URL:** [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

| Method | Path | Live URL | Description | Status Code |
|:---|:---|:---|:---|:---|
| `GET` | `/` | [Open Live Link](https://backendlab-2-lab-04.onrender.com/) | API info, student details | `200 OK` |
| `POST` | `/register/` | [API Endpoint](https://backendlab-2-lab-04.onrender.com/register/) | Register a new user (hashes password, stores in DB) | `200 OK` / `400 Bad Request` |
| `POST` | `/login/` | [API Endpoint](https://backendlab-2-lab-04.onrender.com/login/) | Login and receive a JWT token | `200 OK` / `400 Bad Request` |

---

## 📝 Sample Request Bodies

### POST /register/ (Register a new user)
```json
{
  "username": "ravella_lokesh",
  "name": "Ravella Lokesh",
  "password": "lokesh@123"
}
```

### POST /login/ (Login and get token)
```json
{
  "username": "ravella_lokesh",
  "password": "lokesh@123"
}
```

---

## 📤 Expected Responses

### POST /register/ — Success (200 OK)
```json
{
  "message": "User created successfully"
}
```

### POST /register/ — Duplicate Username (400 Bad Request)
```json
{
  "message": "User already exists"
}
```

### POST /register/ — Missing Field (400 Bad Request)
```json
{
  "message": "password is required"
}
```

### POST /register/ — Short Password (400 Bad Request)
```json
{
  "message": "password must be at least 6 characters"
}
```

### POST /login/ — Success (200 OK)
```json
{
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJhdmVsbGFfbG9rZXNoIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123signature"
}
```

### POST /login/ — Invalid User (400 Bad Request)
```json
{
  "message": "Invalid user"
}
```

### POST /login/ — Wrong Password (400 Bad Request)
```json
{
  "message": "Invalid password"
}
```

---

## 🔐 JWT Token Structure

The token is created using `jwt.sign` with only the `username` in the payload. The secret key is kept as a constant (moved to `.env` in Lab 8).

```javascript
const payload = { username: user.username };
const jwt_token = jwt.sign(payload, JWT_SECRET);
```

**Decoded token parts at [jwt.io](https://jwt.io):**

| Part | Content |
|------|---------|
| **Header** | `{ "alg": "HS256", "typ": "JWT" }` |
| **Payload** | `{ "username": "ravella_lokesh", "iat": 1700000000 }` |
| **Signature** | HMACSHA256 of header + payload using the secret key |

> **⚠️ Important:** Never put the password or sensitive data in the JWT payload. Payloads are base64-encoded — not encrypted — and can be decoded by anyone.

---

## 🔒 Password Hashing

Passwords are **never stored or logged in plain text**. The `bcrypt.hash` function converts the password to a secure hash before saving:

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

On login, `bcrypt.compare` safely compares the plain-text input against the stored hash:

```javascript
const passwordMatch = await bcrypt.compare(password, user.password);
```

The `10` is the salt rounds — higher means more secure but slower. `10` is the recommended default.

---

## 📸 Screenshots

### 1. POST Register — New User (200 OK)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/register/](https://backendlab-2-lab-04.onrender.com/register/)
- **Expected HTTP Status:** `200 OK`

[![Register Success](screenshots/01-register-success.png)](https://backendlab-2-lab-04.onrender.com/register/)

### 2. POST Register — Duplicate Username (400 Bad Request)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/register/](https://backendlab-2-lab-04.onrender.com/register/)
- **Expected HTTP Status:** `400 Bad Request`

[![Register Duplicate](screenshots/02-register-duplicate.png)](https://backendlab-2-lab-04.onrender.com/register/)

### 3. POST Register — Missing Password Field (400 Bad Request)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/register/](https://backendlab-2-lab-04.onrender.com/register/)
- **Expected HTTP Status:** `400 Bad Request`

[![Register Missing Fields](screenshots/03-register-missing-fields.png)](https://backendlab-2-lab-04.onrender.com/register/)

### 4. POST Register — Short Password (400 Bad Request)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/register/](https://backendlab-2-lab-04.onrender.com/register/)
- **Expected HTTP Status:** `400 Bad Request`

[![Register Short Password](screenshots/04-register-short-password.png)](https://backendlab-2-lab-04.onrender.com/register/)

### 5. POST Login — Valid Credentials (200 OK + JWT Token)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/login/](https://backendlab-2-lab-04.onrender.com/login/)
- **Expected HTTP Status:** `200 OK`

[![Login Success](screenshots/05-login-success.png)](https://backendlab-2-lab-04.onrender.com/login/)

### 6. JWT Token Decoded at jwt.io
- Paste the token from Login response into [https://jwt.io](https://jwt.io) to see Header, Payload and Signature

![JWT Decoded](screenshots/06-jwt-decoded.png)

### 7. POST Login — Invalid Username (400 Bad Request)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/login/](https://backendlab-2-lab-04.onrender.com/login/)
- **Expected HTTP Status:** `400 Bad Request`

[![Login Invalid User](screenshots/07-login-invalid-user.png)](https://backendlab-2-lab-04.onrender.com/login/)

### 8. POST Login — Wrong Password (400 Bad Request)
- **Render Live URL:** [https://backendlab-2-lab-04.onrender.com/login/](https://backendlab-2-lab-04.onrender.com/login/)
- **Expected HTTP Status:** `400 Bad Request`

[![Login Wrong Password](screenshots/08-login-wrong-password.png)](https://backendlab-2-lab-04.onrender.com/login/)

---

## 🚀 Deployment on Render

### Steps to Deploy

1. **Open Render Dashboard:** Go to [dashboard.render.com](https://dashboard.render.com/).
2. **Create a New Web Service** → connect repository `backendlab_2`.
3. **Configure the service:**

| Setting | Value |
|---------|-------|
| **Name** | `backendlab-2-lab-04` |
| **Root Directory** | *(leave blank — uses root package.json)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node lab-04/server.js` |
| **Environment Variable** | `NODE_VERSION: 20.18.0` |

4. Click **Deploy** and wait ~2–3 minutes.
5. Verify at [https://backendlab-2-lab-04.onrender.com/](https://backendlab-2-lab-04.onrender.com/)

---

## ❗ Problems Faced and Solutions

| Problem | Solution |
|---------|----------|
| **Why POST for login?** | POST is used because credentials are sent in the request body, not in the URL. GET requests expose parameters in the URL and browser history, which is insecure for passwords. |
| **bcrypt vs jwt not found** | Ran `npm install bcrypt jsonwebtoken` inside the `lab-04/` directory. |
| **`bcrypt.hash` returns undefined without await** | Added `await` before `bcrypt.hash()` and `bcrypt.compare()` since both are asynchronous. |
| **Storing password in JWT payload** | Fixed to only store `{ username }` in payload. Passwords must never go in the token. |

---

## 🎓 Viva Questions & Answers

| Question | Answer |
|:---|:---|
| **Why POST for login?** | Credentials are sent in the request body — never in the URL. GET would expose the password in the browser address bar, server logs, and browser history. POST is the correct method for sending sensitive data. |
| **Hash vs Encrypt?** | Hashing is a one-way operation — a hash cannot be reversed to get the original password. Encryption is two-way and can be decrypted with a key. Passwords use hashing (bcrypt) so even if the database is leaked, plain-text passwords cannot be recovered. |
| **What does jwt.sign need?** | `jwt.sign(payload, secretKey, [options])` — it needs the data to put in the token (payload), a secret key to create the signature, and optionally expiry time (`{ expiresIn: '1d' }`). |
| **What should never go into the payload?** | Passwords, secret keys, payment details, or any sensitive private data. The JWT payload is base64-encoded — not encrypted — so anyone can decode and read it. Only safe, non-sensitive identifiers (like `username`) belong in the payload. |

---

## ✅ Conclusion

In this lab, I learned:

1. **How to create a user registration API** that checks for duplicate usernames and hashes passwords using `bcrypt.hash` before saving to SQLite.
2. **How to implement a login API** that validates credentials using `bcrypt.compare` and returns a signed JWT token on success.
3. **How JWT tokens work** — the three-part structure (header, payload, signature), how to decode them at jwt.io, and what data is safe to store in the payload.
4. **Why passwords must never be stored or logged in plain text** and why hashing is different from encryption.
5. **How to validate request bodies** and return consistent `400 Bad Request` errors for missing fields, weak passwords, duplicate users, and wrong credentials.

---

## 👤 Author

**Ravella Lokesh** – 252U1R1217 – AIDE-2B
