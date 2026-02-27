import { useEffect } from 'react';
import MapGL, {
  Marker,
  NavigationControl,
  GeolocateControl,
} from 'react-map-gl';
import type { MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Components
import { FilterBar } from './components/FilterBar';
import { StoryMarker } from './components/StoryMarker';
import { StoryPopup } from './components/StoryPopup';
import { StoryForm } from './components/StoryForm';
import { AppHeader } from './components/AppHeader';
import { TrendingDrawer } from './components/TrendingDrawer';
import { WelcomeModal } from './WelcomeModal';

// Hooks
import { useStories } from './hooks/useStories';
import { useGeolocation } from './hooks/useGeolocation';
import { useSocket } from './hooks/useSocket';
import { useDeepLink } from './hooks/useDeepLink';

// Store & Utils
import { useMapStore } from './store/useMapStore';
import { findNearbyStories } from './utils/clustering';

// Types
import type { Story } from './types/story';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function App() {
  // --- Store ---
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);
  const activeFilter = useMapStore((s) => s.activeFilter);
  const setActiveFilter = useMapStore((s) => s.setActiveFilter);
  const newStoryLocation = useMapStore((s) => s.newStoryLocation);
  const setNewStoryLocation = useMapStore((s) => s.setNewStoryLocation);
  const selectedCluster = useMapStore((s) => s.selectedCluster);
  const setSelectedCluster = useMapStore((s) => s.setSelectedCluster);
  const formData = useMapStore((s) => s.formData);
  const setFormData = useMapStore((s) => s.setFormData);
  const showWelcome = useMapStore((s) => s.showWelcome);
  const setShowWelcome = useMapStore((s) => s.setShowWelcome);

  // --- Hooks ---
  const {
    stories,
    userReactions,
    isSubmitting,
    fetchStories,
    addStory,
    handleSubmit,
    handleReaction,
    updateStoryReactions,
  } = useStories();

  useGeolocation();
  useSocket(addStory, updateStoryReactions);
  useDeepLink();

  // --- Effects ---

  // Check first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome_v1');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [setShowWelcome]);

  // Initial data load
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // --- Event Handlers ---

  const handleCloseWelcome = () => {
    localStorage.setItem('hasSeenWelcome_v1', 'true');
    setShowWelcome(false);
  };

  const handleMapClick = (e: MapLayerMouseEvent) => {
    if (selectedCluster.length > 0) {
      setSelectedCluster([]);
      return;
    }
    const { lng, lat } = e.lngLat;
    setNewStoryLocation({ longitude: lng, latitude: lat });
    setFormData({ content: '', category: 'Miedo' });
    toast.info('Completa el formulario para publicar.', { duration: 2000 });
  };

  const handleMarkerClick = (story: Story) => {
    const cluster = findNearbyStories(story, stories);
    setSelectedCluster(cluster);
    setNewStoryLocation(null);
  };

  const handleFilterChange = (category: string | null) => {
    setActiveFilter(category);
    fetchStories(category);
    if (category) {
      toast.success(`Mostrando solo: ${category}`);
    } else {
      toast.info('Mostrando todas las historias');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryLocation) return;
    const success = await handleSubmit(formData, newStoryLocation, activeFilter);
    if (success) {
      setNewStoryLocation(null);
    }
  };

  // --- Render ---
  return (
    <div className="app-container">
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      <Toaster theme="dark" position="bottom-center" />

      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <MapGL
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          showUserHeading={true}
        />

        {/* Story markers */}
        {stories.map((story) => (
          <StoryMarker
            key={story.id}
            story={story}
            onClick={handleMarkerClick}
          />
        ))}

        {/* Story detail popup */}
        {selectedCluster.length > 0 && (
          <StoryPopup
            stories={selectedCluster}
            userReactions={userReactions}
            onClose={() => setSelectedCluster([])}
            onReact={handleReaction}
          />
        )}

        {/* Temporary pin for new story */}
        {newStoryLocation && (
          <Marker
            latitude={newStoryLocation.latitude}
            longitude={newStoryLocation.longitude}
            anchor="bottom"
          >
            <MapPin
              color="#ffffff"
              size={40}
              className="animate-bounce opacity-80"
            />
          </Marker>
        )}
      </MapGL>

      {/* New story form */}
      {newStoryLocation && (
        <StoryForm
          formData={formData}
          isSubmitting={isSubmitting}
          onFormDataChange={setFormData}
          onSubmit={handleFormSubmit}
          onClose={() => setNewStoryLocation(null)}
        />
      )}

      <AppHeader storyCount={stories.length} />
      <TrendingDrawer />
    </div>
  );
}

export default App;
