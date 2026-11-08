const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const createApp = require("../src/app");
const { initDb, seedIfEmpty } = require("../src/db");

let server, base, db;

before(async () => {
  db = await initDb(":memory:");
  await seedIfEmpty(db);
  server = createApp(db).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await db.close();
});

const call = async (path, opts = {}) => {
  const res = await fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body === undefined ? undefined : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body),
  });
  return { status: res.status, body: await res.json() };
};

// ---------- success cases ----------
test("GET /books uses defaults (limit 10, offset 0, id ASC)", async () => {
  const { status, body } = await call("/books");
  assert.equal(status, 200);
  assert.equal(body.data.length, 10);
  assert.equal(body.meta.limit, 10);
  assert.equal(body.meta.offset, 0);
  assert.equal(body.meta.total, 12);
  assert.equal(body.data[0].id, 1);
});

test("search_q does a partial, case-insensitive title match", async () => {
  const { status, body } = await call("/books?search_q=javascript");
  assert.equal(status, 200);
  assert.equal(body.meta.total, 2);
  assert.ok(body.data.every((b) => b.title.toLowerCase().includes("javascript")));
});

test("order_by + order sorts results", async () => {
  const { body } = await call("/books?order_by=price&order=desc&limit=3");
  const prices = body.data.map((b) => b.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => b - a));
  assert.equal(prices[0], 990);
});

test("limit and offset paginate", async () => {
  const page1 = await call("/books?limit=5&offset=0");
  const page2 = await call("/books?limit=5&offset=5");
  assert.equal(page1.body.data.length, 5);
  assert.equal(page2.body.data.length, 5);
  assert.notEqual(page1.body.data[0].id, page2.body.data[0].id);
});

test("min_price and max_price filter (BETWEEN)", async () => {
  const { body } = await call("/books?min_price=300&max_price=500");
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((b) => b.price >= 300 && b.price <= 500));
});

test("only min_price works", async () => {
  const { body } = await call("/books?min_price=800");
  assert.ok(body.data.every((b) => b.price >= 800));
});

test("filters can be combined", async () => {
  const { body } = await call("/books?search_q=java&max_price=300&order_by=price&order=ASC");
  assert.ok(body.data.every((b) => b.title.toLowerCase().includes("java") && b.price <= 300));
});

test("LIKE wildcards in search_q are treated literally", async () => {
  const { status, body } = await call("/books?search_q=%25");
  assert.equal(status, 200);
  assert.equal(body.meta.total, 0);
});

test("SQL injection attempt in search_q is harmless", async () => {
  const { status, body } = await call("/books?search_q=" + encodeURIComponent("' OR 1=1 --"));
  assert.equal(status, 200);
  assert.equal(body.meta.total, 0);
});

test("GET /books/:id returns the book", async () => {
  const { status, body } = await call("/books/1");
  assert.equal(status, 200);
  assert.equal(body.data.id, 1);
});

let createdId;
test("POST /books -> 201", async () => {
  const { status, body } = await call("/books", {
    method: "POST",
    body: { title: "Test Book", author: "Tester", price: 123.5 },
  });
  assert.equal(status, 201);
  assert.equal(body.data.title, "Test Book");
  assert.equal(body.data.price, 123.5);
  createdId = body.data.id;
});

test("POST accepts numeric string price", async () => {
  const { status, body } = await call("/books", {
    method: "POST",
    body: { title: "String Price", author: "Tester", price: "99" },
  });
  assert.equal(status, 201);
  assert.equal(body.data.price, 99);
});

test("PUT /books/:id -> 200", async () => {
  const { status, body } = await call(`/books/${createdId}`, {
    method: "PUT",
    body: { title: "Updated", author: "Tester", price: 200 },
  });
  assert.equal(status, 200);
  assert.equal(body.data.title, "Updated");
  assert.equal(body.data.price, 200);
});

test("DELETE /books/:id -> 200, then GET -> 404", async () => {
  const del = await call(`/books/${createdId}`, { method: "DELETE" });
  assert.equal(del.status, 200);
  assert.ok(del.body.message);
  const after = await call(`/books/${createdId}`);
  assert.equal(after.status, 404);
});

// ---------- failure cases ----------
const bad = [
  ["missing title", { author: "A", price: 10 }],
  ["missing author", { title: "T", price: 10 }],
  ["missing price", { title: "T", author: "A" }],
  ["blank title", { title: "   ", author: "A", price: 10 }],
  ["non-numeric price", { title: "T", author: "A", price: "abc" }],
  ["empty-string price", { title: "T", author: "A", price: "" }],
  ["boolean price", { title: "T", author: "A", price: true }],
  ["negative price", { title: "T", author: "A", price: -5 }],
  ["non-string title", { title: 123, author: "A", price: 10 }],
];
for (const [name, payload] of bad) {
  test(`POST rejects ${name} with 400 + message`, async () => {
    const { status, body } = await call("/books", { method: "POST", body: payload });
    assert.equal(status, 400);
    assert.equal(typeof body.message, "string");
  });
}

test("POST with malformed JSON -> 400", async () => {
  const { status, body } = await call("/books", { method: "POST", body: "{ not json" });
  assert.equal(status, 400);
  assert.ok(body.message);
});

test("POST with no body -> 400", async () => {
  const { status, body } = await call("/books", { method: "POST" });
  assert.equal(status, 400);
  assert.ok(body.message);
});

test("PUT with invalid body -> 400", async () => {
  const { status } = await call("/books/1", { method: "PUT", body: { title: "x" } });
  assert.equal(status, 400);
});

const badQueries = [
  "order_by=password",
  "order_by=price;DROP TABLE books",
  "order=sideways",
  "limit=0",
  "limit=1000",
  "limit=abc",
  "offset=-1",
  "offset=1.5",
  "min_price=abc",
  "max_price=-1",
  "min_price=500&max_price=100",
];
for (const q of badQueries) {
  test(`GET /books?${q} -> 400`, async () => {
    const { status, body } = await call(`/books?${q}`);
    assert.equal(status, 400);
    assert.equal(typeof body.message, "string");
  });
}

test("GET unknown id -> 404", async () => {
  const { status, body } = await call("/books/99999");
  assert.equal(status, 404);
  assert.ok(body.message);
});

test("PUT unknown id -> 404", async () => {
  const { status } = await call("/books/99999", {
    method: "PUT",
    body: { title: "T", author: "A", price: 1 },
  });
  assert.equal(status, 404);
});

test("DELETE unknown id -> 404", async () => {
  const { status } = await call("/books/99999", { method: "DELETE" });
  assert.equal(status, 404);
});

test("non-numeric id -> 400", async () => {
  const { status } = await call("/books/abc");
  assert.equal(status, 400);
});

test("unknown route -> 404 with message", async () => {
  const { status, body } = await call("/authors");
  assert.equal(status, 404);
  assert.ok(body.message);
});
