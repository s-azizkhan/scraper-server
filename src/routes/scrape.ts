import { Hono } from "hono";
import {
  apiKeyAuthMiddleware,
  incrimentApiUsageMiddleware,
} from "../middleware/api-key-auth";
import { HTTPException } from "hono/http-exception";
import { addApiUsage } from "../services/api-usage";
import { apiKeyTable } from "../drizzle/schema";
import { scrapeUrlWithBrightData, ScrapeTypeEnum } from "../services/scrapers/brightdata";

// --- Scraping APIs --- (Requires API Key Auth)
const scrapeRoutes = new Hono();
scrapeRoutes.use("*", apiKeyAuthMiddleware, incrimentApiUsageMiddleware); // Apply API key auth to all scrape routes

scrapeRoutes.post('/linkedin', async (c) => {
  try {
    const { urls } = await c.req.json<{ urls: string[] }>();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new HTTPException(400, { message: 'An array of URLs is required in the request body.' });
    }
    // Validate URL formats (basic check)
    for (const url of urls) {
      try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.endsWith('linkedin.com')) {
          throw new HTTPException(400, { message: `Invalid LinkedIn URL format: ${url}` });
        }
      } catch (_) {
        throw new HTTPException(400, { message: `Invalid URL format: ${url}` });
      }
    }

    const apiKeyData = c.get(
      "apiKeyData" as never,
    ) as typeof apiKeyTable.$inferSelect;
    await addApiUsage(apiKeyData.id, "LINKEDIN_SCRAPE", urls.toString());

    const data = await scrapeUrlWithBrightData(urls, ScrapeTypeEnum.linkedin);
    // TODO: Implement logic to puch data to the database
    return c.json({ message: 'LinkedIn scrape successful', data });
  } catch (error: any) {
    console.error('Error scraping LinkedIn:', error);
    const statusCode = error instanceof HTTPException ? error.status : 500;
    const message = error.message || 'Failed to scrape LinkedIn page(s).';
    throw new HTTPException(statusCode, { message });
  }
});

scrapeRoutes.post('/website', async (c) => {
  try {
    const { urls } = await c.req.json<{ urls: string[] }>();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new HTTPException(400, { message: 'An array of URLs is required in the request body.' });
    }
    // Validate URL formats (basic check)
    for (const url of urls) {
      try {
        new URL(url);
      } catch (_) {
        throw new HTTPException(400, { message: `Invalid URL format: ${url}` });
      }
    }

    const apiKeyData = c.get(
      "apiKeyData" as never,
    ) as typeof apiKeyTable.$inferSelect;
    await addApiUsage(apiKeyData.id, "WEBSITE_SCRAPE", urls.toString());

    const data = await scrapeUrlWithBrightData(urls, ScrapeTypeEnum.website); // Hardcoded 'website' type

    // TODO: Implement logic to puch data to the database
    return c.json({ message: 'Website scrape successful', data });
  } catch (error: any) {
    console.error('Error scraping website:', error);
    const statusCode = error instanceof HTTPException ? error.status : 500;
    const message = error.message || 'Failed to scrape website(s).';
    throw new HTTPException(statusCode, { message });
  }
});

export default scrapeRoutes;
