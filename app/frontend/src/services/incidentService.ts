import apiClient from "./apiClient";

/**
 * Report an incident
 */
export const reportIncident = async (category: string, description: string, latitude: number, longitude: number) => {
    try {
        const response = await apiClient.post("/incidents/report", {
            category,
            description,
            latitude,
            longitude,
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Get heatmap data for unsafe area prediction
 */
export const getHeatmapData = async () => {
    try {
        const response = await apiClient.get("/incidents/heatmap");
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
