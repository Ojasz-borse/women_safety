import apiClient from "./apiClient";

/**
 * Start live location sharing
 * @returns Success message
 */
export const startLocationSharing = async () => {
  try {
    const response = await apiClient.post("/location/start-sharing");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Stop live location sharing
 * @returns Success message
 */
export const stopLocationSharing = async () => {
  try {
    const response = await apiClient.post("/location/stop-sharing");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update current location
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @returns Updated location data
 */
export const updateLocation = async (latitude: number, longitude: number) => {
  try {
    const response = await apiClient.post("/location/update", {
      latitude,
      longitude,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get user's live location (for contacts)
 * @param userId - User ID to fetch location for
 * @returns Location data
 */
export const getUserLocation = async (userId: string) => {
  try {
    const response = await apiClient.get(`/location/${userId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get location sharing status
 * @returns Sharing status
 */
export const getLocationSharingStatus = async () => {
  try {
    // Fetch current user's location sharing status
    const response = await apiClient.get("/location/status");
    return response.data;
  } catch (error: any) {
    // If endpoint doesn't exist, we can infer from updateLocation being called
    throw error.response?.data || error.message;
  }
};
