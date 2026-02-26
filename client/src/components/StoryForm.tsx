import { X, Plus, Ghost, Heart, Skull, Eye } from 'lucide-react';
import type { StoryFormData, Category } from '../types/story';
import { getCategoryColor } from '../utils/categories';
import { CATEGORIES } from '../types/story';

interface StoryFormProps {
    formData: StoryFormData;
    isSubmitting: boolean;
    onFormDataChange: (data: StoryFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const MAX_CONTENT_LENGTH = 500;

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Amor': return <Heart size={14} />;
        case 'Miedo': return <Ghost size={14} />;
        case 'Crimen': return <Skull size={14} />;
        default: return <Eye size={14} />;
    }
};

export const StoryForm = ({
    formData,
    isSubmitting,
    onFormDataChange,
    onSubmit,
    onClose,
}: StoryFormProps) => {
    const contentLength = formData.content.length;
    const isOverLimit = contentLength > MAX_CONTENT_LENGTH;

    return (
        <div className="story-form">
            <div className="story-form__header">
                <h3 className="story-form__title">Nueva Historia</h3>
                <button onClick={onClose} className="story-form__close">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={onSubmit}>
                {/* Category selector */}
                <div className="story-form__section">
                    <label className="story-form__label">Categoría</label>
                    <div className="story-form__categories">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() =>
                                    onFormDataChange({ ...formData, category: cat as Category })
                                }
                                className={`story-form__cat-btn ${formData.category === cat ? 'story-form__cat-btn--active' : ''
                                    }`}
                                style={{
                                    '--cat-color': getCategoryColor(cat),
                                } as React.CSSProperties}
                            >
                                {getCategoryIcon(cat)} {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content textarea */}
                <div className="story-form__section">
                    <textarea
                        rows={4}
                        value={formData.content}
                        onChange={(e) =>
                            onFormDataChange({ ...formData, content: e.target.value })
                        }
                        placeholder="Cuenta tu secreto..."
                        className="story-form__textarea"
                        maxLength={MAX_CONTENT_LENGTH}
                        autoFocus
                    />
                    <div
                        className={`story-form__char-count ${isOverLimit ? 'story-form__char-count--over' : ''
                            }`}
                    >
                        {contentLength}/{MAX_CONTENT_LENGTH}
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting || isOverLimit || contentLength === 0}
                    className="story-form__submit"
                >
                    {isSubmitting ? (
                        'Publicando...'
                    ) : (
                        <>
                            <Plus size={18} /> Publicar
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
