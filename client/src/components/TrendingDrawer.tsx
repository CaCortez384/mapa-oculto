import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ghost, Heart, Skull, Eye } from 'lucide-react';
import { REACTION_EMOJI } from '../types/story';
import type { Story, ReactionType } from '../types/story';
import { useMapStore } from '../store/useMapStore';
import * as storyApi from '../services/api';

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Amor': return <Heart size={14} className="popup-icon--amor" />;
        case 'Miedo': return <Ghost size={14} className="popup-icon--miedo" />;
        case 'Crimen': return <Skull size={14} className="popup-icon--crimen" />;
        default: return <Eye size={14} className="popup-icon--curiosidad" />;
    }
};

export const TrendingDrawer = () => {
    const showTrending = useMapStore((s) => s.showTrending);
    const setShowTrending = useMapStore((s) => s.setShowTrending);
    const setViewState = useMapStore((s) => s.setViewState);
    const viewState = useMapStore((s) => s.viewState);
    const setSelectedCluster = useMapStore((s) => s.setSelectedCluster);

    const [trending, setTrending] = useState<Story[]>([]);
    const [loading, setLoading] = useState(false);

    const loadTrending = useCallback(async () => {
        setLoading(true);
        try {
            const data = await storyApi.fetchTrending();
            setTrending(data);
        } catch (err) {
            console.error('Error loading trending:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (showTrending) {
            loadTrending();
        }
    }, [showTrending, loadTrending]);

    const handleStoryClick = (story: Story) => {
        setViewState({
            ...viewState,
            latitude: story.latitude,
            longitude: story.longitude,
            zoom: 16,
        });
        setSelectedCluster([story]);
        setShowTrending(false);
    };

    // Get top reaction for a story
    const getTopReaction = (story: Story): { emoji: string; count: number } | null => {
        if (!story.reactions) return null;
        let maxType: ReactionType = 'love';
        let maxCount = 0;
        for (const [type, count] of Object.entries(story.reactions)) {
            if (count > maxCount) {
                maxCount = count;
                maxType = type as ReactionType;
            }
        }
        if (maxCount === 0) return null;
        return { emoji: REACTION_EMOJI[maxType], count: maxCount };
    };

    if (!showTrending) return null;

    return (
        <>
            <div className="trending-backdrop" onClick={() => setShowTrending(false)} />
            <div className="trending-drawer">
                <div className="trending-header">
                    <div className="trending-header__title">
                        <TrendingUp size={20} />
                        <span>Trending esta semana</span>
                    </div>
                    <button
                        onClick={() => setShowTrending(false)}
                        className="trending-header__close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="trending-list">
                    {loading ? (
                        <div className="trending-loading">Cargando...</div>
                    ) : trending.length === 0 ? (
                        <div className="trending-empty">
                            No hay historias trending esta semana. ¡Sé el primero en reaccionar!
                        </div>
                    ) : (
                        trending.map((story, index) => {
                            const topReaction = getTopReaction(story);
                            return (
                                <button
                                    key={story.id}
                                    className="trending-card"
                                    onClick={() => handleStoryClick(story)}
                                >
                                    <div className="trending-card__rank">
                                        #{index + 1}
                                    </div>
                                    <div className="trending-card__body">
                                        <div className="trending-card__meta">
                                            {getCategoryIcon(story.category)}
                                            <span className="trending-card__category">
                                                {story.category}
                                            </span>
                                            <span className="trending-card__time">
                                                {formatDistanceToNow(new Date(story.createdAt), {
                                                    addSuffix: true,
                                                    locale: es,
                                                })}
                                            </span>
                                        </div>
                                        <p className="trending-card__content">
                                            {story.content.length > 80
                                                ? story.content.slice(0, 80) + '…'
                                                : story.content}
                                        </p>
                                        <div className="trending-card__reactions">
                                            {topReaction && (
                                                <span className="trending-card__top-reaction">
                                                    {topReaction.emoji} {topReaction.count}
                                                </span>
                                            )}
                                            <span className="trending-card__total">
                                                {story.likes} reacciones
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};
