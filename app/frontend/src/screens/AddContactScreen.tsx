import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import * as SecureStore from "expo-secure-store";
import { addContact } from "../services/contactService";

export default function AddContactScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim() || !relation.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Error", "Session expired");
        navigation.replace("Login");
        return;
      }

      const response = await addContact({
        name: name.trim(),
        phone: phone.trim(),
        relation: relation.trim(),
      });

      if (response.success) {
        Alert.alert("Success", "Contact added successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Contact</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color={colors.lightText} />
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={colors.lightText}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color={colors.lightText} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={colors.lightText}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="people" size={20} color={colors.lightText} />
          <TextInput
            style={styles.input}
            placeholder="Relation (e.g. Mom, Friend)"
            placeholderTextColor={colors.lightText}
            value={relation}
            onChangeText={setRelation}
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, (loading || !name || !phone || !relation) && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.addButtonText}>Add Contact</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  form: { margin: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 25 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
});

