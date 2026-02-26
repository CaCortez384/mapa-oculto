import type { Story } from '../types/story';

const CLUSTER_THRESHOLD = 0.0002;

export const findNearbyStories = (
    targetStory: Story,
    allStories: Story[]
): Story[] => {
    return allStories.filter(
        (s) =>
            Math.abs(s.latitude - targetStory.latitude) < CLUSTER_THRESHOLD &&
            Math.abs(s.longitude - targetStory.longitude) < CLUSTER_THRESHOLD
    );
};
