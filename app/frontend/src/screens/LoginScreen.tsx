import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";

export default function LoginScreen({ navigation }: any) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.register}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 40,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  forgot: {
    alignSelf: "flex-end",
    color: colors.secondary,
    marginBottom: 30,
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 14,
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
  register: {
    marginTop: 24,
    textAlign: "center",
    color: colors.lightText,
    fontSize: 15,
    fontWeight: "500",
  },
});