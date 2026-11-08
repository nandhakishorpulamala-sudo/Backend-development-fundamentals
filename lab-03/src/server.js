require("dotenv").config();
const createApp = require("./app");
const { initDb, seedIfEmpty } = require("./db");

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const db = await initDb();
  await seedIfEmpty(db);

  const app = createApp(db);
  const server = app.listen(PORT);
  server.once("listening", () => console.log(`Books API listening on port ${PORT}`));

  // Friendly message for the classic port conflict.
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in .env`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
