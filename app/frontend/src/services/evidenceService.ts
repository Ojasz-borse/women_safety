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

        // Append file (React Native specific format)
        formData.append('file', {
            uri: fileUri,
            type: type === 'audio' ? 'audio/mp4' : 'video/mp4',
            name: `evidence_${Date.now()}.${type === 'audio' ? 'm4a' : 'mp4'}`,
        } as any);

        formData.append('type', type);
        formData.append('duration', duration.toString());
        if (linkedSOS) formData.append('linkedSOS', linkedSOS);
        if (notes) formData.append('notes', notes);

        console.log("📦 FormData created, sending request...");

        const response = await apiClient.post('/evidence/upload', formData);

        console.log("✅ Upload successful");
        return response.data;
    } catch (error: any) {
        console.error('❌ Upload evidence error:', error);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
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
