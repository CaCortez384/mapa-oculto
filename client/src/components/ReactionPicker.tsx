import type { ReactionType, ReactionCounts } from '../types/story';
import { REACTION_TYPES, REACTION_EMOJI } from '../types/story';

interface ReactionPickerProps {
    storyId: number;
    reactions: ReactionCounts;
    userReactions: Set<ReactionType>;
    onReact: (storyId: number, type: ReactionType) => void;
}

export const ReactionPicker = ({
    storyId,
    reactions,
    userReactions,
    onReact,
}: ReactionPickerProps) => {
    return (
        <div className="reaction-picker">
            {REACTION_TYPES.map((type) => {
                const count = reactions[type] || 0;
                const isActive = userReactions.has(type);
                return (
                    <button
                        key={type}
                        onClick={() => onReact(storyId, type)}
                        className={`reaction-btn ${isActive ? 'reaction-btn--active' : ''}`}
                        title={type}
                    >
                        <span className="reaction-emoji">{REACTION_EMOJI[type]}</span>
                        {count > 0 && (
                            <span className="reaction-count">{count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
