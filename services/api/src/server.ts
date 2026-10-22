import { createApp } from "./app.js";
import { config } from "./config.js";
import { createDb } from "./db.js";

const db = createDb();
const app = createApp(db);
const server = app.listen(config.port, () => {
  console.log(`harbourline-api listening on http://localhost:${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      void db.close().then(() => process.exit(0));
    });
  });
}
