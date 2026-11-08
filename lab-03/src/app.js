const express = require("express");
const booksRouter = require("./routes/books");
const { notFoundHandler, errorHandler } = require("./middleware/errors");

// Builds the Express app around a database handle (lets tests use an in-memory DB).
function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => {
    res.status(200).json({ message: "Books API is running", endpoints: "/books" });
  });

  app.use("/books", booksRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
