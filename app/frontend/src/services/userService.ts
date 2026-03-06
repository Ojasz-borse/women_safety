import apiClient from "./apiClient";

/**
 * Get logged in user profile
 * @returns User profile data
 */
export const getProfile = async () => {
    try {
        const response = await apiClient.get("/users/profile");
        return response.data;
    } catch (error: any) {
        throw error.response?.data || new Error("Failed to fetch profile");
    }
};

/**
 * Update user profile
 * @param userData - Profile data to update (name, phoneNumber, bloodGroup, address, profilePhoto)
 * @returns Updated user data
 */
export const updateProfile = async (userData: {
    name?: string;
    phoneNumber?: string;
    bloodGroup?: string;
    address?: string;
    profilePhoto?: string | null;
}) => {
    try {
        const formData = new FormData();
        Object.keys(userData).forEach((key: string) => {
            const value = (userData as any)[key];
            if (key === "profilePhoto" && value) {
                const uri = value;
                const filename = uri.split("/").pop();
                const match = /\.(\w+)$/.exec(filename || "");
                const type = match ? `image/${match[1]}` : `image`;
                formData.append("profilePhoto", {
                    uri,
                    name: filename,
                    type,
                } as any);
            } else if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        const response = await apiClient.put("/users/update-profile", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error: any) {
        console.log("Update profile error:", error);
        throw error.response?.data || new Error("Failed to update profile");
    }
};

/**
 * Delete user account
 * @returns Success message
 */
export const deleteAccount = async () => {
    try {
        const response = await apiClient.delete("/users/profile");
        return response.data;
    } catch (error: any) {
        throw error.response?.data || new Error("Failed to delete account");
    }
};

/**
 * Get user's emergency contacts (via user endpoint)
 * @returns User data with emergency contacts
 */
export const getUserWithContacts = async () => {
    try {
        const response = await apiClient.get("/users/profile");
        return response.data;
    } catch (error: any) {
        throw error.response?.data || new Error("Failed to fetch user data");
    }
};
