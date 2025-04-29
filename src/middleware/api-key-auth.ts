import { HTTPException } from "hono/http-exception";
import db from "../drizzle/db";
import { apiKeyTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { Context, Next } from "hono";

const getApiKeyDataFromContext = async (c: Context) => {
  const apiKeyData = c.get(
    "apiKeyData" as never,
  ) as typeof apiKeyTable.$inferSelect;

  if (!apiKeyData) {
    console.table({ apiKeyData });
    throw Error("Api key not found");
  }
  return apiKeyData;
};

// API Key Authentication Middleware
const apiKeyAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Unauthorized: Missing or invalid API key format.",
    });
  }

  const apiKey = authHeader.split(" ")[1];
  if (!apiKey) {
    throw new HTTPException(401, {
      message: "Unauthorized: API key is missing.",
    });
  }

  try {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(apiKey);
    const hashedKey = hasher.digest("hex");

    console.table({ hashedKey, apiKey });

    const keyRecord = await db
      .select()
      .from(apiKeyTable)
      .where(eq(apiKeyTable.hash, hashedKey))
      .limit(1);

    if (keyRecord.length === 0) {
      throw new HTTPException(401, {
        message: "Unauthorized: Invalid API key.",
      });
    }

    const [keyData] = keyRecord;

    // Store key data in context for downstream handlers if needed
    c.set("apiKeyData", keyData);

    await next();
  } catch (error) {
    console.error("API Key Auth Error:", error);
    if (error instanceof HTTPException) {
      throw error; // Re-throw Hono exceptions
    }
    throw new HTTPException(500, {
      message: "Internal server error during authentication.",
    });
  }
};

const incrimentApiUsageMiddleware = async (c: Context, next: Next) => {
  try {
    const keyData = await getApiKeyDataFromContext(c);

    // rate limiting and usage quota checks
    if (keyData.usageCount >= keyData.usageLimit) {
      throw new HTTPException(429, { message: "Rate limit exceeded." });
    }
    // Increment usage count (consider atomicity)
    await db
      .update(apiKeyTable)
      .set({ usageCount: keyData.usageCount + 1 })
      .where(eq(apiKeyTable.id, keyData.id));

    await next();
  } catch (error) {
    console.error("incrimentApiUsageMiddleware Error:", error);
    if (error instanceof HTTPException) {
      throw error; // Re-throw Hono exceptions
    }
    throw new HTTPException(500, {
      message: "Internal server error during authentication.",
    });
  }
};

export {
  apiKeyAuthMiddleware,
  getApiKeyDataFromContext,
  incrimentApiUsageMiddleware,
};
