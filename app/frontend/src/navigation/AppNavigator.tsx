import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OTPScreen from "../screens/OTPScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import EmergencyCallScreen from "../screens/EmergencyCallScreen";
import SOSActivatedScreen from "../screens/SOSActivatedScreen";
import SOSCountdownScreen from "../screens/SOSCountdownScreen";
import HomeDashboardScreen from "../screens/HomeDashboardScreen";
import ContactPermissionsScreen from "../screens/ContactPermissionsScreen";
import EditContactScreen from "../screens/EditContactScreen";
import AddContactScreen from "../screens/AddContactScreen";
import ContactsListScreen from "../screens/ContactsListScreen";
import StopSharingScreen from "../screens/StopSharingScreen";
import LocationSharingStatusScreen from "../screens/LocationSharingStatusScreen";
import LiveLocationMapScreen from "../screens/LiveLocationMapScreen";
import RouteSafetyIndicatorScreen from "../screens/RouteSafetyIndicatorScreen";
import SafeRouteMapScreen from "../screens/SafeRouteMapScreen";
import SearchDestinationScreen from "../screens/SearchDestinationScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>

                <Stack.Screen name="Splash" component={SplashScreen} />

                <Stack.Screen name="Onboarding" component={OnboardingScreen} />

                <Stack.Screen name="Login" component={LoginScreen} />

                <Stack.Screen name="Register" component={RegisterScreen} />

                <Stack.Screen name="OTP" component={OTPScreen} />

                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

                <Stack.Screen name="Profile" component={ProfileScreen} />

                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
                <Stack.Screen name="SOSCountdown" component={SOSCountdownScreen} />
                <Stack.Screen name="SOSActivated" component={SOSActivatedScreen} />
                <Stack.Screen name="EmergencyCall" component={EmergencyCallScreen} />
                <Stack.Screen name="ContactsList" component={ContactsListScreen} />
                <Stack.Screen name="AddContact" component={AddContactScreen} />
                <Stack.Screen name="EditContact" component={EditContactScreen} />
                <Stack.Screen name="ContactPermissions" component={ContactPermissionsScreen} />
                <Stack.Screen name="LiveLocationMap" component={LiveLocationMapScreen} />
                <Stack.Screen name="LocationSharingStatus" component={LocationSharingStatusScreen} />
                <Stack.Screen name="StopSharing" component={StopSharingScreen} />
                <Stack.Screen name="SearchDestination" component={SearchDestinationScreen} />
                <Stack.Screen name="SafeRouteMap" component={SafeRouteMapScreen} />
                <Stack.Screen name="RouteSafetyIndicator" component={RouteSafetyIndicatorScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}