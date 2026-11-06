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
        "Content-Type": "application/json",
      },
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
  console.log("\nStarting Lab 3 Test Suite - Ravella Lokesh (252U1R1217)\n");

  serverInstance = await initializeDBAndServer(TEST_PORT);

  let passed = 0;
  let total = 0;

  const assertTest = (description, condition, detail = "") => {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${description}`);
    } else {
      console.log(`[FAIL] Test ${total}: ${description} -> ${detail}`);
    }
  };

  try {
    const resRoot = await request("GET", "/");
    assertTest("GET / returns 200 OK", resRoot.status === 200);

    const resBooks = await request("GET", "/books");
    assertTest("GET /books returns 200 OK", resBooks.status === 200 && Array.isArray(resBooks.data) && resBooks.data.length <= 10);

    const resSearch = await request("GET", "/books?search_q=Clean");
    assertTest("GET /books?search_q=Clean matches title", resSearch.status === 200 && resSearch.data.length > 0 && resSearch.data[0].title.includes("Clean"));

    const resSort = await request("GET", "/books?order_by=price&order=DESC");
    const isSortedDesc = resSort.data.length > 1 && resSort.data[0].price >= resSort.data[1].price;
    assertTest("GET /books?order_by=price&order=DESC sorts descending", resSort.status === 200 && isSortedDesc);

    const resPriceRange = await request("GET", "/books?min_price=300&max_price=500");
    const allWithinRange = resPriceRange.data.every((b) => b.price >= 300 && b.price <= 500);
    assertTest("GET /books?min_price=300&max_price=500 returns books in range", resPriceRange.status === 200 && allWithinRange);

    const resPage = await request("GET", "/books?limit=3&offset=2");
    assertTest("GET /books?limit=3&offset=2 applies pagination", resPage.status === 200 && resPage.data.length <= 3);

    const resBadSort = await request("GET", "/books?order_by=invalid_column");
    assertTest("GET /books with invalid order_by returns 400 Bad Request", resBadSort.status === 400);

    const resBadOrder = await request("GET", "/books?order=SIDEWAYS");
    assertTest("GET /books with invalid order returns 400 Bad Request", resBadOrder.status === 400);

    const resBadRange = await request("GET", "/books?min_price=800&max_price=200");
    assertTest("GET /books with min_price > max_price returns 400 Bad Request", resBadRange.status === 400);

    const resSingle = await request("GET", "/books/1");
    assertTest("GET /books/1 returns 200 OK", resSingle.status === 200 && resSingle.data.id === 1);

    const resNotFound = await request("GET", "/books/99999");
    assertTest("GET /books/99999 returns 404 Not Found", resNotFound.status === 404);

    const resInvalidId = await request("GET", "/books/not-an-id");
    assertTest("GET /books/not-an-id returns 400 Bad Request", resInvalidId.status === 400);

    const newBookPayload = {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      price: 950,
      pages: 616,
    };
    const resCreate = await request("POST", "/books", newBookPayload);
    const createdId = resCreate.data ? resCreate.data.id : null;
    assertTest("POST /books creates book and returns 201 Created", resCreate.status === 201 && createdId > 0 && resCreate.data.title === newBookPayload.title);

    const resNoTitle = await request("POST", "/books", { author: "Some Author", price: 300 });
    assertTest("POST /books without title returns 400 Bad Request", resNoTitle.status === 400 && resNoTitle.data.message.includes("title"));

    const resNoAuthor = await request("POST", "/books", { title: "Some Title", price: 300 });
    assertTest("POST /books without author returns 400 Bad Request", resNoAuthor.status === 400 && resNoAuthor.data.message.includes("author"));

    const resBadPrice = await request("POST", "/books", { title: "Title", author: "Author", price: "free_of_cost" });
    assertTest("POST /books with non-numeric price returns 400 Bad Request", resBadPrice.status === 400 && resBadPrice.data.message.includes("price"));

    const updatePayload = {
      title: "Designing Data-Intensive Applications (Updated 2nd Edition)",
      author: "Martin Kleppmann",
      price: 1050,
      pages: 650,
    };
    const resUpdate = await request("PUT", `/books/${createdId}`, updatePayload);
    assertTest("PUT /books/:id updates record and returns 200 OK", resUpdate.status === 200 && resUpdate.data.price === 1050);

    const resUpdateNotFound = await request("PUT", "/books/99999", updatePayload);
    assertTest("PUT /books/99999 returns 404 Not Found", resUpdateNotFound.status === 404);

    const resUpdateBadPrice = await request("PUT", `/books/${createdId}`, { ...updatePayload, price: "invalid" });
    assertTest("PUT /books/:id with invalid price returns 400 Bad Request", resUpdateBadPrice.status === 400);

    const resDelete = await request("DELETE", `/books/${createdId}`);
    assertTest("DELETE /books/:id returns 200 OK", resDelete.status === 200 && resDelete.data.message === "Book deleted successfully");

    const resDeleteNotFound = await request("DELETE", `/books/${createdId}`);
    assertTest("DELETE /books/:id already deleted returns 404 Not Found", resDeleteNotFound.status === 404);

    const resDeleteBadId = await request("DELETE", "/books/-10");
    assertTest("DELETE /books/-10 returns 400 Bad Request", resDeleteBadId.status === 400);

    console.log(`\nSummary: ${passed} / ${total} tests passed.\n`);
  } catch (err) {
    console.log("Error during test run:", err);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
};

runTests();
