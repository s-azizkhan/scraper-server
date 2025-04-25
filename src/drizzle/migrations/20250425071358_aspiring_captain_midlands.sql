CREATE TYPE "public"."urlType" AS ENUM('profile', 'company', 'post', 'job');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash" varchar(255) NOT NULL,
	"creator" varchar(255) NOT NULL,
	"usage_limit" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_key_uasges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid,
	"usage_type" varchar(255) NOT NULL,
	"ref_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "linkedin_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"linkedin_url" text NOT NULL,
	"urlType" "urlType" DEFAULT 'profile',
	"prev_linkedin_data" jsonb DEFAULT '{}' NOT NULL,
	"linkedin_data" jsonb DEFAULT '{}' NOT NULL,
	"linkedin_ai_summary" text DEFAULT '' NOT NULL,
	"linkedin_ai_summary_status" text DEFAULT 'pending' NOT NULL,
	"linkedin_ai_summary_updated_at" timestamp,
	"scraping_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "website_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"website_url" text NOT NULL,
	"website_data" jsonb DEFAULT '{}' NOT NULL,
	"website_ai_summary" text DEFAULT '' NOT NULL,
	"website_ai_summary_status" text DEFAULT 'pending' NOT NULL,
	"website_ai_summary_updated_at" timestamp,
	"scraping_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "api_key_uasges" ADD CONSTRAINT "api_key_uasges_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;