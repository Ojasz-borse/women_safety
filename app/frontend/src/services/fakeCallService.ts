import apiClient from "./apiClient";

/**
 * Schedule a fake call
 */
export const scheduleFakeCall = async (callerName: string, delaySeconds: number) => {
    try {
        const response = await apiClient.post("/fakeCall/schedule", {
            callerName,
            delaySeconds,
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
