
import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { apiKeyTable } from "./api-key";

export const apiKeyUsageTable = pgTable('api_key_uasges', {
    id: uuid('id').primaryKey().defaultRandom(),
    apiKeyId: uuid('api_key_id').references(() => apiKeyTable.id),
    usageType: varchar('usage_type', { length: 255 }).notNull(),
    refId: varchar('ref_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});


// relations
export const apiKeyUsageRelations = relations(
    apiKeyUsageTable,
    ({ one }) => ({
        apiKey: one(apiKeyTable, {
            fields: [apiKeyUsageTable.apiKeyId],
            references: [apiKeyTable.id],
        }),
    })
)