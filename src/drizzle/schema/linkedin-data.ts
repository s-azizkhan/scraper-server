
import { jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const LinkedinUrlEnumPG = pgEnum('urlType', ['profile', 'company', 'post', 'job']);

export enum LinkedinUrlTypeEnum {
    profile = 'profile',
    company = 'company',
    post = 'post',
    job = 'job',
};

export const linkedInDataTable = pgTable('linkedin_data', {
    id: uuid('id').primaryKey().defaultRandom(),
    linkedinUrl: text('linkedin_url').notNull(),
    urlType: LinkedinUrlEnumPG().default(LinkedinUrlEnumPG.enumValues[0]), // it can be: profile, company, post, job
    prevLinkedinData: jsonb('prev_linkedin_data').notNull().default('{}'),
    linkedinData: jsonb('linkedin_data').notNull().default('{}'),
    linkedinAISummary: text('linkedin_ai_summary').notNull().default(''),
    linkedinAISummaryStatus: text('linkedin_ai_summary_status').notNull().default('pending'),
    linkedinAISummaryUpdatedAt: timestamp("linkedin_ai_summary_updated_at"),
    scrapingStatus: text('scraping_status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export type DBLinkedInDataType = typeof linkedInDataTable.$inferSelect;
export type NewLinkedInData = typeof linkedInDataTable.$inferInsert;
