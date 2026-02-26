import { Ghost, Heart, Skull, Eye } from 'lucide-react';
import { getCategoryColor } from '../utils/categories';
import { CATEGORIES } from '../types/story';

interface FilterBarProps {
    activeFilter: string | null;
    onFilterChange: (category: string | null) => void;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Amor': return <Heart size={14} />;
        case 'Miedo': return <Ghost size={14} />;
        case 'Crimen': return <Skull size={14} />;
        default: return <Eye size={14} />;
    }
};

export const FilterBar = ({ activeFilter, onFilterChange }: FilterBarProps) => {
    return (
        <div className="filter-bar">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onFilterChange(activeFilter === cat ? null : cat)}
                    className={`filter-btn ${activeFilter === cat ? 'filter-btn--active' : ''}`}
                    style={{
                        '--filter-color': getCategoryColor(cat),
                    } as React.CSSProperties}
                >
                    {activeFilter === cat && <span className="filter-dot">•</span>}
                    {getCategoryIcon(cat)}
                    {cat}
                </button>
            ))}

            {activeFilter && (
                <button
                    onClick={() => onFilterChange(null)}
                    className="filter-btn filter-btn--clear"
                >
                    Ver Todo
                </button>
            )}
        </div>
    );
};
