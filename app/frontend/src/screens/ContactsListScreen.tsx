import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { getContacts } from "../services/contactService";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ContactsListScreen({ navigation }: any) {

    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchContacts = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const token = await SecureStore.getItemAsync("token");
            if (token) {
                const response = await getContacts();
                if (response.success) {
                    setContacts(response.data);
                }
            } else {
                Alert.alert("Error", "Session expired, please login again");
                navigation.replace("Login");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch contacts");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchContacts(true);
    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>Emergency Contacts</Text>

            {loading && contacts.length === 0 ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <Text style={{ textAlign: "center", marginTop: 50, color: colors.lightText }}>
                            No emergency contacts found.
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.contactCard}
                            onPress={() => navigation.navigate("EditContact", { contact: item })}
                        >

                            <View>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.phone}>{item.phone}</Text>
                                <Text style={styles.relation}>{item.relation}</Text>
                            </View>

                            <MaterialIcons name="edit" size={22} color={colors.primary} />

                        </TouchableOpacity>
                    )}
                />
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("AddContact")}
            >

                <MaterialIcons name="add" size={30} color="white" />

            </TouchableOpacity>

        </View>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 20,
        color: colors.primary,
        letterSpacing: 0.5,
    },
    contactCard: {
        backgroundColor: colors.surface,
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    name: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 4,
    },
    phone: {
        color: colors.text,
        fontWeight: "500",
        marginBottom: 2,
        fontSize: 15,
    },
    relation: {
        color: colors.lightText,
        fontSize: 14,
    },
    addButton: {
        position: "absolute",
        bottom: 40,
        right: 30,
        backgroundColor: colors.primary,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});