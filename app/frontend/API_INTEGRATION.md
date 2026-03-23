# Women Safety App - API Integration Documentation

## Overview

This document describes the complete API integration between the React Native frontend and the Node.js/Express backend for the Women Safety application.

## Base Configuration

**Base URL:** `http://10.79.206.236:3000/api`

**Authentication:** Bearer token (stored in Expo SecureStore)

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

---

## 1. Authentication APIs (`/api/auth`)

### 1.1 Register User
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "email": "john@example.com",
  "password": "securepassword",
  "address": "123 Main St",
  "bloodGroup": "O+",
  "profilePhoto": "base64_or_url"
}
```

**Response:**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt_token"
}
```

**Service:** `authService.register()`

---

### 1.2 Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt_token"
}
```

**Service:** `authService.login()`

**Screens:** `LoginScreen.tsx`

---

### 1.3 Send OTP
**Endpoint:** `POST /auth/send-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully to email"
}
```

**Service:** `authService.sendOtp()`

**Screens:** `RegisterScreen.tsx`, `OTPScreen.tsx`

---

### 1.4 Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully"
}
```

**Service:** `authService.verifyOtp()`

**Screens:** `OTPScreen.tsx`, `ResetPasswordScreen.tsx`

---

### 1.5 Forgot Password
**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset link sent to email"
}
```

**Service:** `authService.forgotPassword()`

**Screens:** `ForgotPasswordScreen.tsx`

---

### 1.6 Reset Password
**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "password": "newpassword",
  "resetToken": "optional_reset_token"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

**Service:** `authService.resetPassword()`

**Screens:** `ResetPasswordScreen.tsx`

---

## 2. User Profile APIs (`/api/users`)

### 2.1 Get Profile
**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "bloodGroup": "O+",
  "address": "123 Main St",
  "profilePhoto": "/uploads/filename.jpg",
  "emergencyContacts": []
}
```

**Service:** `userService.getProfile()`

**Screens:** `ProfileScreen.tsx`, `EditProfileScreen.tsx`

---

### 2.2 Update Profile
**Endpoint:** `PUT /users/profile`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
```
name: "John Doe"
bloodGroup: "O+"
address: "123 Main St"
profilePhoto: <file>
```

**Response:**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  ...
}
```

**Service:** `userService.updateProfile()`

**Screens:** `EditProfileScreen.tsx`

---

### 2.3 Delete Account
**Endpoint:** `DELETE /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "User deleted"
}
```

**Service:** `userService.deleteAccount()`

---

## 3. Emergency Contacts APIs (`/api/contacts`)

### 3.1 Get All Contacts
**Endpoint:** `GET /contacts`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "contact_id",
      "name": "Jane Doe",
      "phone": "0987654321",
      "relation": "Mother"
    }
  ]
}
```

**Service:** `contactService.getContacts()`

**Screens:** `ContactsListScreen.tsx`

---

### 3.2 Add Contact
**Endpoint:** `POST /contacts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "0987654321",
  "relation": "Mother"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

**Service:** `contactService.addContact()`

**Screens:** `AddContactScreen.tsx`

---

### 3.3 Update Contact
**Endpoint:** `PUT /contacts/:contactId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Doe Updated",
  "phone": "0987654321",
  "relation": "Father"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

**Service:** `contactService.updateContact()`

**Screens:** `EditContactScreen.tsx`

---

### 3.4 Delete Contact
**Endpoint:** `DELETE /contacts/:contactId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Contact removed"
}
```

**Service:** `contactService.deleteContact()`

**Screens:** `EditContactScreen.tsx`

---

## 4. SOS APIs (`/api/sos`)

### 4.1 Trigger SOS
**Endpoint:** `POST /sos/trigger`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Manual SOS Sent!",
  "alertId": "sos_id"
}
```

**Service:** `sosService.triggerSOS()`

**Screens:** `HomeDashboardScreen.tsx`, `SOSCountdownScreen.tsx`

---

### 4.2 Get SOS Status/History
**Endpoint:** `GET /sos/status`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "_id": "sos_id",
      "status": "active",
      "triggerType": "manual",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "New York, NY"
      },
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Service:** `sosService.getSOSStatus()`

**Screens:** `SOSHistoryScreen.tsx`

---

### 4.3 Update SOS Location
**Endpoint:** `PUT /sos/update-location`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "alertId": "sos_id",
  "latitude": 40.7130,
  "longitude": -74.0062,
  "address": "Updated Location"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated",
  "currentLocation": {...}
}
```

**Service:** `sosService.updateSOSLocation()`

**Screens:** `SOSActivatedScreen.tsx`

---

### 4.4 Resolve SOS
**Endpoint:** `POST /sos/resolve`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "alertId": "sos_id",
  "note": "Reached safely"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SOS Resolved",
  "data": {...}
}
```

**Service:** `sosService.resolveSOS()`

**Screens:** `SOSActivatedScreen.tsx`

---

### 4.5 Cancel SOS
**Endpoint:** `POST /sos/cancel`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "alertId": "sos_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SOS Alert Cancelled successfully."
}
```

