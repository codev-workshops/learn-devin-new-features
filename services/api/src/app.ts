import express, { type ErrorRequestHandler, type Express } from "express";
import type { Db } from "./db.js";
import { HttpError } from "./errors.js";
import { adminRouter } from "./routes/admin.js";
import { cartsRouter } from "./routes/carts.js";
import { catalogRouter } from "./routes/catalog.js";
import { checkoutRouter } from "./routes/checkout.js";
import { ordersRouter } from "./routes/orders.js";
import { systemRouter } from "./routes/system.js";
import { webhooksRouter } from "./routes/webhooks.js";

export function createApp(db: Db): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    express.json({
      limit: "256kb",
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );

  app.use(systemRouter(db));
  app.use("/catalog", catalogRouter(db));
  app.use("/carts", cartsRouter(db));
  app.use("/checkout", checkoutRouter(db));
  app.use("/orders", ordersRouter(db));
  app.use("/admin", adminRouter(db));
  app.use("/webhooks", webhooksRouter(db));

  app.use((_req, res) => {
    res.status(404).json({ code: "not_found", message: "route not found" });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json(err.toJSON());
      return;
    }
    if (err && typeof err === "object" && "type" in err && err.type === "entity.parse.failed") {
      res.status(400).json({ code: "bad_request", message: "body must be valid JSON" });
      return;
    }
    console.error(err);
    res.status(500).json({ code: "internal", message: "internal error" });
  };
  app.use(onError);
  return app;
}
