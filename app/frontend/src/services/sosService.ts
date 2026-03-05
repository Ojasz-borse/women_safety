import apiClient from "./apiClient";
import { Linking, Platform } from "react-native";

/**
 * Trigger SOS alert — calls backend API which sends SMS via Twilio
 * Also attempts native SMS as backup if backend reports SMS failures
 */
export const triggerSOS = async (latitude: number, longitude: number, address: string) => {
  try {
    const response = await apiClient.post("/sos/trigger", { latitude, longitude, address });
    const data = response.data;

    // If backend Twilio didn't deliver all SMS, try native SMS fallback
    if (data.smsSentCount !== undefined && data.smsSentCount < data.smsTotalCount) {
      console.log(`Backend delivered ${data.smsSentCount}/${data.smsTotalCount} SMS. Attempting native fallback...`);
      await sendNativeSMSFallback(latitude, longitude, address);
    }

    return data;
  } catch (error: any) {
    // If backend is completely unreachable, try native SMS
    console.log("Backend SOS failed, trying native SMS...");
    await sendNativeSMSFallback(latitude, longitude, address);
    throw error.response?.data || error.message;
  }
};

/**
 * Native SMS fallback — opens the phone's SMS app with pre-filled message
 * Works even when the server is completely offline
 */
const sendNativeSMSFallback = async (latitude: number, longitude: number, address: string) => {
  try {
    // Get emergency contacts from API (might fail if offline)
    let contacts: { phone: string }[] = [];
    try {
      const res = await apiClient.get("/contacts");
      contacts = (Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { }

    if (contacts.length === 0) return;

    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY SOS! I need help! Location: ${address}. Map: ${mapLink}`;
    const phones = contacts.map((c: any) => c.phone).join(",");

    // Use SMS URI scheme to auto-open SMS with all contacts
    const separator = Platform.OS === "ios" ? "&" : "?";
    const smsUrl = `sms:${phones}${separator}body=${encodeURIComponent(message)}`;

    const supported = await Linking.canOpenURL(smsUrl);
    if (supported) {
      await Linking.openURL(smsUrl);
    }
  } catch (err) {
    console.log("Native SMS fallback failed:", err);
  }
};

/**
 * Get SOS status/history
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
 */
export const updateSOSLocation = async (alertId: string, latitude: number, longitude: number, address: string) => {
  try {
    const response = await apiClient.put("/sos/update-location", { alertId, latitude, longitude, address });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Resolve SOS alert
 */
export const resolveSOS = async (alertId: string, note: string) => {
  try {
    const response = await apiClient.post("/sos/resolve", { alertId, note });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Cancel SOS alert
 */
export const cancelSOS = async (alertId: string) => {
  try {
    const response = await apiClient.post("/sos/cancel", { alertId });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get nearby services
 */
export const getNearbyServices = async (latitude: number, longitude: number, type: string) => {
  try {
    const response = await apiClient.get("/sos/services", { params: { lat: latitude, lng: longitude, type } });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};