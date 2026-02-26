import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { getApiBaseUrl } from '../services/api';
import type { Story } from '../types/story';

export function useSocket(addStory: (story: Story) => void) {
    useEffect(() => {
        const apiUrl = getApiBaseUrl();
        const socket = io(apiUrl.replace('/api', ''));

        socket.on('new-story', (newStory: Story) => {
            addStory(newStory);
            toast.success('¡Alguien acaba de publicar una historia nueva!', {
                icon: '📡',
            });
        });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
