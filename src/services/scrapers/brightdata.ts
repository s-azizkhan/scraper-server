import { z } from 'zod';
import { up } from "up-fetch";
import { LinkedInProfileDataSchema, LinkedInProfileDataT } from './linkedin-profile';

const BRIGHTDATA_API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const BRIGHTDATA_WEBSITE_DATASET_ID = process.env.BRIGHTDATA_WEBSITE_DATASET_ID;
const BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID = process.env.BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID;
const BRIGHTDATA_BASE_URL = 'https://api.brightdata.com/datasets/v3';

if (!BRIGHTDATA_API_TOKEN) {
    console.warn("BRIGHTDATA_API_TOKEN environment variable is not set. Bright Data API calls will likely fail.");
}
if (!BRIGHTDATA_WEBSITE_DATASET_ID) {
    console.warn("BRIGHTDATA_WEBSITE_DATASET_ID environment variable is not set. Website scrapes will likely fail.");
}
if (!BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID) {
    console.warn("BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID environment variable is not set. LinkedIn scrapes will likely fail.");
}

const brightDataUp = up(fetch, () => ({
    baseUrl: BRIGHTDATA_BASE_URL,
    timeout: 30000,
    headers: { Authorization: `Bearer ${BRIGHTDATA_API_TOKEN}`, 'Content-Type': 'application/json' }
}))

export enum ScrapeTypeEnum {
    website = 'website',
    linkedin = 'linkedin'
};

interface TriggerResponse {
    snapshot_id: string;
}

interface ProgressResponse {
    snapshot_id: string;
    dataset_id: string;
    status: 'running' | 'ready' | 'failed';
}

interface SnapshotResponse {
    // Define based on expected data structure, for now, keep it generic
    [key: string]: any;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


function buildBrightDataUrl(url: string, params: Record<string, string> = {}): string {
    const urlObj = new URL(`${BRIGHTDATA_BASE_URL}/${url}`);
    Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));
    return urlObj.toString();
}

async function triggerScrape(urls: string[], scrapeType: ScrapeTypeEnum): Promise<TriggerResponse> {
    let datasetId: string | undefined;
    const params: Record<string, string> = { include_errors: "true" };

    if (scrapeType === 'website') {
        datasetId = BRIGHTDATA_WEBSITE_DATASET_ID;
        params.custom_output_fields = "markdown|page_html|ld_json|html2text";
    } else if (scrapeType === 'linkedin') {
        datasetId = BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID;
    }

    if (!datasetId) {
        throw new Error(`Dataset ID for scrape type '${scrapeType}' is not configured.`);
    }
    params.dataset_id = datasetId;

    try {

        const res = await brightDataUp("trigger", {
            method: "POST",
            params: { ...params },
            body: urls.map(u => ({ url: u }))
        })

        return res as unknown as TriggerResponse; // TODO: fix this type hint
    } catch (e) {
        console.error(`Error from triggerScrape: ${e}`)
        throw e
    }
}

async function checkScrapeProgress(snapshotId: string): Promise<ProgressResponse> {
    try {
        const response = await brightDataUp(`progress/${snapshotId}`);
        return response as unknown as ProgressResponse;
    } catch (e) {
        console.error(`Error from checkScrapeProgress: ${e}`)
        throw e
    }
}
export async function fetchScrapeData(snapshotId: string, responseFormat: "json" | "ndjson" | "jsonl" | "csv" = "json"): Promise<LinkedInProfileDataT[]> {
    try {
        const response = await brightDataUp(`/snapshot/${snapshotId}`, {
            method: "GET",
            params: {
                format: responseFormat,
                // compress: "true"
            },
            headers: {
                Authorization: `Bearer ${BRIGHTDATA_API_TOKEN}`
            },
            // schema: z.array(LinkedInProfileDataSchema),
        });

        return response as unknown as LinkedInProfileDataT[]; // TODO: fix this type hin
    } catch (e) {
        console.error(`Error from fetchScrapeData: ${e}`)
        throw e
    }
}

export async function scrapeUrlWithBrightData(urlsToScrape: string[], scrapeType: ScrapeTypeEnum): Promise<unknown[]> {
    if (!BRIGHTDATA_API_TOKEN) {
        throw new Error("BRIGHTDATA_API_TOKEN is not configured.");
    }
    if (scrapeType === 'website' && !BRIGHTDATA_WEBSITE_DATASET_ID) {
        throw new Error("BRIGHTDATA_WEBSITE_DATASET_ID is not configured for website scrape.");
    }
    if (scrapeType === 'linkedin' && !BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID) {
        throw new Error("BRIGHTDATA_LINKEDIN_PROFILE_DATASET_ID is not configured for linkedin scrape.");
    }

    console.log(`Triggering ${scrapeType} scrape for ${urlsToScrape.length} URLs: ${urlsToScrape.join(', ')}`);
    const triggerResponse = await triggerScrape(urlsToScrape, scrapeType);
    const snapshotId = triggerResponse.snapshot_id;
    console.log(`Scrape triggered. Snapshot ID: ${snapshotId}`);

    let progress: ProgressResponse;
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes (60 attempts * 5 seconds)

    do {
        if (attempts > 0) {
            await delay(5000); // Wait 5 seconds before checking again
        }
        console.log(`Checking progress for snapshot ID: ${snapshotId} (Attempt ${attempts + 1})`);
        progress = await checkScrapeProgress(snapshotId);
        console.log(`Current status: ${progress.status}`);
        attempts++;
    } while (progress.status === 'running' && attempts < maxAttempts);

    if (progress.status === 'ready') {
        console.log(`Scrape ready for snapshot ID: ${snapshotId}. Fetching data...`);
        return fetchScrapeData(snapshotId);
    } else if (progress.status === 'failed') {
        throw new Error(`Scrape failed for snapshot ID: ${snapshotId}`);
    } else {
        throw new Error(`Scrape timed out or entered an unknown state for snapshot ID: ${snapshotId}. Status: ${progress.status}`);
    }
}