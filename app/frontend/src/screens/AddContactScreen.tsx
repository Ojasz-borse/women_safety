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

export default function AddContactScreen({ navigation }: any) {

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [relation, setRelation] = useState("");

    const saveContact = () => {

        if (!name || !phone) {
            Alert.alert("Error", "Please fill required fields");
            return;
        }

        console.log({ name, phone, relation });

        Alert.alert("Success", "Contact Added");

        navigation.goBack();

    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>Add Emergency Contact</Text>

            <TextInput
                placeholder="Name"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <TextInput
                placeholder="Phone Number"
                keyboardType="phone-pad"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
            />

            <TextInput
                placeholder="Relation"
                style={styles.input}
                value={relation}
                onChangeText={setRelation}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={saveContact}
            >

                <Text style={styles.buttonText}>Save Contact</Text>

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