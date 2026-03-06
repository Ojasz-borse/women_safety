import apiClient from './apiClient';
import * as SecureStore from 'expo-secure-store';

export type EvidenceItem = {
    _id: string;
    type: 'audio' | 'video';
    fileUrl: string;
    duration: number;
    linkedSOS?: string;
    notes?: string;
    createdAt: string;
};

/**
 * Upload evidence recording to backend using XMLHttpRequest
 * This is more reliable than axios for React Native file uploads
 */
export const uploadEvidence = async (
    fileUri: string,
    type: 'audio' | 'video' = 'audio',
    duration: number,
    linkedSOS?: string,
    notes?: string
): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            console.log("🎤 Starting evidence upload:", fileUri);
            
            const formData = new FormData();
            
            const fileExtension = type === 'audio' ? '.m4a' : '.mp4';
            const fileName = `evidence_${Date.now()}${fileExtension}`;
            
            // React Native FormData file structure
            (formData as any).append('file', {
                uri: fileUri,
                name: fileName,
                type: type === 'audio' ? 'audio/mp4' : 'video/mp4',
            });
            
            formData.append('type', type);
            formData.append('duration', duration.toString());
            if (linkedSOS) formData.append('linkedSOS', linkedSOS);
            if (notes) formData.append('notes', notes);

            console.log("📦 FormData created:");
            console.log("  - File URI:", fileUri);
            console.log("  - File name:", fileName);
            console.log("  - Duration:", duration);

            // Get token from SecureStore
            SecureStore.getItemAsync('token').then(token => {
                const xhr = new XMLHttpRequest();
                
                xhr.onload = () => {
                    console.log("XHR Response:", xhr.status, xhr.responseText);
                    if (xhr.status === 200 || xhr.status === 201) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            console.log("✅ Upload successful");
                            resolve(response);
                        } catch (e) {
                            console.error("Failed to parse response:", e);
                            reject(new Error("Failed to parse server response"));
                        }
                    } else {
                        console.error("Upload failed with status:", xhr.status);
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            reject(errorData);
                        } catch {
                            reject(new Error(`Upload failed: ${xhr.status}`));
                        }
                    }
                };
                
                xhr.onerror = () => {
                    console.error("XHR network error");
                    reject(new Error("Network error during upload"));
                };
                
                xhr.open('POST', 'https://women-safety-51m4.onrender.com/api/evidence/upload');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                // Don't set Content-Type - let the browser set it with boundary
                xhr.send(formData);
                
                console.log("📤 XHR request sent");
            });
        } catch (error: any) {
            console.error('❌ Upload evidence error:', error);
            reject(error);
        }
    });
};

/**
 * Get user's evidence list from backend
 */
export const getEvidenceList = async () => {
    try {
        const response = await apiClient.get('/evidence/list');
        return response.data;
    } catch (error: any) {
        console.error('Get evidence list error:', error);
        throw error.response?.data || error.message;
    }
};

/**
 * Delete evidence from backend
 * @param evidenceId - Evidence ID to delete
 */
export const deleteEvidence = async (evidenceId: string) => {
    try {
        const response = await apiClient.delete(`/evidence/${evidenceId}`);
        return response.data;
    } catch (error: any) {
        console.error('Delete evidence error:', error);
        throw error.response?.data || error.message;
    }
};
