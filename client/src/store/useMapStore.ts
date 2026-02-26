import { create } from 'zustand';
import type { Story, NewStoryLocation, StoryFormData, Category } from '../types/story';

interface MapViewState {
    longitude: number;
    latitude: number;
    zoom: number;
}

interface MapStore {
    // View
    viewState: MapViewState;
    setViewState: (vs: MapViewState) => void;

    // Filter
    activeFilter: string | null;
    setActiveFilter: (filter: string | null) => void;

    // New Story
    newStoryLocation: NewStoryLocation | null;
    setNewStoryLocation: (loc: NewStoryLocation | null) => void;

    // Cluster selection
    selectedCluster: Story[];
    setSelectedCluster: (cluster: Story[]) => void;

    // Form
    formData: StoryFormData;
    setFormData: (data: StoryFormData) => void;
    resetForm: () => void;

    // Welcome modal
    showWelcome: boolean;
    setShowWelcome: (show: boolean) => void;
}

const DEFAULT_FORM: StoryFormData = { content: '', category: 'Miedo' as Category };

export const useMapStore = create<MapStore>((set) => ({
    // View
    viewState: { longitude: -70.6693, latitude: -33.4489, zoom: 12 },
    setViewState: (viewState) => set({ viewState }),

    // Filter
    activeFilter: null,
    setActiveFilter: (activeFilter) => set({ activeFilter }),

    // New Story
    newStoryLocation: null,
    setNewStoryLocation: (newStoryLocation) => set({ newStoryLocation }),

    // Cluster selection
    selectedCluster: [],
    setSelectedCluster: (selectedCluster) => set({ selectedCluster }),

    // Form
    formData: DEFAULT_FORM,
    setFormData: (formData) => set({ formData }),
    resetForm: () => set({ formData: DEFAULT_FORM }),

    // Welcome modal
    showWelcome: false,
    setShowWelcome: (showWelcome) => set({ showWelcome }),
}));
