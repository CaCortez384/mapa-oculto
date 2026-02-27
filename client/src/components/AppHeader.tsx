import { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';

interface AppHeaderProps {
    storyCount: number;
}

export const AppHeader = ({ storyCount }: AppHeaderProps) => {
    const toggleTrending = useMapStore((s) => s.toggleTrending);
    const showTrending = useMapStore((s) => s.showTrending);

    // Animated counter
    const [displayCount, setDisplayCount] = useState(storyCount);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevCountRef = useRef(storyCount);

    useEffect(() => {
        if (storyCount !== prevCountRef.current) {
            setIsAnimating(true);
            const timeout = setTimeout(() => {
                setDisplayCount(storyCount);
                setIsAnimating(false);
            }, 300);
            prevCountRef.current = storyCount;
            return () => clearTimeout(timeout);
        }
    }, [storyCount]);

    return (
        <div className="app-title-container">
            <h1 className="app-title-text">MAPA OCULTO</h1>
            <div className="app-title-counter">
                <div className="app-title-dot"></div>
                <p className={`app-title-count ${isAnimating ? 'count-flip' : ''}`}>
                    {displayCount} secretos revelados
                </p>
            </div>
            <button
                className={`trending-toggle ${showTrending ? 'trending-toggle--active' : ''}`}
                onClick={toggleTrending}
                title="Ver historias trending"
            >
                <TrendingUp size={18} />
                <span>Trending</span>
            </button>
        </div>
    );
};
