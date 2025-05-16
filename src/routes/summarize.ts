import { Hono } from "hono";
import {
  apiKeyAuthMiddleware,
  incrimentApiUsageMiddleware,
} from "../middleware/api-key-auth";
import { AIClient } from "../services/ai-client";

// --- Summarization APIs --- (Requires API Key Auth)
const summarizeRoutes = new Hono();
summarizeRoutes.use("*", apiKeyAuthMiddleware, incrimentApiUsageMiddleware); // Apply API key auth to all summarize routes
summarizeRoutes.post("/linkedin", async (c) => {

  // TODO: steps
  // 1. Get the parsed LinkedIn people by url from DB(if available)
  // 2. prepare the prompt
  // 3. call the AI client
  // 4. return the response
  return c.json({ message: "Summarize LinkedIn (Placeholder)" });
}
);
summarizeRoutes.post("/website", (c) =>
  c.json({ message: "Summarize Website (Placeholder)" }),
);

export default summarizeRoutes;
