import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import * as Contacts from "expo-contacts";

export default function ContactPermissionsScreen({ navigation }: any) {
  const requestPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      navigation.navigate("ContactsList");
    }
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name="contacts" size={80} color={colors.primary} />
      <Text style={styles.title}>Access Contacts</Text>
      <Text style={styles.subtitle}>We need access to your contacts to add emergency contacts</Text>
      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>Allow Access</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 20 },
  subtitle: { fontSize: 14, color: colors.lightText, textAlign: "center", marginTop: 10, marginBottom: 30 },
  button: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  skipButton: { marginTop: 20 },
  skipText: { color: colors.lightText, fontSize: 16 },
});

