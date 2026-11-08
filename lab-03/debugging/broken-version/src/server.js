require("dotenv").config();
const createApp = require("./app");
const { initDb, seedIfEmpty } = require("./db");

const PORT = 3000; // hard-coded

async function main() {
  const db = await initDb();
  await seedIfEmpty(db);

  const app = createApp(db);
  const server = app.listen(PORT, () => console.log(`Books API listening on port ${PORT}`));

}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
