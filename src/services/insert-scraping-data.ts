import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { DBLinkedInDataType, linkedInDataTable, LinkedinUrlTypeEnum, websiteDataTable } from "../drizzle/schema";
import { LinkedInProfileDataT } from "./scrapers/linkedin-profile";

type LinkedinScrapingData = {
    url: string;
    data: JSON;
}

async function getLinkedinScrapingDataByUrlType(urlType: LinkedinUrlTypeEnum, scrapingStatus: string = "pending", limit: number = 10, offset: number = 0): Promise<DBLinkedInDataType[]> {
    try {
        const result = await db
            .select()
            .from(linkedInDataTable)
            .where(eq(linkedInDataTable.urlType, urlType) && eq(linkedInDataTable.scrapingStatus, scrapingStatus))
            .limit(limit)
            .offset(offset)
            .execute();

        return result;
    } catch (error) {
        console.error(error);
        throw new Error("Error fetching LinkedIn scraping data");
    }
}

async function getLinkedInDataByUrl(url: string): Promise<DBLinkedInDataType | null> {
    try {
        const result = await db
            .select()
            .from(linkedInDataTable)
            .where(eq(linkedInDataTable.linkedinUrl, url))
            .limit(1)
            .execute();

        return result[0] || null;
    } catch (error) {
        console.error(error);
        throw new Error("Error fetching LinkedIn data by URL");
    }
}

async function inserLinkedinScrapingData(linkedinUrls: string[], urlType: LinkedinUrlTypeEnum, scrapingStatus: string = "pending") {
    try {
        const insertData = linkedinUrls.map((url) => ({
            linkedinUrl: url,
            urlType,
            scrapingStatus,
        }))
        await db.insert(linkedInDataTable).values(insertData);
    } catch (error) {
        console.error(error);
        throw new Error("Error inserting LinkedIn scraping data");
    }
}


async function updateLinkedinScrapingData(linkedinUrlsWithData: LinkedInProfileDataT[], scrapingStatus: string) {
    try {
        const updatePromises = linkedinUrlsWithData?.map((urlData) =>
            db.update(linkedInDataTable)
                .set({
                    linkedinData: urlData,
                    scrapingStatus,
                })
                .where(eq(linkedInDataTable.linkedinUrl, urlData.url))
                .returning()
        );
        const [data] = await Promise.all(updatePromises);
        return data;
    } catch (error) {
        console.error(error);
        throw new Error("Error updating LinkedIn scraping data");
    }
}

async function insertWebsiteScrapingData(urls: string[], scrapingStatus: string = "pending", websiteData: Record<string, any> = {}) {
    try {
        const insertData = urls.map((url) => ({
            websiteUrl: url,
            scrapingStatus,
            websiteData,
        }))
        await db.insert(websiteDataTable).values(insertData);
    } catch (error) {
        console.error(error);
        throw new Error("Error inserting website scraping data");
    }
}



export { inserLinkedinScrapingData, updateLinkedinScrapingData, insertWebsiteScrapingData, getLinkedInDataByUrl, getLinkedinScrapingDataByUrlType };
