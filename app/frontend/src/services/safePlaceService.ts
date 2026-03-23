import apiClient from "./apiClient";

/**
 * Get nearby safe places
 */
export const getNearbyHelp = async (latitude: number, longitude: number) => {
    try {
        const response = await apiClient.get("/safe-places/nearby", {
            params: { latitude, longitude },
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Get nearby services (police, hospital, etc.)
 */
export const getNearbyServices = async (lat: number, lng: number, type: string) => {
    try {
        const response = await apiClient.get(`/services/${type}`, {
            params: { lat, lng },
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
