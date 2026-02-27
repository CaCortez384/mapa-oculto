import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { getApiBaseUrl } from '../services/api';
import type { Story, ReactionCounts } from '../types/story';

interface ReactionEvent {
    storyId: number;
    reactions: ReactionCounts;
    totalReactions: number;
}

export function useSocket(
    addStory: (story: Story) => void,
    updateStoryReactions: (storyId: number, reactions: ReactionCounts, totalReactions: number) => void
) {
    useEffect(() => {
        const apiUrl = getApiBaseUrl();
        const socket = io(apiUrl.replace('/api', ''));

        socket.on('new-story', (newStory: Story) => {
            addStory(newStory);
            toast.success('¡Alguien acaba de publicar una historia nueva!', {
                icon: '📡',
            });
        });

        socket.on('story-reaction', (data: ReactionEvent) => {
            updateStoryReactions(data.storyId, data.reactions, data.totalReactions);
        });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
