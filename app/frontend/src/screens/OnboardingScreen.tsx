import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";

export default function OnboardingScreen({ navigation }: any) {

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Stay Safe Anytime</Text>

      <Text style={styles.subtitle}>
        Share location and alert emergency contacts instantly.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 16,
    textAlign: "center",
    color: colors.lightText,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 48,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});