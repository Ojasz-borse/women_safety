import apiClient from "./apiClient";

/**
 * Get high-risk zones
 * @returns List of high-risk zones
 */
export const getHighRiskZones = async () => {
  try {
    const response = await apiClient.get("/routes/high-risk-zones");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get safe route to destination
 * @param origin - Starting location
 * @param destination - Destination
 * @returns Safe route data
 */
export const getSafeRoute = async (origin: string, destination: string) => {
  try {
    const response = await apiClient.post("/routes/safe", {
      origin,
      destination,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get heatmap data (incident reports)
 * @returns Heatmap data with incidents
 */
export const getHeatmapData = async () => {
  try {
    const response = await apiClient.get("/incidents/heatmap");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Report an incident
 * @param category - Incident category
 * @param description - Incident description
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Created incident data
 */
export const reportIncident = async (
  category: string,
  description: string,
  latitude: number,
  longitude: number
) => {
  try {
    const response = await apiClient.post("/incidents/report", {
      category,
      description,
      latitude,
      longitude,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get nearby safe places
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @returns List of nearby safe places
 */
export const getNearbySafePlaces = async (
  latitude: number,
  longitude: number
) => {
  try {
    const response = await apiClient.get("/safe-places/nearby", {
      params: { latitude, longitude },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
