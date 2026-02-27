import { Popup } from 'react-map-gl';
import { X, Share2, Ghost, Heart, Skull, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Story, ReactionType } from '../types/story';
import { ReactionPicker } from './ReactionPicker';

interface StoryPopupProps {
    stories: Story[];
    userReactions: Map<number, Set<ReactionType>>;
    onClose: () => void;
    onReact: (storyId: number, type: ReactionType) => void;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Amor': return <Heart size={16} className="popup-icon--amor" />;
        case 'Miedo': return <Ghost size={16} className="popup-icon--miedo" />;
        case 'Crimen': return <Skull size={16} className="popup-icon--crimen" />;
        default: return <Eye size={16} className="popup-icon--curiosidad" />;
    }
};

export const StoryPopup = ({
    stories,
    userReactions,
    onClose,
    onReact,
}: StoryPopupProps) => {
    if (stories.length === 0) return null;

    const handleShare = (storyId: number) => {
        const link = `${window.location.origin}/?story=${storyId}`;
        navigator.clipboard.writeText(link);
        toast.success('Link copiado al portapapeles!');
    };

    return (
        <Popup
            latitude={stories[0].latitude}
            longitude={stories[0].longitude}
            anchor="bottom"
            offset={40}
            onClose={onClose}
            closeButton={false}
            className="custom-popup"
            maxWidth="340px"
        >
            <div className="popup-container">
                {/* Header */}
                <div className="popup-header">
                    <span className="popup-header__title">
                        📍 {stories.length}{' '}
                        {stories.length === 1 ? 'Historia' : 'Historias aquí'}
                    </span>
                    <button onClick={onClose} className="popup-header__close">
                        <X size={16} />
                    </button>
                </div>

                {/* Stories list */}
                <div className="popup-list">
                    {stories.map((story, index) => {
                        const storyUserReactions = userReactions.get(story.id) || new Set<ReactionType>();
                        return (
                            <div
                                key={story.id}
                                className={`popup-story ${index !== stories.length - 1 ? 'popup-story--bordered' : ''
                                    }`}
                            >
                                {/* Category + timestamp */}
                                <div className="popup-story__meta">
                                    {getCategoryIcon(story.category)}
                                    <span className="popup-story__category">{story.category}</span>
                                    <span className="popup-story__time">
                                        {formatDistanceToNow(new Date(story.createdAt), {
                                            addSuffix: true,
                                            locale: es,
                                        })}
                                    </span>
                                </div>

                                {/* Content */}
                                <p className="popup-story__content">{story.content}</p>

                                {/* Actions */}
                                <div className="popup-story__actions">
                                    <button
                                        onClick={() => handleShare(story.id)}
                                        className="popup-action-btn"
                                        title="Copiar enlace directo"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                </div>

                                {/* Reaction Picker */}
                                <ReactionPicker
                                    storyId={story.id}
                                    reactions={story.reactions}
                                    userReactions={storyUserReactions}
                                    onReact={onReact}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </Popup>
    );
};
