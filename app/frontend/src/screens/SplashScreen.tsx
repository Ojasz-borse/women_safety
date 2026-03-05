import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function SplashScreen({ navigation }: any) {

  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SafeHer</Text>
      <Text style={styles.tagline}>Your Safety Companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  tagline: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 12,
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});