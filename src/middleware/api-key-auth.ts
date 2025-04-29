import { HTTPException } from "hono/http-exception";
import db from "../drizzle/db";
import { apiKeyTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// API Key Authentication Middleware
const apiKeyAuthMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Unauthorized: Missing or invalid API key format.' });
    }
  
    const apiKey = authHeader.split(' ')[1];
    if (!apiKey) {
      throw new HTTPException(401, { message: 'Unauthorized: API key is missing.' });
    }
  
    try {
      // TODO: Implement secure key comparison (e.g., hashing)
      // For now, we'll do a direct lookup (INSECURE for production)
      const keyRecord = await db.select().from(apiKeyTable).where(eq(apiKeyTable.hash, apiKey)).limit(1);
  
      if (keyRecord.length === 0) {
        throw new HTTPException(401, { message: 'Unauthorized: Invalid API key.' });
      }
  
      const [keyData] = keyRecord;
  
      // TODO: Implement rate limiting and usage quota checks
      // if (keyData.usageCount >= keyData.usageLimit) {
      //   throw new HTTPException(429, { message: 'Rate limit exceeded.' });
      // }
  
      // TODO: Increment usage count (consider atomicity)
      // await db.update(apiKeyTable).set({ usageCount: keyData.usageCount + 1 }).where(eq(apiKeyTable.id, keyData.id));
  
      // Store key data in context for downstream handlers if needed
      c.set('apiKeyData', keyData);
  
      await next();
    } catch (error) {
      console.error('API Key Auth Error:', error);
      if (error instanceof HTTPException) {
        throw error; // Re-throw Hono exceptions
      }
      throw new HTTPException(500, { message: 'Internal server error during authentication.' });
    }
  };
  

export { apiKeyAuthMiddleware }