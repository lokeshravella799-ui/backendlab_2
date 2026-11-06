/**
 * Automated Comprehensive Test Suite for Lab 3 API
 * Tests both success and failure cases across all endpoints, parameters, and validations.
 */

const http = require("http");
const { app, initializeDBAndServer } = require("./server");

const TEST_PORT = 3099;
let serverInstance;

const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: TEST_PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on("error", (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log("\n========================================================");
  console.log(" Starting Lab 3 REST API Comprehensive Test Suite");
  console.log(" Student: Ravella Lokesh (252U1R1217) · Section: AIDE-2B");
  console.log("========================================================\n");

  serverInstance = await initializeDBAndServer(TEST_PORT);

  let passed = 0;
  let total = 0;

  const assertTest = (description, condition, detail = "") => {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total.toString().padStart(2, "0")}: ${description}`);
    } else {
      console.error(`[FAIL] Test ${total.toString().padStart(2, "0")}: ${description} -> ${detail}`);
    }
  };

  try {
    // 1. Root route
    const resRoot = await request("GET", "/");
    assertTest("GET / returns 200 OK with server metadata", resRoot.status === 200);

    // 2. GET /books (default query params)
    const resBooks = await request("GET", "/books");
    assertTest("GET /books returns 200 OK and default limit array", resBooks.status === 200 && Array.isArray(resBooks.data) && resBooks.data.length <= 10);

    // 3. GET /books with search_q (partial title match)
    const resSearch = await request("GET", "/books?search_q=Clean");
    assertTest("GET /books?search_q=Clean returns matching title", resSearch.status === 200 && resSearch.data.length > 0 && resSearch.data[0].title.includes("Clean"));

    // 4. GET /books with order_by and order DESC
    const resSort = await request("GET", "/books?order_by=price&order=DESC");
    const isSortedDesc = resSort.data.length > 1 && resSort.data[0].price >= resSort.data[1].price;
    assertTest("GET /books?order_by=price&order=DESC correctly sorts descending", resSort.status === 200 && isSortedDesc);

    // 5. GET /books with price range (min_price & max_price)
    const resPriceRange = await request("GET", "/books?min_price=300&max_price=500");
    const allWithinRange = resPriceRange.data.every((b) => b.price >= 300 && b.price <= 500);
    assertTest("GET /books?min_price=300&max_price=500 returns books within range", resPriceRange.status === 200 && allWithinRange);

    // 6. GET /books with limit & offset (pagination)
    const resPage = await request("GET", "/books?limit=3&offset=2");
    assertTest("GET /books?limit=3&offset=2 applies limit and offset", resPage.status === 200 && resPage.data.length <= 3);

    // 7. GET /books with invalid order_by (SQL Injection protection)
    const resBadSort = await request("GET", "/books?order_by=invalid_column");
    assertTest("GET /books with invalid order_by returns 400 Bad Request", resBadSort.status === 400 && resBadSort.data.message.includes("Invalid query parameter"));

    // 8. GET /books with invalid order direction
    const resBadOrder = await request("GET", "/books?order=SIDEWAYS");
    assertTest("GET /books with invalid order direction returns 400 Bad Request", resBadOrder.status === 400);

    // 9. GET /books with min_price > max_price
    const resBadRange = await request("GET", "/books?min_price=800&max_price=200");
    assertTest("GET /books with min_price > max_price returns 400 Bad Request", resBadRange.status === 400);

    // 10. GET /books/:bookId (Success)
    const resSingle = await request("GET", "/books/1");
    assertTest("GET /books/1 returns 200 OK and book object", resSingle.status === 200 && resSingle.data.id === 1);

    // 11. GET /books/:bookId (Not Found)
    const resNotFound = await request("GET", "/books/99999");
    assertTest("GET /books/99999 returns 404 Not Found", resNotFound.status === 404 && resNotFound.data.message);

    // 12. GET /books/:bookId (Invalid non-numeric ID)
    const resInvalidId = await request("GET", "/books/not-an-id");
    assertTest("GET /books/not-an-id returns 400 Bad Request", resInvalidId.status === 400);

    // 13. POST /books (Success: 201 Created)
    const newBookPayload = {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      price: 950,
      pages: 616
    };
    const resCreate = await request("POST", "/books", newBookPayload);
    const createdId = resCreate.data ? resCreate.data.id : null;
    assertTest("POST /books creates book and returns 201 Created", resCreate.status === 201 && createdId > 0 && resCreate.data.title === newBookPayload.title);

    // 14. POST /books Validation: Missing Title
    const resNoTitle = await request("POST", "/books", { author: "Some Author", price: 300 });
    assertTest("POST /books without title returns 400 Bad Request", resNoTitle.status === 400 && resNoTitle.data.message.includes("title"));

    // 15. POST /books Validation: Missing Author
    const resNoAuthor = await request("POST", "/books", { title: "Some Title", price: 300 });
    assertTest("POST /books without author returns 400 Bad Request", resNoAuthor.status === 400 && resNoAuthor.data.message.includes("author"));

    // 16. POST /books Validation: Non-numeric Price
    const resBadPrice = await request("POST", "/books", { title: "Title", author: "Author", price: "free_of_cost" });
    assertTest("POST /books with non-numeric price returns 400 Bad Request", resBadPrice.status === 400 && resBadPrice.data.message.includes("price"));

    // 17. PUT /books/:bookId (Success: 200 OK)
    const updatePayload = {
      title: "Designing Data-Intensive Applications (Updated 2nd Edition)",
      author: "Martin Kleppmann",
      price: 1050,
      pages: 650
    };
    const resUpdate = await request("PUT", `/books/${createdId}`, updatePayload);
    assertTest("PUT /books/:id updates record and returns 200 OK", resUpdate.status === 200 && resUpdate.data.price === 1050);

    // 18. PUT /books/:bookId (Not Found: 404)
    const resUpdateNotFound = await request("PUT", "/books/99999", updatePayload);
    assertTest("PUT /books/99999 for non-existent record returns 404 Not Found", resUpdateNotFound.status === 404);

    // 19. PUT /books/:bookId (Validation failure: non-numeric price)
    const resUpdateBadPrice = await request("PUT", `/books/${createdId}`, { ...updatePayload, price: "invalid" });
    assertTest("PUT /books/:id with invalid price returns 400 Bad Request", resUpdateBadPrice.status === 400);

    // 20. DELETE /books/:bookId (Success: 200 OK)
    const resDelete = await request("DELETE", `/books/${createdId}`);
    assertTest("DELETE /books/:id deletes book and returns 200 OK", resDelete.status === 200 && resDelete.data.message === "Book deleted successfully");

    // 21. DELETE /books/:bookId (Not Found: 404)
    const resDeleteNotFound = await request("DELETE", `/books/${createdId}`);
    assertTest("DELETE /books/:id after already deleted returns 404 Not Found", resDeleteNotFound.status === 404);

    // 22. DELETE /books/:bookId (Invalid ID)
    const resDeleteBadId = await request("DELETE", "/books/-10");
    assertTest("DELETE /books/-10 with negative ID returns 400 Bad Request", resDeleteBadId.status === 400);

    console.log("\n========================================================");
    console.log(` Test Execution Summary: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test execution encountered an error:", err);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
};

runTests();

