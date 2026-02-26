import { useEffect } from 'react';
import { toast } from 'sonner';
import { useMapStore } from '../store/useMapStore';

export function useGeolocation() {
    const setViewState = useMapStore((s) => s.setViewState);
    const viewState = useMapStore((s) => s.viewState);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setViewState({
                        ...viewState,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        zoom: 14,
                    });
                    toast.success('Ubicación encontrada');
                },
                (error) => {
                    console.error('Error obteniendo ubicación:', error);
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
