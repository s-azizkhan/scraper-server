import { Hono } from "hono";
import { apiKeyAuthMiddleware } from "../middleware/api-key-auth";

// --- Scraping APIs --- (Requires API Key Auth)
const scrapeRoutes = new Hono();
scrapeRoutes.use('*', apiKeyAuthMiddleware); // Apply API key auth to all scrape routes
scrapeRoutes.post('/linkedin', (c) => c.json({ message: 'Scrape LinkedIn (Placeholder)' }));
scrapeRoutes.post('/website', (c) => c.json({ message: 'Scrape Website (Placeholder)' }));


export default scrapeRoutes;