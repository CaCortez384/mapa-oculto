import axios from 'axios';
import type { Story, StoryFormData, NewStoryLocation, ReactionType, ReactionCounts } from '../types/story';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

export const getApiBaseUrl = () => API_URL;

export const fetchStories = async (category?: string | null): Promise<Story[]> => {
    const url = category ? `/stories?category=${category}` : '/stories';
    const response = await api.get<Story[]>(url);
    return response.data;
};

export const createStory = async (
    formData: StoryFormData,
    location: NewStoryLocation
): Promise<Story> => {
    const payload = {
        content: formData.content,
        category: formData.category,
        latitude: location.latitude,
        longitude: location.longitude,
    };
    const response = await api.post<Story>('/stories', payload);
    return response.data;
};

export const getStoryById = async (id: string | number): Promise<Story> => {
    const response = await api.get<Story>(`/stories/${id}`);
    return response.data;
};

interface ReactionResponse {
    storyId: number;
    reactions: ReactionCounts;
    totalReactions: number;
}

export const reactToStory = async (
    storyId: number,
    type: ReactionType,
    sessionId: string
): Promise<ReactionResponse> => {
    const response = await api.post<ReactionResponse>(`/stories/${storyId}/react`, {
        type,
        sessionId,
    });
    return response.data;
};

export const removeReaction = async (
    storyId: number,
    type: ReactionType,
    sessionId: string
): Promise<ReactionResponse> => {
    const response = await api.delete<ReactionResponse>(`/stories/${storyId}/react`, {
        data: { type, sessionId },
    });
    return response.data;
};

export const fetchTrending = async (): Promise<Story[]> => {
    const response = await api.get<Story[]>('/stories/trending');
    return response.data;
};

export const reportStory = async (
    storyId: number,
    reason: string
): Promise<void> => {
    await api.post(`/stories/${storyId}/report`, { reason });
};

export { api, API_URL };
