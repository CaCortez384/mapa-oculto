import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import type { Story, StoryFormData, NewStoryLocation } from '../types/story';
import * as storyApi from '../services/api';
import { useMapStore } from '../store/useMapStore';

export function useStories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Liked stories persisted in localStorage
    const [likedStories, setLikedStories] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('likedStories');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    const fetchStories = useCallback(async (category?: string | null) => {
        try {
            const data = await storyApi.fetchStories(category);
            setStories(data);
        } catch (error) {
            console.error('Error cargando historias:', error);
            toast.error('Error al cargar las historias');
        }
    }, []);

    const addStory = useCallback((story: Story) => {
        setStories((prev) => [story, ...prev]);
    }, []);

    const handleSubmit = useCallback(
        async (
            formData: StoryFormData,
            location: NewStoryLocation,
            activeFilter: string | null
        ) => {
            if (!formData.content) return false;

            setIsSubmitting(true);
            const toastId = toast.loading('Publicando secreto...');

            try {
                await storyApi.createStory(formData, location);
                await fetchStories(activeFilter);
                toast.success('¡Historia publicada!', { id: toastId });
                return true;
            } catch (error) {
                console.error(error);
                if (axios.isAxiosError(error) && error.response?.status === 429) {
                    toast.error(
                        error.response.data.error || 'Estás publicando muy rápido.',
                        { id: toastId }
                    );
                } else {
                    toast.error('Error al guardar', { id: toastId });
                }
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [fetchStories]
    );

    const handleLike = useCallback(
        async (storyId: number) => {
            const isLiked = likedStories.has(storyId);
            const action = isLiked ? -1 : 1;

            const updateStoryLikes = (s: Story) =>
                s.id === storyId
                    ? { ...s, likes: Math.max(0, (s.likes || 0) + action) }
                    : s;

            // Optimistic update - both stories and selectedCluster
            setStories((prev) => prev.map(updateStoryLikes));
            const { selectedCluster, setSelectedCluster } = useMapStore.getState();
            if (selectedCluster.length > 0) {
                setSelectedCluster(selectedCluster.map(updateStoryLikes));
            }

            // Update local liked set
            const newLiked = new Set(likedStories);
            if (isLiked) {
                newLiked.delete(storyId);
                toast.info('Like eliminado');
            } else {
                newLiked.add(storyId);
                toast.success('❤️ ¡Le diste amor!');
            }
            setLikedStories(newLiked);
            localStorage.setItem('likedStories', JSON.stringify(Array.from(newLiked)));

            try {
                if (isLiked) {
                    await storyApi.unlikeStory(storyId);
                } else {
                    await storyApi.likeStory(storyId);
                }
            } catch (error) {
                console.error('Error al actualizar like:', error);
                toast.error('Error de conexión.');
            }
        },
        [likedStories]
    );

    return {
        stories,
        setStories,
        likedStories,
        isSubmitting,
        fetchStories,
        addStory,
        handleSubmit,
        handleLike,
    };
}
