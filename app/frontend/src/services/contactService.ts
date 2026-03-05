import apiClient from './apiClient';

/**
 * Get all emergency contacts
 * @returns List of emergency contacts
 */
export const getContacts = async () => {
    try {
        const response = await apiClient.get('/contacts');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Add a new emergency contact
 * @param contactData - Contact information (name, phone, relation)
 * @returns Updated contacts list
 */
export const addContact = async (contactData: {
    name: string;
    phone: string;
    relation: string;
}) => {
    try {
        const response = await apiClient.post('/contacts', contactData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Update an existing contact
 * @param contactId - Contact ID
 * @param contactData - Updated contact information
 * @returns Updated contacts list
 */
export const updateContact = async (contactId: string, contactData: {
    name: string;
    phone: string;
    relation: string;
}) => {
    try {
        const response = await apiClient.put(`/contacts/${contactId}`, contactData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

/**
 * Delete a contact
 * @param contactId - Contact ID
 * @returns Success message
 */
export const deleteContact = async (contactId: string) => {
    try {
        const response = await apiClient.delete(`/contacts/${contactId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
