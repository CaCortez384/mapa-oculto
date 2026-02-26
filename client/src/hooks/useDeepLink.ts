import { useEffect } from 'react';
import { toast } from 'sonner';
import { useMapStore } from '../store/useMapStore';
import { getStoryById } from '../services/api';

export function useDeepLink() {
    const setViewState = useMapStore((s) => s.setViewState);
    const viewState = useMapStore((s) => s.viewState);
    const setSelectedCluster = useMapStore((s) => s.setSelectedCluster);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const storyId = params.get('story');

        if (storyId) {
            getStoryById(storyId)
                .then((story) => {
                    if (story) {
                        setViewState({
                            ...viewState,
                            latitude: story.latitude,
                            longitude: story.longitude,
                            zoom: 16,
                        });
                        setSelectedCluster([story]);
                        toast.success('¡Encontramos la historia compartida!', {
                            icon: '🔗',
                        });
                    }
                })
                .catch(() => {
                    toast.error('La historia compartida ya no existe.');
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
