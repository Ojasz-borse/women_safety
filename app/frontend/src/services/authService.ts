import apiClient from './apiClient';

/**
 * Login user
 * @param credentials - Email and password
 * @returns User data with token
 */
export const login = async (credentials: { email: string; password: string }) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Register new user
 * @param userData - User registration data
 * @returns User data with token
 */
export const register = async (userData: {
    name: string;
    phoneNumber: string;
    email: string;
    password: string;
    address: string;
    bloodGroup?: string;
    profilePhoto?: string;
}) => {
    try {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Send OTP to user email
 * @param email - User email
 * @returns Success message
 */
export const sendOtp = async (email: string) => {
    try {
        const response = await apiClient.post('/auth/send-otp', { email });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Verify OTP
 * @param email - User email
 * @param otp - OTP code
 * @returns Success message
 */
export const verifyOtp = async (email: string, otp: string) => {
    try {
        const response = await apiClient.post('/auth/verify-otp', { email, otp });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Send password reset email
 * @param email - User email
 * @returns Success message
 */
export const forgotPassword = async (email: string) => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Reset password with token
 * @param password - New password
 * @param resetToken - Reset token from email
 * @returns Success message
 */
export const resetPassword = async (password: string, resetToken?: string) => {
    try {
        const response = await apiClient.post('/auth/reset-password', { password, resetToken });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
