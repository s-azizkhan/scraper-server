/**
 * Recursively removes all links from an object by setting them to null
 * Works with nested objects and arrays
 */
export const removeLinks = (obj: any): any => {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => removeLinks(item));
    }

    if (typeof obj === 'object') {
        const newObj: any = {};

        for (const key in obj) {
            // Skip prototype chain properties
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

            // If property contains 'link', 'url', or 'href', set to null
            if (key.toLowerCase().includes('link') ||
                key.toLowerCase().includes('url') ||
                key.toLowerCase().includes('href')) {
                delete newObj[key];
            } else {
                // Check if value is a string containing link-related terms
                if (typeof obj[key] === 'string' &&
                    (obj[key].toLowerCase().includes('http') ||
                        obj[key].toLowerCase().includes('www.') ||
                        obj[key].toLowerCase().includes('://'))
                ) {
                    delete newObj[key];
                } else {
                    // Recursively process nested objects/arrays
                    newObj[key] = removeLinks(obj[key]);
                }
            }
        }

        return newObj;
    }

    return obj;
};

/**
 * Recursively removes all keys from an object by setting them to null
 * Works with nested objects and arrays
 */
export const removeKeyFromObject = (obj: any, keys: string[]): any => {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => removeKeyFromObject(item, keys));
    }

    if (typeof obj === 'object') {
        const newObj: any = {};

        for (const k in obj) {
            // Skip prototype chain properties
            if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;

            // If property is the key, skip it
            if (keys.includes(k)) {
                continue;
            }

            // Recursively process nested objects/arrays
            newObj[k] = removeKeyFromObject(obj[k], keys);

        }
        return newObj;
    }
    return obj;
}

/**
 * Recursively removes all empty values from an object
 * Works with nested objects and arrays
 */
export const removeEmptyValues = (obj: any): any => {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => removeEmptyValues(item)).filter(Boolean);
    }

    if (typeof obj === 'object') {
        const newObj: any = {};

        for (const k in obj) {
            // Skip prototype chain properties
            if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;

            // Recursively process nested objects/arrays
            const value = removeEmptyValues(obj[k]);

            // If the value is not empty, add it to the new object
            if (value !== undefined && value !== null && value !== '' && value !== "-") {
                newObj[k] = value;
            }
        }
        return newObj;
    }
    return obj;
}