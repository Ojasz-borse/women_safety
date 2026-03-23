import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { login } from "../services/authService";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email, password });
      await SecureStore.setItemAsync("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      navigation.replace("HomeDashboard");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.background, "#150D28", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="shield" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to SafeGuard</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color={colors.lightText} style={styles.inputIcon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.lightText}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color={colors.lightText} style={styles.inputIcon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.lightText}
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={colors.lightText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.btnWrapper}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.button}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.register}>
            Don't have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSection: { alignItems: "center", paddingTop: 80, paddingBottom: 30 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 30, fontWeight: "900", color: colors.text, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: colors.lightText, marginTop: 6 },

  form: { flex: 1, paddingHorizontal: 24 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.text },
  forgot: { alignSelf: "flex-end", color: colors.secondary, marginBottom: 24, fontWeight: "600", fontSize: 14 },

  btnWrapper: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  button: { padding: 18, alignItems: "center" },
  buttonText: { color: colors.white, fontWeight: "800", fontSize: 18, letterSpacing: 0.5 },
  register: { textAlign: "center", color: colors.lightText, fontSize: 15, fontWeight: "500" },
});