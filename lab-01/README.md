# Lab 1: Node.js and Express Server Fundamentals

**Name:** Ravella Lokesh  
**Registration Number:** 252U1R1217  
**Section:** AIDE-2B  
**Institution:** Aurora Higher Education and Research Academy  
**Faculty:** Joel Prashanth D  
**Course:** Backend Development Fundamentals · Year II Term II  

---

## Aim
To create a basic HTTP server using Node.js and develop a web server using Express.js with multiple GET routes, JSON responses, and appropriate HTTP status codes.

---

## Endpoints

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Welcome message in JSON | `200 OK` |
| `GET` | `/about` | Student details in JSON | `200 OK` |
| `GET` | `/time` | Current date and time in ISO format | `200 OK` |
| `GET` | `*` | Unknown route handler | `404 Not Found` |

---

## How to Run

```bash
cd lab-01
npm install
npm start
```

