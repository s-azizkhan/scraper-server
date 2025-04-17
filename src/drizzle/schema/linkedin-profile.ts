
import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const linkedInProfileTable = pgTable('linkedin_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: text('profile_id').notNull(),
    prevProfileData: jsonb('prev_profile_data').notNull().default('{}'),
    profileData: jsonb('profile_data').notNull().default('{}'),
    scrapingStatus: text('scraping_status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});
