import { z } from 'zod';
import { getLinkedInDataByUrl } from '../insert-scraping-data';
import { removeEmptyValues, removeKeyFromObject, removeLinks } from '../helpers';

// Define the Position schema
const PositionSchema = z.object({
    description: z.string(),
    description_html: z.string(),
    end_date: z.string(),
    meta: z.string(),
    start_date: z.string(),
    subtitle: z.string(),
    title: z.string(),
});

// Define the Experience schema
const ExperienceSchema = z.object({
    company: z.string(),
    company_id: z.string(),
    company_logo_url: z.string().nullable(),
    description_html: z.string().nullable(),
    end_date: z.string().optional(),
    location: z.string().optional(),
    start_date: z.string().optional(),
    title: z.string(),
    url: z.string(),
    duration: z.string().optional(),
    positions: z.array(PositionSchema).optional(),
});

// Define the Activity schema
const ActivitySchema = z.object({
    id: z.string(),
    img: z.string(),
    interaction: z.string(),
    link: z.string(),
    title: z.string(),
});

// Define the Education schema
const EducationSchema = z.object({
    degree: z.string(),
    description: z.string().nullable(),
    description_html: z.string().nullable(),
    field: z.string(),
    institute_logo_url: z.string(),
    title: z.string(),
    url: z.string(),
});

// Define the Certification schema
const CertificationSchema = z.object({
    credential_id: z.string().nullable(),
    credential_url: z.string(),
    meta: z.string(),
    subtitle: z.string(),
    title: z.string(),
});

// Define the SimilarProfile schema
const SimilarProfileSchema = z.object({
    name: z.string(),
    title: z.string().nullable(),
    url: z.string(),
    url_text: z.string(),
});

// Define the PeopleAlsoViewed schema
const PeopleAlsoViewedSchema = z.object({
    about: z.string().nullable(),
    location: z.string(),
    name: z.string(),
    profile_link: z.string(),
});

// Define the main ProfileData schema
const LinkedInProfileDataSchema = z.object({
    timestamp: z.string(),
    linkedin_num_id: z.string(),
    url: z.string(),
    name: z.string(),
    country_code: z.string(),
    city: z.string(),
    about: z.string(),
    followers: z.number(),
    connections: z.number(),
    position: z.string(),
    experience: z.array(ExperienceSchema).optional(),
    current_company: z.object({
        company_id: z.string(),
        name: z.string(),
        title: z.string(),
    }),
    current_company_name: z.string(),
    current_company_company_id: z.string(),
    posts: z.any(), // Replace 'any' with a more specific schema if needed
    activity: z.array(ActivitySchema),
    education: z.array(EducationSchema),
    educations_details: z.string(),
    courses: z.any(), // Replace 'any' with a more specific schema if needed
    certifications: z.array(CertificationSchema),
    honors_and_awards: z.any(), // Replace 'any' with a more specific schema if needed
    volunteer_experience: z.any(), // Replace 'any' with a more specific schema if needed
    organizations: z.any(), // Replace 'any' with a more specific schema if needed
    recommendations_count: z.any(), // Replace 'any' with a more specific schema if needed
    recommendations: z.any(), // Replace 'any' with a more specific schema if needed
    languages: z.any(), // Replace 'any' with a more specific schema if needed
    projects: z.any(), // Replace 'any' with a more specific schema if needed
    patents: z.any(), // Replace 'any' with a more specific schema if needed
    publications: z.any(), // Replace 'any' with a more specific schema if needed
    avatar: z.string(),
    default_avatar: z.boolean(),
    banner_image: z.string(),
    similar_profiles: z.array(SimilarProfileSchema),
    people_also_viewed: z.array(PeopleAlsoViewedSchema),
    memorialized_account: z.boolean(),
    input_url: z.string(),
    linkedin_id: z.string(),
    bio_links: z.array(z.any()), // Replace 'any' with a more specific schema if needed
});

// Example usage:
const LinkedInProfileData = LinkedInProfileDataSchema.array();

