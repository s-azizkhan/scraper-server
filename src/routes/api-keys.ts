import { Hono } from "hono";
import db from "../drizzle/db";
import { apiKeyTable } from "../drizzle/schema";
import { HTTPException } from "hono/http-exception";
import { getApiUsageById } from "../services/api-usage";
import {
  apiKeyAuthMiddleware,
  getApiKeyDataFromContext,
} from "../middleware/api-key-auth";

const apiKeyRoutes = new Hono();
apiKeyRoutes.use("/usage", apiKeyAuthMiddleware);

// Generate a new API Key
apiKeyRoutes.post("/", async (c) => {
  // TODO: Associate key with a user/creator - requires user auth
  const creator = "system"; // Placeholder
  const usageLimit = 100; // Example limit

  const newApiKey = `sk-${crypto.randomUUID()}-${new Date().getTime()}`;

  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(newApiKey);
  const hashedKey = hasher.digest("hex");

  try {
    await db.insert(apiKeyTable).values({
      hash: hashedKey,
      creator: creator,
      usageLimit: usageLimit,
    });

    // Return the *unhashed* key to the user ONCE
    return c.json(
      {
        hashedKey,
        apiKey: newApiKey,
        message:
          "API Key created successfully, Store it securely!, It won't show again.",
      },
      201,
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    throw new HTTPException(500, { message: "Failed to create API key." });
  }
});

// List API Keys (basic info, excluding hash)
apiKeyRoutes.get("/", async (c) => {
  // TODO: Filter by authenticated user
  try {
    const keys = await db.select().from(apiKeyTable);

    return c.json({ keys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    throw new HTTPException(500, { message: "Failed to fetch API keys." });
  }
});

apiKeyRoutes.get("/usage", async (c) => {
  try {
    const apiData = await getApiKeyDataFromContext(c);
    const usages = await getApiUsageById(apiData.id);
    return c.json({ usageCount: usages.length, usages });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch API key usages.",
    });
  }
});

export default apiKeyRoutes;
