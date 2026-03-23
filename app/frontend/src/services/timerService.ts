import apiClient from "./apiClient";

/**
 * Start safety timer
 * @param minutes - Duration in minutes
 * @returns Timer data with expiry time
 */
export const startTimer = async (minutes: number) => {
  try {
    const response = await apiClient.post("/timer/start", { minutes });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Stop safety timer
 * @returns Success message
 */
export const stopTimer = async () => {
  try {
    const response = await apiClient.post("/timer/stop");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get timer status
 * @returns Timer status data
 */
export const getTimerStatus = async () => {
  try {
    const response = await apiClient.get("/timer/status");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
