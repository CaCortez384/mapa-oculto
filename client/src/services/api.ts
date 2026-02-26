import axios from 'axios';
import type { Story, StoryFormData, NewStoryLocation } from '../types/story';

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

export const likeStory = async (storyId: number): Promise<Story> => {
    const response = await api.patch<Story>(`/stories/${storyId}/like`);
    return response.data;
};

export const unlikeStory = async (storyId: number): Promise<Story> => {
    const response = await api.patch<Story>(`/stories/${storyId}/unlike`);
    return response.data;
};

export const reportStory = async (
    storyId: number,
    reason: string
): Promise<void> => {
    await api.post(`/stories/${storyId}/report`, { reason });
};

export { api, API_URL };
