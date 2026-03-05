import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function HomeDashboardScreen({ navigation }: any) {

    return (

        <SafeAreaView style={styles.container}>

            {/* Header */}

            <View style={styles.header}>

                <View>
                    <Text style={styles.greeting}>Hello</Text>
                    <Text style={styles.username}>Stay Safe</Text>
                </View>

              <TouchableOpacity
style={styles.profileIcon}
onPress={()=>navigation.navigate("Profile")}
>
<MaterialIcons name="person" size={28} color="white" />
</TouchableOpacity>
            </View>


            {/* SOS BUTTON */}

            <View style={styles.sosContainer}>

                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={() => navigation.navigate("SOSCountdown")}
                >

                    <Text style={styles.sosText}>SOS</Text>

                </TouchableOpacity>

                <Text style={styles.sosHint}>
                    Tap in emergency
                </Text>

            </View>


            {/* Quick Actions */}

            <Text style={styles.sectionTitle}>
                Quick Actions
            </Text>

            <View style={styles.quickActions}>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("EmergencyCall")}
                >

                    <MaterialIcons name="call" size={30} color={colors.primary} />
                    <Text style={styles.actionText}>Call</Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("LiveLocationMap")}
                >
                    <MaterialIcons name="location-on" size={30} color={colors.primary} />
                    <Text style={styles.actionText}>Share Location</Text>

                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("SearchDestination")}
                >

                    <MaterialIcons
                        name="directions"
                        size={30}
                        color={colors.primary}
                    />

                    <Text style={styles.actionText}>
                        Safe Route
                    </Text>

                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("ContactsList")}
                >
                    <MaterialIcons name="people" size={30} color={colors.primary} />
                    <Text style={styles.actionText}>Contacts</Text>
                </TouchableOpacity>

            </View>


            {/* Safety Tip */}

            <View style={styles.tipCard}>

                <MaterialIcons name="info" size={22} color={colors.primary} />

                <Text style={styles.tipText}>
                    Always share your live location with trusted contacts when traveling alone.
                </Text>

            </View>


        </SafeAreaView>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 25,
        paddingTop: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 10,
    },
    greeting: {
        fontSize: 16,
        color: colors.lightText,
        fontWeight: "500",
    },
    username: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.text,
        letterSpacing: 0.5,
    },
    profileIcon: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 28,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    sosContainer: {
        alignItems: "center",
        marginTop: 50,
        marginBottom: 40,
    },
    sosButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: colors.danger,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 6,
        borderColor: "rgba(239,68,68,0.3)",
    },
    sosText: {
        color: colors.white,
        fontSize: 52,
        fontWeight: "900",
        letterSpacing: 2,
    },
    sosHint: {
        marginTop: 20,
        color: colors.lightText,
        fontWeight: "600",
        fontSize: 15,
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 20,
        color: colors.text,
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 15,
    },
    actionCard: {
        backgroundColor: colors.surface,
        width: "47%",
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
    },
    actionText: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: "600",
        color: colors.text,
        textAlign: "center",
    },
    tipCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        padding: 18,
        borderRadius: 16,
        marginTop: 20,
        marginBottom: 30,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: colors.success,
    },
    tipText: {
        marginLeft: 12,
        flex: 1,
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
        fontWeight: "500",
    },
});