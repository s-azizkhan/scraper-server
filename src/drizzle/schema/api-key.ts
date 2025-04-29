import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const apiKeyTable = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  hash: varchar("hash", { length: 255 }).notNull(),
  creator: varchar("creator", { length: 255 }).notNull(),
  usageLimit: integer("usage_limit").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const selectApiKeyTable = apiKeyTable.$inferSelect;
