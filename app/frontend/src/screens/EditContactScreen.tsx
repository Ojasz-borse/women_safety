import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import * as SecureStore from "expo-secure-store";
import { updateContact, deleteContact } from "../services/contactService";

export default function EditContactScreen({ navigation, route }: any) {
  const { contact } = route.params || {};
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [relation, setRelation] = useState(contact?.relation || "");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async () => {
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
      const response = await updateContact(contact._id, {
        name: name.trim(),
        phone: phone.trim(),
        relation: relation.trim(),
      });
      if (response.success) {
        Alert.alert("Success", "Contact updated!");
        navigation.goBack();
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update contact");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await SecureStore.getItemAsync("token");
              if (!token) {
                Alert.alert("Error", "Session expired");
                navigation.replace("Login");
                return;
              }
              const response = await deleteContact(contact._id);
              if (response.success) {
                Alert.alert("Success", "Contact removed!");
                navigation.goBack();
              } else {
                Alert.alert("Error", response.message);
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete contact");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Contact</Text>
        <TouchableOpacity onPress={handleDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="delete" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color={colors.lightText} />
          <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.lightText} value={name} onChangeText={setName} />
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color={colors.lightText} />
          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={colors.lightText} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="people" size={20} color={colors.lightText} />
          <TextInput style={styles.input} placeholder="Relation" placeholderTextColor={colors.lightText} value={relation} onChangeText={setRelation} />
        </View>
        <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  form: { margin: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 25 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, paddingVertical: 15, paddingHorizontal: 10, fontSize: 16, color: colors.text },
  saveButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 10 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
});

