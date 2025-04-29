import { Hono } from "hono";
import {
  apiKeyAuthMiddleware,
  incrimentApiUsageMiddleware,
} from "../middleware/api-key-auth";
import { HTTPException } from "hono/http-exception";
import { addApiUsage } from "../services/api-usage";
import { apiKeyTable } from "../drizzle/schema";

// --- Scraping APIs --- (Requires API Key Auth)
const scrapeRoutes = new Hono();
scrapeRoutes.use("*", apiKeyAuthMiddleware, incrimentApiUsageMiddleware); // Apply API key auth to all scrape routes
scrapeRoutes.post("/linkedin", async (c) => {
  try {
    const apiKeyData = c.get(
      "apiKeyData" as never,
    ) as typeof apiKeyTable.$inferSelect;
    const LinkedInUrl = "xxxxxx";

    await addApiUsage(apiKeyData.id, "LINKEDIN_SCRAPE", LinkedInUrl);

    return c.json({ message: "Scrape LinkedIn (Placeholder)", apiKeyData });
  } catch (err) {
    console.error("Error fetching API keys:", err);
    throw new HTTPException(500, { message: "Failed to scrap LinkedIn." });
  }
});
scrapeRoutes.post("/website", async (c) => {
  try {
    const apiKeyData = c.get(
      "apiKeyData" as never,
    ) as typeof apiKeyTable.$inferSelect;
    const LinkedInUrl = "xxxxxx";

    await addApiUsage(apiKeyData.id, "LINKEDIN_SCRAPE", LinkedInUrl);
    return c.json({ message: "Scrape Website (Placeholder)" });
  } catch (err) {
    console.error("Error fetching API keys:", err);
    throw new HTTPException(500, { message: "Failed to scrap LinkedIn." });
  }
});

export default scrapeRoutes;
