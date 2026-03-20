import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert
} from "react-native";

import { colors } from "../theme/colors";

export default function EditContactScreen({ route, navigation }: any) {

    const { contact } = route.params;

    const [name, setName] = useState(contact.name);
    const [phone, setPhone] = useState(contact.phone);
    const [relation, setRelation] = useState(contact.relation);

    const updateContact = () => {

        Alert.alert("Updated", "Contact updated");

        navigation.goBack();

    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>Edit Contact</Text>

            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
            />

            <TextInput
                style={styles.input}
                value={relation}
                onChangeText={setRelation}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={updateContact}
            >

                <Text style={styles.buttonText}>
                    Update Contact
                </Text>

            </TouchableOpacity>

        </View>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 25,
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
    button: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
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