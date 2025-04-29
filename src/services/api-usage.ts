import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { apiKeyTable, apiKeyUsageTable } from "../drizzle/schema";

async function addApiUsage(
  apiKeyId: string,
  usageType: string,
  refId?: string,
) {
  try {
    const res = await db
      .insert(apiKeyUsageTable)
      .values({
        refId: refId || "",
        apiKeyId,
        usageType,
      })
      .returning();

    return res;
  } catch (err) {
    console.error("Error addApiUsage:", err);
    throw err;
  }
}

async function getApiUsageById(apiKeyId: string) {
  try {
    const res = await db
      .select()
      .from(apiKeyUsageTable)
      .where(eq(apiKeyUsageTable.apiKeyId, apiKeyId));

    return res;
  } catch (err) {
    console.error("Error getApiUsage:", err);
    throw err;
  }
}

async function getApiUsageByHash(apiHash: string) {
  try {
    const usages = await db
      .select()
      .from(apiKeyUsageTable)
      .innerJoin(apiKeyTable, eq(apiKeyTable.hash, apiHash));
    return usages;
  } catch (err) {
    console.error("Error getApiUsageByHash:", err);
    throw err;
  }
}

export { getApiUsageById, addApiUsage, getApiUsageByHash };
