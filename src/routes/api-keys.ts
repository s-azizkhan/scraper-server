import { Hono } from "hono";
import db from "../drizzle/db";
import { apiKeyTable } from "../drizzle/schema";
import { HTTPException } from "hono/http-exception";

// --- API Key Management --- TODO: Add user authentication for these
const apiKeyRoutes = new Hono();

// Generate a new API Key
apiKeyRoutes.post('/', async (c) => {
  // TODO: Associate key with a user/creator - requires user auth
  const creator = 'system'; // Placeholder
  const usageLimit = 100; // Example limit

  const newApiKey = `sk-${crypto.randomUUID()}`;
  const hashedKey = await Bun.password.hash(newApiKey, {
    algorithm: "bcrypt",
  });

  try {
    await db.insert(apiKeyTable).values({
      hash: hashedKey,
      creator: creator,
      usageLimit: usageLimit,
    });

    // Return the *unhashed* key to the user ONCE
    return c.json({ apiKey: newApiKey, message: 'API Key created successfully. Store it securely!' }, 201);
  } catch (error) {
    console.error('Error creating API key:', error);
    throw new HTTPException(500, { message: 'Failed to create API key.' });
  }
});

// List API Keys (basic info, excluding hash)
apiKeyRoutes.get('/', async (c) => {
  // TODO: Filter by authenticated user
  try {
    const keys = await db.select({
      id: apiKeyTable.id,
      creator: apiKeyTable.creator,
      usageLimit: apiKeyTable.usageLimit,
      usageCount: apiKeyTable.usageCount,
      createdAt: apiKeyTable.createdAt,
    }).from(apiKeyTable);

    return c.json({ keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw new HTTPException(500, { message: 'Failed to fetch API keys.' });
  }
});

export default apiKeyRoutes;