type LinkedInProfileDataT = {
    url: string; // This is the only required field
    timestamp?: string;
    linkedin_num_id?: string;
    name?: string;
    country_code?: string;
    city?: string;
    about?: string;
    followers?: number;
    connections?: number;
    position?: string;
    experience?: Array<{
        company?: string;
        company_id?: string;
        company_logo_url?: string | null;
        description_html?: string | null;
        end_date?: string;
        location?: string;
        start_date?: string;
        title?: string;
        url?: string;
        duration?: string;
        positions?: Array<{
            description?: string;
            description_html?: string;
            end_date?: string;
            meta?: string;
            start_date?: string;
            subtitle?: string;
            title?: string;
        }>;
    }>;
    current_company?: {
        company_id?: string;
        name?: string;
        title?: string;
    };
    current_company_name?: string;
    current_company_company_id?: string;
    posts?: any; // Replace 'any' with a more specific type if needed
    activity?: Array<{
        id?: string;
        img?: string;
        interaction?: string;
        link?: string;
        title?: string;
    }>;
    education?: Array<{
        degree?: string;
        description?: string | null;
        description_html?: string | null;
        field?: string;
        institute_logo_url?: string;
        title?: string;
        url?: string;
    }>;
    educations_details?: string;
    courses?: any; // Replace 'any' with a more specific type if needed
    certifications?: Array<{
        credential_id?: string | null;
        credential_url?: string;
        meta?: string;
        subtitle?: string;
        title?: string;
    }>;
    honors_and_awards?: any; // Replace 'any' with a more specific type if needed
    volunteer_experience?: any; // Replace 'any' with a more specific type if needed
    organizations?: any; // Replace 'any' with a more specific type if needed
    recommendations_count?: any; // Replace 'any' with a more specific type if needed
    recommendations?: any; // Replace 'any' with a more specific type if needed
    languages?: any; // Replace 'any' with a more specific type if needed
    projects?: any; // Replace 'any' with a more specific type if needed
    patents?: any; // Replace 'any' with a more specific type if needed
    publications?: any; // Replace 'any' with a more specific type if needed
    avatar?: string;
    default_avatar?: boolean;
    banner_image?: string;
    similar_profiles?: Array<{
        name?: string;
        title?: string | null;
        url?: string;
        url_text?: string;
    }>;
    people_also_viewed?: Array<{
        about?: string | null;
        location?: string;
        name?: string;
        profile_link?: string;
    }>;
    memorialized_account?: boolean;
    input_url?: string;
    linkedin_id?: string;
    bio_links?: Array<any>; // Replace 'any' with a more specific type if needed
};

/**
 * 
 * @param LinkedInUrl 
 * @returns 
 */
const linkedInAiDataParser = async (LinkedInUrl: string): Promise<Partial<LinkedInProfileDataT> | null> => {
    try {
        // remove all the links from the data (nested in the data)
        const scrapedData = await getLinkedInDataByUrl(LinkedInUrl)
        if (!scrapedData) return null;
        const data = scrapedData.linkedinData as JSON;

        let parsedData = removeLinks(data);
        parsedData = removeKeyFromObject(parsedData, ['id', 'description_html', 'input', 'timestamp', 'default_avatar', 'similar_profiles', 'current_company_name', 'memorialized_account', 'current_company_company_id', 'connections', 'people_also_viewed', 'recommendations_count', 'bio_links', 'location', 'educations_details']);
        // parse activvity
        if (Object.keys(parsedData).includes('activity') && parsedData.activity) {
            parsedData.activity = parsedData.activity.map((activity: any) => {
                if (!activity.title || activity.title === '') return null;
                if (!activity?.interaction || activity.interaction === '') return null;
                return {
                    title: activity.title,
                    interaction: activity?.interaction?.split(' by ')[0]?.toLowerCase(),
                }
            });
        }
        // parse education
        if (Object.keys(parsedData).includes('education') && parsedData.education) {
            parsedData.education = parsedData.education.map((education: any) => {
                // if title is null or not exist, remove it
                if (!education.title || education.title === '') {
                    return null;
                }
                return education;
            });
        }
        // remove empty values
        parsedData = removeEmptyValues(parsedData);

        return parsedData as Partial<LinkedInProfileDataT>;
    } catch (error) {
        console.error("Error <> linkedInAiDataParser", error);
        throw error;
    }
};


export { LinkedInProfileData, LinkedInProfileDataSchema, LinkedInProfileDataT, linkedInAiDataParser };
