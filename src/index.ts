import { Hono } from "hono";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
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

app.get("/healthz", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

app.route("/api-keys", apiKeyRoutes);
app.route("/scrape", scrapeRoutes);
app.route("/summarize", summarizeRoutes);

export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
};
