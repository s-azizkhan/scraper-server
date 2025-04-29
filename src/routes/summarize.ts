import { Hono } from "hono";
import { apiKeyAuthMiddleware } from "../middleware/api-key-auth";

// --- Summarization APIs --- (Requires API Key Auth)
const summarizeRoutes = new Hono();
summarizeRoutes.use('*', apiKeyAuthMiddleware); // Apply API key auth to all summarize routes
summarizeRoutes.post('/linkedin', (c) => c.json({ message: 'Summarize LinkedIn (Placeholder)' }));
summarizeRoutes.post('/website', (c) => c.json({ message: 'Summarize Website (Placeholder)' }));


export default summarizeRoutes;