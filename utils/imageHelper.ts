import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

/**
 * Normalizes image URLs to ensure they are absolute and point to the correct server.
 * Handles relative paths (e.g., /files/...) and legacy hardcoded IPs.
 * 
 * @param url - The image URL to fix
 * @returns The fixed absolute URL string
 */
export const fixUrl = (url?: string) => {
    if (!url) {
        // console.log("fixUrl: URL is null/empty");
        return "";
    }

    console.log("fixUrl input:", url);

    // Handle localhost URLs (replace with API_BASE_URL)
    if (url.includes("localhost")) {
        const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");
        const parts = url.split("/files/");
        if (parts.length > 1) {
            const newUrl = `${cleanBaseUrl}/files/${parts[parts.length - 1]}`;
            console.log("fixUrl replaced localhost:", newUrl);
            return newUrl;
        }
    }

    // If it's already a complete http/https URL
    if (url.startsWith("http")) {
        // Check if it contains the old hardcoded IP and replace it if needed
        // This maintains backward compatibility if the DB has old IPs
        if (url.includes("147.93.30.41")) {
            const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");
            // Extract the path part
            const parts = url.split("/files/");
            if (parts.length > 1) {
                return `${cleanBaseUrl}/files/${parts[parts.length - 1]}`;
            }
        }
        return url;
    }

    // Handle relative paths
    const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");

    if (url.startsWith("/")) {
        console.log("fixUrl relative path:", `${cleanBaseUrl}${url}`);
        return `${cleanBaseUrl}${url}`;
    }

    // Ensure we don't double slash if the url doesn't start with /
    // but we want to assume it's a file path if not http
    const finalUrl = `${cleanBaseUrl}/${url}`;
    console.log("fixUrl implicit relative:", finalUrl);
    return finalUrl;
};
