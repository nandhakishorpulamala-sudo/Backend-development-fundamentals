const express = require("express");
const { HttpError } = require("../middleware/errors");
const { validateBookBody, parseListQuery, parseId } = require("../validation");

module.exports = function booksRouter(db) {
  const router = express.Router();

  // GET /books  -> search, filter, sort, paginate
  router.get("/", async (req, res) => {
    const { search_q, order_by, order, limit, offset, min_price, max_price } = parseListQuery(req.query);

    // Build the WHERE clause. User values only ever go into `params` (parameterised).
    const where = [];
    const params = [];

    if (search_q) {
      // Escape LIKE wildcards so "100%" is searched literally.
      const escaped = search_q.replace(/[\\%_]/g, (c) => "\\" + c);
      where.push("title LIKE ? ESCAPE '\\'");
      params.push(`%${escaped}%`);
    }
    if (min_price !== undefined && max_price !== undefined) {
      where.push("price BETWEEN ? AND ?");
      params.push(min_price, max_price);
    } else if (min_price !== undefined) {
      where.push("price >= ?");
      params.push(min_price);
    } else if (max_price !== undefined) {
      where.push("price <= ?");
      params.push(max_price);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // order_by / order cannot be bound as parameters, so they were checked
    // against a whitelist in parseListQuery() before reaching this line.
    const { total } = await db.get(`SELECT COUNT(*) AS total FROM books ${whereSql}`, params);
    const rows = await db.all(
      `SELECT id, title, author, price, created_at FROM books ${whereSql}
       ORDER BY ${order_by} ${order}, id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.status(200).json({ data: rows, meta: { total, count: rows.length, limit, offset } });
  });

  // GET /books/:id
  router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const book = await db.get("SELECT id, title, author, price, created_at FROM books WHERE id = ?", [id]);
    if (!book) throw new HttpError(404, `Book with id ${id} not found`);
    res.status(200).json({ data: book });
  });

  // POST /books
  router.post("/", async (req, res) => {
    const { title, author, price } = validateBookBody(req.body);
    const result = await db.run("INSERT INTO books (title, author, price) VALUES (?, ?, ?)", [title, author, price]);
    const book = await db.get("SELECT id, title, author, price, created_at FROM books WHERE id = ?", [result.lastID]);
    res.status(201).location(`/books/${book.id}`).json({ message: "Book created", data: book });
  });

  // PUT /books/:id  (full update: title, author and price are all required)
  router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const { title, author, price } = validateBookBody(req.body);
    const result = await db.run("UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?", [title, author, price, id]);
    if (result.changes === 0) throw new HttpError(404, `Book with id ${id} not found`);
    const book = await db.get("SELECT id, title, author, price, created_at FROM books WHERE id = ?", [id]);
    res.status(200).json({ message: "Book updated", data: book });
  });

  // DELETE /books/:id
  router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const result = await db.run("DELETE FROM books WHERE id = ?", [id]);
    if (result.changes === 0) throw new HttpError(404, `Book with id ${id} not found`);
    res.status(200).json({ message: `Book ${id} deleted` });
  });

  return router;
};
