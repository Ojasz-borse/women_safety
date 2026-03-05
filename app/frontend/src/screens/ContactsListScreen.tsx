import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function ContactsListScreen({ navigation }: any) {

    const [contacts, setContacts] = useState([
        {
            id: "1",
            name: "Mom",
            phone: "9876543210",
            relation: "Mother"
        },
        {
            id: "2",
            name: "Best Friend",
            phone: "9999999999",
            relation: "Friend"
        }
    ]);

    return (

        <View style={styles.container}>

            <Text style={styles.title}>Emergency Contacts</Text>

            <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
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