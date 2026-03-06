import apiClient from './apiClient';

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
 * Upload evidence recording to backend
 * @param fileUri - Local file URI of the recording
 * @param type - Type of recording ('audio' or 'video')
 * @param duration - Duration in seconds
 * @param linkedSOS - Optional linked SOS alert ID
 * @param notes - Optional notes
 */
export const uploadEvidence = async (
    fileUri: string,
    type: 'audio' | 'video' = 'audio',
    duration: number,
    linkedSOS?: string,
    notes?: string
) => {
    try {
        console.log("🎤 Starting evidence upload:", fileUri);
        
        // Create FormData
        const formData = new FormData();

        // React Native requires specific file object structure
        const fileExtension = type === 'audio' ? '.m4a' : '.mp4';
        const fileName = `evidence_${Date.now()}${fileExtension}`;
        
        // For React Native, the file object must have uri, name, and type
        const fileToUpload = {
            uri: fileUri,
            name: fileName,
            type: type === 'audio' ? 'audio/mp4' : 'video/mp4',
        };

        formData.append('file', fileToUpload as any);
        formData.append('type', type);
        formData.append('duration', duration.toString());
        if (linkedSOS) formData.append('linkedSOS', linkedSOS);
        if (notes) formData.append('notes', notes);

        console.log("📦 FormData created:");
        console.log("  - File URI:", fileUri);
        console.log("  - File name:", fileName);
        console.log("  - File type:", fileToUpload.type);
        console.log("  - Duration:", duration);

        const response = await apiClient.post('/evidence/upload', formData, {
            // Let axios set the Content-Type with boundary automatically
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        console.log("✅ Upload successful");
        return response.data;
    } catch (error: any) {
        console.error('❌ Upload evidence error:', error);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", JSON.stringify(error.response.data));
            console.error("Response headers:", error.response.headers);
        }
        throw error.response?.data || error.message;
    }
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
