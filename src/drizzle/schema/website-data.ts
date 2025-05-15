
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const websiteDataTable = pgTable('website_data', {
    id: uuid('id').primaryKey().defaultRandom(),
    websiteUrl: text('website_url').notNull(),
    websiteData: jsonb('website_data').notNull().default('{}'),
    websitewebsiteAISummary: text('website_ai_summary').notNull().default(''),
    websiteAISummaryStatus: text('website_ai_summary_status').notNull().default('pending'),
    websiteAISummaryUpdatedAt: timestamp("website_ai_summary_updated_at"),
    scrapingStatus: text('scraping_status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});
