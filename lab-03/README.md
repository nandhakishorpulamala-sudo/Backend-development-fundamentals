# Lab 3: REST API, query parameters, validation, debugging

**Name:** P Nandha Kishor · **Registration number:** 252U1R7082 · **Section:** CSE-FSD-2B

**Live link:** https://lab-03-five.vercel.app/

A Books REST API built with Node.js, Express and SQLite. It supports search, sorting, pagination,
a price-range filter, request validation, correct HTTP status codes and a consistent JSON format.

## How to run

```bash
cd lab-03
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start                 # server on http://localhost:3000
npm test                  # runs the automated tests (42 cases)
```

Environment variables (see `.env.example`, never commit the real `.env`):

| Variable | Meaning | Default |
|----------|---------|---------|
| `PORT` | Port the server listens on | `3000` |
| `DB_PATH` | SQLite database file | `./books.db` |

The table is created and filled with 12 sample books automatically on first start.

## Endpoints

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| GET | `/books` | List books with search, filters, sorting and pagination | 200 |
| GET | `/books/:id` | Get one book | 200 |
| POST | `/books` | Create a book (`title`, `author`, `price` required) | 201 |
| PUT | `/books/:id` | Update a book (all three fields required) | 200 |
| DELETE | `/books/:id` | Delete a book | 200 |

### Query parameters for `GET /books`

| Parameter | Default | Rules |
|-----------|---------|-------|
| `search_q` | none | Partial, case-insensitive match on `title` (`LIKE`) |
| `order_by` | `id` | One of `id`, `title`, `author`, `price`, `created_at` |
| `order` | `ASC` | `ASC` or `DESC` |
| `limit` | `10` | Integer 1 to 100 |
| `offset` | `0` | Integer 0 or more |
| `min_price` | none | Number 0 or more |
| `max_price` | none | Number 0 or more; both given → `BETWEEN`, must satisfy min ≤ max |

Example: `GET /books?search_q=java&min_price=200&max_price=500&order_by=price&order=DESC&limit=5&offset=0`

### Status codes and response format

| Situation | Status | Body |
|-----------|--------|------|
| Create | 201 | `{ "message": "Book created", "data": {...} }` |
| Read / update / delete | 200 | `{ "data": ... }` / `{ "message": ..., "data": ... }` / `{ "message": ... }` |
| Missing title/author/price, non-numeric or negative price, bad JSON, bad query value, bad id | 400 | `{ "message": "..." }` |
| Id or route does not exist | 404 | `{ "message": "..." }` |
| Unexpected server error | 500 | `{ "message": "Internal server error" }` |

## Project structure

```
lab-03/
├── src/
│   ├── server.js            starts the server (reads .env, handles EADDRINUSE)
│   ├── app.js               builds the Express app
│   ├── db.js                SQLite connection, table creation, seed data
│   ├── validation.js        body, query and id validation
│   ├── routes/books.js      the /books endpoints
│   └── middleware/errors.js 404 handler and one error handler
├── tests/api.test.js        42 automated tests (success and failure)
├── postman/                 Postman collection + test list
├── debugging/               broken-version + DEBUGGING.md
└── screenshots/
```

## Screenshots

Add your own screenshots to `screenshots/` and reference them like this:

<!-- ![GET /books defaults](screenshots/01-get-books.png) -->
<!-- ![Search and sort](screenshots/02-search-sort.png) -->
<!-- ![Price range](screenshots/03-price-range.png) -->
<!-- ![POST 201](screenshots/04-post-201.png) -->
<!-- ![POST 400 invalid price](screenshots/05-post-400.png) -->
<!-- ![GET 404](screenshots/06-get-404.png) -->
<!-- ![PUT 200](screenshots/07-put-200.png) -->
<!-- ![DELETE 200](screenshots/08-delete-200.png) -->
<!-- ![Postman collection run](screenshots/09-postman-run.png) -->
<!-- ![npm test passing](screenshots/10-npm-test.png) -->
<!-- ![Database view](screenshots/11-database.png) -->

## Postman tests

See [`postman/POSTMAN_TEST_LIST.md`](postman/POSTMAN_TEST_LIST.md) (27 requests: 10 success, 17 failure).
Import `postman/lab-03.postman_collection.json` and run the collection.

## Notes: problems faced and how I solved them

The debugging exercise (details in [`debugging/DEBUGGING.md`](debugging/DEBUGGING.md)):

1. **Wrong import path** (`Cannot find module './route/books'`): the folder is `routes`; corrected the `require` path.
2. **Port conflict** (`EADDRINUSE`): found and stopped the process using the port, and made the server read `PORT` from `.env` and print a clear message instead of a stack trace.
3. **Table-name typo** (`no such table: book`): the query said `book`, the table is `books`.
4. **Missing `await`**: `db.get()` returns a Promise, so without `await` the result was `undefined`.

Design decisions:

- `order_by` and `order` cannot be bound as SQL parameters, so they are checked against a whitelist before being placed in the query. All other user input uses `?` placeholders.
- `%` and `_` typed into `search_q` are escaped so they are searched literally.
- 400 is used when the request itself is wrong (bad input); 404 only when a well-formed request names a record that does not exist.

(Add anything else you actually ran into.)
