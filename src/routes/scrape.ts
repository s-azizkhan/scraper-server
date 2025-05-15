import { Hono } from "hono";
import {
  apiKeyAuthMiddleware,
  incrimentApiUsageMiddleware,
} from "../middleware/api-key-auth";
import { HTTPException } from "hono/http-exception";
import { addApiUsage } from "../services/api-usage";
import { apiKeyTable } from "../drizzle/schema";
import { scrapeUrlWithBrightData, ScrapeTypeEnum } from "../services/scrapers/brightdata";
import { getLinkedInDataByUrl, inserLinkedinScrapingData, insertWebsiteScrapingData, updateLinkedinScrapingData } from "../services/insert-scraping-data";
import { LinkedinUrlTypeEnum } from "../drizzle/schema";
import { LinkedInProfileDataT } from "../services/scrapers/linkedin-profile";

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

    const newUrls: string[] = [];
    const existingLiData = [];
    for (const url of urls) {
      // check if the url is already in the database
      const existingData = await getLinkedInDataByUrl(url);
      if (existingData && existingData.scrapingStatus === "success") {
        existingLiData.push(existingData);
        continue; // Skip this URL if it already exists in the database
      }
      newUrls.push(url); // Add the URL to the newUrls array if it doesn't exist in the database
    }

    if (newUrls.length === 0) {
      return c.json({ message: 'All URLs already exists in the database', data: existingLiData });
    }
    await inserLinkedinScrapingData(newUrls, LinkedinUrlTypeEnum.profile);

    const data = await scrapeUrlWithBrightData(newUrls, ScrapeTypeEnum.linkedin) as LinkedInProfileDataT[];
    const dbResponse = await updateLinkedinScrapingData(data, "success");

    return c.json({ message: 'LinkedIn data scraped successful', data: [...dbResponse, ...existingLiData] });
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


    // add to DB
    await insertWebsiteScrapingData(urls);

    // const data = await scrapeUrlWithBrightData(urls, ScrapeTypeEnum.website); // Hardcoded 'website' type

    const data = {};
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
