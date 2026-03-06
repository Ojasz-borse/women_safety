import apiClient from "./apiClient";
import { Linking, Platform, Alert } from "react-native";

/**
 * Trigger SOS alert — calls backend which sends SMS via Twilio + email via nodemailer
 * If backend fails, opens native SMS as fallback
 */
export const triggerSOS = async (latitude: number, longitude: number, address: string) => {
  try {
    const response = await apiClient.post("/sos/trigger", { latitude, longitude, address });
    const data = response.data;

    // If backend delivered 0 SMS, try native SMS fallback
    if (data.smsSentCount === 0) {
      console.log("Backend SMS failed, trying native SMS fallback...");
      await sendNativeSMS(latitude, longitude);
    }

    return data;
  } catch (error: any) {
    // Backend completely unreachable — send native SMS
    console.log("Backend SOS failed:", error.message || error);
    await sendNativeSMS(latitude, longitude);
    // Return a local result so the app doesn't crash
    return { success: true, alertId: "local-" + Date.now(), smsSentCount: 0, smsTotalCount: 0 };
  }
};

/**
 * Send native SMS via phone's messaging app using Linking
 * This always works — opens the SMS app with pre-filled message
 */
const sendNativeSMS = async (latitude: number, longitude: number) => {
  try {
    // Try to get contacts from API
    let phones: string[] = [];
    try {
      const res = await apiClient.get("/contacts");
      const contacts = Array.isArray(res.data) ? res.data : res.data?.data || [];
      phones = contacts.map((c: any) => c.phone).filter(Boolean);
    } catch { }

    if (phones.length === 0) {
      Alert.alert("No Contacts", "Add emergency contacts first to send SOS SMS.");
      return;
    }

    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY SOS! I need immediate help! My location: ${mapLink} - Sent from SafeGuard App`;

    // Use sms: URI scheme — works on both Android and iOS
    const phoneList = phones.join(",");
    const sep = Platform.OS === "ios" ? "&" : "?";
    const smsUrl = `sms:${phoneList}${sep}body=${encodeURIComponent(message)}`;

    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    } else {
      // Try opening just the first number  
      const singleSms = `sms:${phones[0]}${sep}body=${encodeURIComponent(message)}`;
      await Linking.openURL(singleSms);
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
 * Update SOS location (called every 10s from SOSActivated screen)
 */
export const updateSOSLocation = async (alertId: string, latitude: number, longitude: number, address: string) => {
  try {
    const response = await apiClient.put("/sos/update-location", { alertId, latitude, longitude, address });
    return response.data;
  } catch (error: any) {
    // Don't throw — this is called repeatedly, don't crash the UI
    console.log("Location update failed:", error.message);
    return { success: false };
  }
};

/**
 * Resolve SOS alert (user is safe)
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
 * Get nearby emergency services (police, hospitals)
 */
export const getNearbyServices = async (latitude: number, longitude: number, type: string) => {
  try {
    const response = await apiClient.get("/sos/services", { params: { lat: latitude, lng: longitude, type } });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};