import apiClient from './apiClient';

/**
 * Send collaboration invite to another user by email
 */
export const sendCollaborationInvite = async (email: string) => {
    try {
        const response = await apiClient.post('/collaboration/invite', { email });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Accept pending collaboration invite
 */
export const acceptCollaborationInvite = async () => {
    try {
        const response = await apiClient.post('/collaboration/accept');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Decline pending collaboration invite
 */
export const declineCollaborationInvite = async () => {
    try {
        const response = await apiClient.post('/collaboration/decline');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Remove current collaborator
 */
export const removeCollaborator = async () => {
    try {
        const response = await apiClient.delete('/collaboration/remove');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Get collaboration status (has collaborator, pending invite, etc.)
 */
export const getCollaborationStatus = async () => {
    try {
        const response = await apiClient.get('/collaboration/status');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Get merged emergency contacts (user + collaborator)
 */
export const getMergedContacts = async () => {
    try {
        const response = await apiClient.get('/collaboration/contacts');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
