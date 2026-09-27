export const parsePropertyImages = (imagesData: any, propertyId: string): string[] => {
    if (!imagesData) return ["/images/placeholder.png"];

    try {
        const images = typeof imagesData === "string"
            ? JSON.parse(imagesData)
            : imagesData;

        if (!Array.isArray(images)) {
            return ["/images/placeholder.png"];
        }

        return images.map((img: any) => {
            if (typeof img !== "string") return "/images/placeholder.png";

            // Handle existing service URLs
            if (img.startsWith("/api/images/")) {
                return img;
            }

            // Extract filename from any path format
            let filename = img;
            if (img.includes('/')) {
                const pathParts = img.split('/');
                filename = pathParts[pathParts.length - 1];
            }

            // Route through image service
            return `/api/images/serve/${propertyId}/${filename}`;
        });
    } catch (error) {
        console.error(`Failed to parse images for property ${propertyId}:`, error);
        return ["/images/placeholder.png"];
    }
};

export const parsePropertyFeatures = (featuresData: any): any => {
    if (!featuresData) return {};
    try {
        return typeof featuresData === "string"
            ? JSON.parse(featuresData)
            : featuresData;
    } catch (e) {
        return {};
    }
};
