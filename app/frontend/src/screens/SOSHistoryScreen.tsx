import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getSOSStatus } from "../services/sosService";
import { colors } from "../theme/colors";
import { useFocusEffect } from "@react-navigation/native";

export default function SOSHistoryScreen({ navigation }: any) {

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = async () => {
        try {
            const data = await getSOSStatus();
            if (data.success) {
                // The backend returns an array of alerts in the 'alerts' field for status check if not active?
                // Actually, based on sosController.js, getSOSStatus might return a different structure.
                // Let's assume 'alerts' is where the history is.
                setHistory(data.alerts || []);
            }
        } catch (error: any) {
            console.log("Error loading SOS history:", error);
            Alert.alert("Error", error.message || "Failed to load SOS history");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return colors.danger;
            case "resolved":
                return colors.success;
            case "cancelled":
                return colors.lightText;
            default:
                return colors.primary;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <MaterialIcons
                    name="warning"
                    size={24}
                    color={getStatusColor(item.status)}
                />
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                    {item.status?.toUpperCase() || "UNKNOWN"}
                </Text>
            </View>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.location}>Location: {item.address || "Unknown"}</Text>
            {item.resolvedAt && (
                <Text style={styles.resolved}>
                    Resolved: {formatDate(item.resolvedAt)}
                </Text>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>SOS History</Text>
                <View style={{ width: 24 }} />
            </View>

            {history.length === 0 ? (
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                >
                    <MaterialIcons name="history" size={64} color={colors.lightText} />
                    <Text style={styles.emptyText}>No SOS history yet</Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    status: {
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 8,
    },
    date: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 4,
    },
    location: {
        fontSize: 12,
        color: colors.lightText,
    },
    resolved: {
        fontSize: 12,
        color: colors.success,
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: colors.lightText,
        marginTop: 15,
    },
});

