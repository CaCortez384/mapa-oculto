import { Marker } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import type { Story } from '../types/story';
import { getCategoryColor } from '../utils/categories';

interface StoryMarkerProps {
    story: Story;
    onClick: (story: Story) => void;
}

export const StoryMarker = ({ story, onClick }: StoryMarkerProps) => {
    const color = getCategoryColor(story.category);

    return (
        <Marker
            latitude={story.latitude}
            longitude={story.longitude}
            anchor="bottom"
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                onClick(story);
            }}
            style={{ zIndex: 10 }}
        >
            <div className="story-marker">
                <MapPin
                    color={color}
                    size={32}
                    fill={color}
                    fillOpacity={0.6}
                />
            </div>
        </Marker>
    );
};
