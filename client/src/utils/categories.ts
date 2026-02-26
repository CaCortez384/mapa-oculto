import type { Category } from '../types/story';

interface CategoryConfig {
    color: string;
    label: string;
    emoji: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
    Miedo: { color: '#a855f7', label: 'Miedo', emoji: '👻' },
    Amor: { color: '#ec4899', label: 'Amor', emoji: '❤️' },
    Crimen: { color: '#ef4444', label: 'Crimen', emoji: '💀' },
    Curiosidad: { color: '#3b82f6', label: 'Curiosidad', emoji: '👁️' },
};

export const getCategoryColor = (category: string): string => {
    return CATEGORY_CONFIG[category as Category]?.color ?? '#ff0055';
};

export const DEFAULT_COLOR = '#ff0055';
