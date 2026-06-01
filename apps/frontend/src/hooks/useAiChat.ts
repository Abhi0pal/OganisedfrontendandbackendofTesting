import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const useAiChat = () => {
    return useMutation({
        mutationFn: async (payload: { message: string; history: ChatMessage[]; context?: string }) => {
            const response = await apiClient.post('/inspections/investor/ai/chat', payload);
            return response.data;
        },
    });
};
