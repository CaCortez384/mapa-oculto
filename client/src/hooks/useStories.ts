import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import type { Story, StoryFormData, NewStoryLocation, ReactionType, ReactionCounts } from '../types/story';
import * as storyApi from '../services/api';
import { useMapStore } from '../store/useMapStore';

// Generate or retrieve a stable session ID for this browser
const getSessionId = (): string => {
    let id = localStorage.getItem('mapa_session_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('mapa_session_id', id);
    }
    return id;
};

const defaultReactions = (): ReactionCounts => ({
    shock: 0, sad: 0, fire: 0, laugh: 0, love: 0,
});

export function useStories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // User reactions persisted in localStorage: Map<storyId, Set<ReactionType>>
    const [userReactions, setUserReactions] = useState<Map<number, Set<ReactionType>>>(() => {
        const saved = localStorage.getItem('userReactions');
        if (saved) {
            const parsed: Record<string, string[]> = JSON.parse(saved);
            const map = new Map<number, Set<ReactionType>>();
            for (const [key, types] of Object.entries(parsed)) {
                map.set(Number(key), new Set(types as ReactionType[]));
            }
            return map;
        }
        return new Map();
    });

    const persistReactions = useCallback((map: Map<number, Set<ReactionType>>) => {
        const obj: Record<string, string[]> = {};
        for (const [key, types] of map.entries()) {
            if (types.size > 0) {
                obj[key] = Array.from(types);
            }
        }
        localStorage.setItem('userReactions', JSON.stringify(obj));
    }, []);

    const fetchStories = useCallback(async (category?: string | null) => {
        try {
            const data = await storyApi.fetchStories(category);
            // Ensure all stories have reactions
            setStories(data.map((s) => ({
                ...s,
                reactions: s.reactions || defaultReactions(),
            })));
        } catch (error) {
            console.error('Error cargando historias:', error);
            toast.error('Error al cargar las historias');
        }
    }, []);

    const addStory = useCallback((story: Story) => {
        setStories((prev) => [{
            ...story,
            reactions: story.reactions || defaultReactions(),
        }, ...prev]);
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

    const handleReaction = useCallback(
        async (storyId: number, type: ReactionType) => {
            const sessionId = getSessionId();
            const currentReactions = userReactions.get(storyId) || new Set<ReactionType>();
            const isAlreadyReacted = currentReactions.has(type);
            const action = isAlreadyReacted ? -1 : 1;

            // Optimistic update: story reactions count
            const updateStoryReactions = (s: Story) => {
                if (s.id !== storyId) return s;
                const newReactions = { ...s.reactions };
                newReactions[type] = Math.max(0, (newReactions[type] || 0) + action);
                return {
                    ...s,
                    reactions: newReactions,
                    likes: Math.max(0, (s.likes || 0) + action),
                };
            };

            setStories((prev) => prev.map(updateStoryReactions));
            const { selectedCluster, setSelectedCluster } = useMapStore.getState();
            if (selectedCluster.length > 0) {
                setSelectedCluster(selectedCluster.map(updateStoryReactions));
            }

            // Update local reaction set
            const newUserReactions = new Map(userReactions);
            const newSet = new Set(currentReactions);
            if (isAlreadyReacted) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            newUserReactions.set(storyId, newSet);
            setUserReactions(newUserReactions);
            persistReactions(newUserReactions);

            try {
                if (isAlreadyReacted) {
                    await storyApi.removeReaction(storyId, type, sessionId);
                } else {
                    await storyApi.reactToStory(storyId, type, sessionId);
                }
            } catch (error) {
                console.error('Error al actualizar reacción:', error);
                toast.error('Error de conexión.');
            }
        },
        [userReactions, persistReactions]
    );

    // Update a specific story's reactions (from socket events)
    const updateStoryReactions = useCallback((storyId: number, reactions: ReactionCounts, totalReactions: number) => {
        const updateFn = (s: Story) =>
            s.id === storyId ? { ...s, reactions, likes: totalReactions } : s;

        setStories((prev) => prev.map(updateFn));
        const { selectedCluster, setSelectedCluster } = useMapStore.getState();
        if (selectedCluster.length > 0) {
            setSelectedCluster(selectedCluster.map(updateFn));
        }
    }, []);

    return {
        stories,
        setStories,
        userReactions,
        isSubmitting,
        fetchStories,
        addStory,
        handleSubmit,
        handleReaction,
        updateStoryReactions,
    };
}
