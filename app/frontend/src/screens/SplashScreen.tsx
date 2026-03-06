import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function SplashScreen({ navigation }: any) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient
        colors={["#4C1D95", "#6C3CE1", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, alignItems: "center" }}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="shield" size={50} color={colors.white} />
        </View>
        <Text style={styles.logo}>SafeGuard</Text>
        <Text style={styles.tagline}>Your Safety Companion</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 44,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});