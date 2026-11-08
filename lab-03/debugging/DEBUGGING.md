# Debugging exercise

`broken-version/` is a copy of the API with the four bugs from the lab planted in it.
To practise: `cd debugging/broken-version`, run `npm install` there, and fix them one at a time.
(The faculty's own broken project may differ in detail, but the symptoms and fixes are the same.)

| # | Symptom | Cause | Fix |
|---|---------|-------|-----|
| 1 | `Error: Cannot find module './route/books'` when starting | Wrong import path in `src/app.js`: the folder is `routes`, not `route` | `require("./routes/books")` |
| 2 | `Error: listen EADDRINUSE: address already in use :::3000` | Another process already holds the port, and the port is hard-coded with no error handling in `src/server.js` | Stop the other process (`lsof -i :3000` then `kill <pid>`, or on Windows `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F`), read the port from `process.env.PORT`, and handle `server.on("error")` |
| 3 | `GET /books/1` returns 500; server log shows `SQLITE_ERROR: no such table: book` | Table-name typo in `src/routes/books.js`: `FROM book` instead of `FROM books` | `FROM books` |
| 4 | `GET /books` returns 200 but `meta.total` is missing | Missing `await` on `db.get(...)` in the list route: destructuring a Promise gives `undefined` | `const { total } = await db.get(...)` |

Order matters: bug 1 stops the server from starting at all, so it must be fixed first.
The fixed code is the main project in `src/`.
