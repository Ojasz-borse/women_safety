import apiClient from "./apiClient";

/**
 * Trigger SOS alert
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @param address - Current address
 * @returns Alert ID and success status
 */
export const triggerSOS = async (latitude: number, longitude: number, address: string) => {
  try {
    const response = await apiClient.post(
      "/sos/trigger",
      {
        latitude,
        longitude,
        address,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get SOS status/history
 * @returns List of SOS alerts
 */
export const getSOSStatus = async () => {
  try {
    const response = await apiClient.get("/sos/status");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update SOS location
 * @param alertId - Alert ID
 * @param latitude - New latitude
 * @param longitude - New longitude
 * @param address - New address
 * @returns Updated location data
 */
export const updateSOSLocation = async (
  alertId: string,
  latitude: number,
  longitude: number,
  address: string
) => {
  try {
    const response = await apiClient.put(
      "/sos/update-location",
      {
        alertId,
        latitude,
        longitude,
        address,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Resolve SOS alert
 * @param alertId - Alert ID
 * @param note - Resolution note
 * @returns Updated alert data
 */
export const resolveSOS = async (alertId: string, note: string) => {
  try {
    const response = await apiClient.post(
      "/sos/resolve",
      {
        alertId,
        note,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Cancel SOS alert
 * @param alertId - Alert ID
 * @returns Success message
 */
export const cancelSOS = async (alertId: string) => {
  try {
    const response = await apiClient.post(
      "/sos/cancel",
      {
        alertId,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get nearby services (police, hospitals, etc.)
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @param type - Type of service (police_station, hospital, etc.)
 * @returns List of nearby services
 */
export const getNearbyServices = async (
  latitude: number,
  longitude: number,
  type: string
) => {
  try {
    const response = await apiClient.get("/sos/services", {
      params: { lat: latitude, lng: longitude, type },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};