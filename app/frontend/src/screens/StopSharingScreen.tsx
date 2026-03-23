import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { stopLocationSharing } from "../services/locationService";

export default function StopSharingScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      await stopLocationSharing();
      await AsyncStorage.setItem("locationSharing", "false");
      Alert.alert("Success", "Location sharing stopped", [
        { text: "OK", onPress: () => navigation.navigate("HomeDashboard") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to stop sharing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name="location-off" size={80} color={colors.danger} />
      <Text style={styles.title}>Stop Sharing</Text>
      <Text style={styles.subtitle}>Your location is currently being shared with your emergency contacts</Text>
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleStop} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Stop Sharing</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 20 },
  subtitle: { fontSize: 14, color: colors.lightText, textAlign: "center", marginTop: 10, marginBottom: 30 },
  button: { backgroundColor: colors.danger, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  cancelButton: { marginTop: 20 },
  cancelText: { color: colors.lightText, fontSize: 16 },
});