**Service:** `sosService.cancelSOS()`

**Screens:** `SOSActivatedScreen.tsx`

---

### 4.6 Get Nearby Services
**Endpoint:** `GET /sos/services`

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `lat`: Latitude
- `lng`: Longitude
- `type`: Type (police_station, hospital, etc.)

**Response:**
```json
{
  "success": true,
  "results": [...]
}
```

**Service:** `sosService.getNearbyServices()`

---

## 5. Location Sharing APIs (`/api/location`)

### 5.1 Start Location Sharing
**Endpoint:** `POST /location/start-sharing`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Live location sharing started."
}
```

**Service:** `locationService.startLocationSharing()`

**Screens:** `LiveLocationMapScreen.tsx`

---

### 5.2 Stop Location Sharing
**Endpoint:** `POST /location/stop-sharing`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Location sharing stopped."
}
```

**Service:** `locationService.stopLocationSharing()`

**Screens:** `LocationSharingStatusScreen.tsx`, `StopSharingScreen.tsx`

---

### 5.3 Update Location
**Endpoint:** `POST /location/update`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {...}
}
```

**Service:** `locationService.updateLocation()`

**Screens:** `LiveLocationMapScreen.tsx`

---

### 5.4 Get User Location
**Endpoint:** `GET /location/:userId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

**Service:** `locationService.getUserLocation()`

---

## 6. Safety Timer APIs (`/api/timer`)

### 6.1 Start Timer
**Endpoint:** `POST /timer/start`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "minutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Safety timer set for 30 minutes.",
  "expiresAt": "2024-01-01T12:30:00.000Z"
}
```

**Service:** `timerService.startTimer()`

**Screens:** `SafetyTimerScreen.tsx`

---

### 6.2 Stop Timer
**Endpoint:** `POST /timer/stop`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Timer stopped. You are marked safe!"
}
```

**Service:** `timerService.stopTimer()`

**Screens:** `SafetyTimerScreen.tsx`

---

## 7. Route & Safety APIs

### 7.1 Get High Risk Zones
**Endpoint:** `GET /routes/high-risk-zones`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

**Service:** `routeService.getHighRiskZones()`

---

### 7.2 Get Safe Route
**Endpoint:** `POST /routes/safe`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "origin": "Current Location",
  "destination": "Destination Address"
}
```

**Response:**
```json
{
  "success": true,
  "route": {...}
}
```

**Service:** `routeService.getSafeRoute()`

**Screens:** `SafeRouteMapScreen.tsx`, `SearchDestinationScreen.tsx`

---

### 7.3 Get Heatmap Data
**Endpoint:** `GET /incidents/heatmap`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

**Service:** `routeService.getHeatmapData()`

---

### 7.4 Report Incident
**Endpoint:** `POST /incidents/report`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "category": "harassment",
  "description": "Incident description",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

**Service:** `routeService.reportIncident()`

---

### 7.5 Get Nearby Safe Places
**Endpoint:** `GET /safe-places/nearby`

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `latitude`: Current latitude
- `longitude`: Current longitude

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

**Service:** `routeService.getNearbySafePlaces()`

---

## Service Files Structure

```
app/frontend/src/services/
├── apiClient.ts          # Axios instance with interceptors
├── authService.ts        # Authentication APIs
├── userService.ts        # User profile APIs
├── contactService.ts     # Emergency contacts APIs
├── sosService.ts         # SOS alert APIs
├── locationService.ts    # Location sharing APIs
├── timerService.ts       # Safety timer APIs
└── routeService.ts       # Route & incident APIs
```

## Screen Integration Map

| Screen | Services Used |
|--------|--------------|
| LoginScreen | authService |
| RegisterScreen | authService |
| OTPScreen | authService |
| ForgotPasswordScreen | authService |
| ResetPasswordScreen | authService |
| ProfileScreen | userService |
| EditProfileScreen | userService |
| ContactsListScreen | contactService |
| AddContactScreen | contactService |
| EditContactScreen | contactService |
| HomeDashboardScreen | sosService |
| SOSActivatedScreen | sosService |
| SOSHistoryScreen | sosService |
| LiveLocationMapScreen | locationService |
| LocationSharingStatusScreen | locationService |
| StopSharingScreen | locationService |
| SafetyTimerScreen | timerService |
| SafeRouteMapScreen | routeService |
| SearchDestinationScreen | routeService |

## Error Handling

All services follow a consistent error handling pattern:

```typescript
try {
  const response = await apiClient.post('/endpoint', data);
  return response.data;
} catch (error: any) {
  throw error.response?.data || error.message;
}
```

## Authentication Flow

1. User registers/logs in → Token stored in SecureStore
2. All subsequent requests include token via axios interceptor
3. Token expires after 30 days (configured in backend)
4. On 401 errors, user is redirected to login screen

## Testing

To test the API integration:

1. Ensure backend is running on `http://10.79.206.236:3000`
2. Start the Expo app: `npm start`
3. Test each screen's functionality
4. Check network requests in React Native Debugger or Flipper
