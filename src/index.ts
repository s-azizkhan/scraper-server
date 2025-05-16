import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import summarizeRoutes from "./routes/summarize";
import scrapeRoutes from "./routes/scrape";
import apiKeyRoutes from "./routes/api-keys";

const app = new Hono();
app.use(etag(), logger());
app.use("*", requestId());

// TODO: add specific origin to allow
app.use(
  "*",
  cors({
    origin: "*",
  }),
);

app.get("/healthz", async (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

app.route("/api-keys", apiKeyRoutes);
app.route("/scrape", scrapeRoutes);
app.route("/summarize", summarizeRoutes);

// Global Error Handler
app.onError((err, c) => {
  // Check if the error is an instance of HTTPException (from Hono)
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status || 500);

  }
  console.error(err);
  // For other errors, return a generic 500 response
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
};
