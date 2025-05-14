const BRIGHTDATA_API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const BRIGHTDATA_WEBSITE_DATASET_ID = process.env.BRIGHTDATA_WEBSITE_DATASET_ID;
const BRIGHTDATA_LINKEDIN_DATASET_ID = process.env.BRIGHTDATA_LINKEDIN_DATASET_ID;
const BRIGHTDATA_BASE_URL = 'https://api.brightdata.com/datasets/v3';

if (!BRIGHTDATA_API_TOKEN) {
    console.warn("BRIGHTDATA_API_TOKEN environment variable is not set. Bright Data API calls will likely fail.");
}
if (!BRIGHTDATA_WEBSITE_DATASET_ID) {
    console.warn("BRIGHTDATA_WEBSITE_DATASET_ID environment variable is not set. Website scrapes will likely fail.");
}
if (!BRIGHTDATA_LINKEDIN_DATASET_ID) {
    console.warn("BRIGHTDATA_LINKEDIN_DATASET_ID environment variable is not set. LinkedIn scrapes will likely fail.");
}

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
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${BRIGHTDATA_API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(urls.map(u => ({ url: u })))
        // If the API expects a different format for batch URLs, this line will need adjustment.
        // For example, if it expects an array of objects directly: JSON.stringify(urls.map(u => ({url: u})))
    };

    let datasetId: string | undefined;
    const params: Record<string, string> = { include_errors: "true" };

    if (scrapeType === 'website') {
        datasetId = BRIGHTDATA_WEBSITE_DATASET_ID;
        params.custom_output_fields = "markdown|page_html|ld_json|html2text";
    } else if (scrapeType === 'linkedin') {
        datasetId = BRIGHTDATA_LINKEDIN_DATASET_ID;
    }

    if (!datasetId) {
        throw new Error(`Dataset ID for scrape type '${scrapeType}' is not configured.`);
    }
    params.dataset_id = datasetId;

    const reqUrl = buildBrightDataUrl("trigger", params);
    const response = await fetch(reqUrl, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger scrape: ${response.status} ${errorText}`);
    }
    return response.json() as Promise<TriggerResponse>;
}

async function checkScrapeProgress(snapshotId: string): Promise<ProgressResponse> {
    const options = {
        method: 'GET',
        headers: { Authorization: `Bearer ${BRIGHTDATA_API_TOKEN}` }
    };

    const reqUrl = buildBrightDataUrl(`progress/${snapshotId}`)
    const response = await fetch(reqUrl, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check scrape progress: ${response.status} ${errorText}`);
    }
    return response.json() as Promise<ProgressResponse>;
}

async function fetchScrapeData(snapshotId: string, responseFormat: "json" | "ndjson" | "jsonl" | "csv" = "json"): Promise<SnapshotResponse> {
    const options = {
        method: 'GET',
        headers: { Authorization: `Bearer ${BRIGHTDATA_API_TOKEN}` }
    };

    const reqUrl = buildBrightDataUrl(`snapshot/${snapshotId}`, { format: responseFormat, compress: "true" })
    const response = await fetch(reqUrl, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch scrape data: ${response.status} ${errorText}`);
    }
    return response.json() as Promise<SnapshotResponse>;
}

export async function scrapeUrlWithBrightData(urlsToScrape: string[], scrapeType: ScrapeTypeEnum): Promise<SnapshotResponse> {
    if (!BRIGHTDATA_API_TOKEN) {
        throw new Error("BRIGHTDATA_API_TOKEN is not configured.");
    }
    if (scrapeType === 'website' && !BRIGHTDATA_WEBSITE_DATASET_ID) {
        throw new Error("BRIGHTDATA_WEBSITE_DATASET_ID is not configured for website scrape.");
    }
    if (scrapeType === 'linkedin' && !BRIGHTDATA_LINKEDIN_DATASET_ID) {
        throw new Error("BRIGHTDATA_LINKEDIN_DATASET_ID is not configured for linkedin scrape.");
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