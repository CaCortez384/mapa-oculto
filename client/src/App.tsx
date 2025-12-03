import { useEffect, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  GeolocateControl,
} from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { MapPin, Plus, X, Heart, Ghost, Skull, Eye } from "lucide-react";
import { Toaster, toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { WelcomeModal } from "./WelcomeModal";
import { io } from "socket.io-client";

// --- TIPOS DE DATOS ---
interface Story {
  id: number;
  content: string;
  category: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  likes: number;
}

interface NewStoryState {
  latitude: number;
  longitude: number;
}

function App() {
  // --- 1. CONFIGURACIÓN Y CONSTANTES (Primero, para que estén disponibles) ---
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  // Usamos la variable de entorno o localhost por defecto
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const [showWelcome, setShowWelcome] = useState(false); // <--- ESTADO NUEVO

  // --- 2. ESTADOS ---

  // Estado de Likes (Persistente)
  const [likedStories, setLikedStories] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("likedStories");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [stories, setStories] = useState<Story[]>([]);
  const [newStoryLocation, setNewStoryLocation] =
    useState<NewStoryState | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Story[]>([]);
  const [formData, setFormData] = useState({ content: "", category: "Miedo" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -70.6693,
    latitude: -33.4489,
    zoom: 12,
  });

  // --- 3. FUNCIONES (Lógica de Negocio) ---

  // Obtener historias del Backend
  const fetchStories = async (category?: string | null) => {
    try {
      const url = category
        ? `${API_URL}/stories?category=${category}`
        : `${API_URL}/stories`;

      const response = await axios.get(url);
      setStories(response.data);
    } catch (error) {
      console.error("Error cargando historias:", error);
      toast.error("Error al cargar las historias");
    }
  };

  // Encontrar historias cercanas (Clustering visual simple)
  const findNearbyStories = (targetStory: Story, allStories: Story[]) => {
    const threshold = 0.0002;
    return allStories.filter(
      (s) =>
        Math.abs(s.latitude - targetStory.latitude) < threshold &&
        Math.abs(s.longitude - targetStory.longitude) < threshold
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Amor":
        return "#ec4899";
      case "Miedo":
        return "#a855f7";
      case "Crimen":
        return "#ef4444";
      case "Curiosidad":
        return "#3b82f6";
      default:
        return "#ff0055";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Amor":
        return <Heart size={16} className="text-pink-500" />;
      case "Miedo":
        return <Ghost size={16} className="text-purple-400" />;
      case "Crimen":
        return <Skull size={16} className="text-red-500" />;
      default:
        return <Eye size={16} className="text-blue-400" />;
    }
  };

  // --- 4. MANEJADORES DE EVENTOS ---

  const handleMapClick = (e: MapLayerMouseEvent) => {
    if (selectedCluster.length > 0) {
      setSelectedCluster([]);
      return;
    }

    const { lng, lat } = e.lngLat;
    setNewStoryLocation({ longitude: lng, latitude: lat });
    setFormData({ content: "", category: "Miedo" });

    toast.info("Completa el formulario para publicar.", { duration: 2000 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryLocation || !formData.content) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Publicando secreto...");

    try {
      const payload = {
        content: formData.content,
        category: formData.category,
        latitude: newStoryLocation.latitude,
        longitude: newStoryLocation.longitude,
      };

      await axios.post(`${API_URL}/stories`, payload);
      await fetchStories(activeFilter); // Recargar respetando el filtro actual

      setNewStoryLocation(null);
      toast.success("¡Historia publicada!", { id: toastId });
    } catch (error) {
      console.error(error);

      // --- AQUÍ ESTÁ LA MEJORA ---
      // Verificamos si es un error de Axios y si el código es 429 (Rate Limit)
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Mostramos el mensaje específico que viene del backend
        toast.error(
          error.response.data.error || "Estás publicando muy rápido.",
          { id: toastId }
        );
      } else {
        // Error genérico para cualquier otra cosa
        toast.error("Error al guardar", { id: toastId });
      }
      // ---------------------------
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (category: string | null) => {
    const newFilter = activeFilter === category ? null : category;
    setActiveFilter(newFilter);
    fetchStories(newFilter);

    if (newFilter) {
      toast.success(`Mostrando solo: ${newFilter}`);
    } else {
      toast.info("Mostrando todas las historias");
    }
  };

  const handleLike = async (storyId: number) => {
    const isLiked = likedStories.has(storyId);
    const action = isLiked ? -1 : 1;

    // Actualización Optimista
    const updateStoryLikes = (s: Story) =>
      s.id === storyId
        ? { ...s, likes: Math.max(0, (s.likes || 0) + action) }
        : s;

    setSelectedCluster((prev) => prev.map(updateStoryLikes));
    setStories((prev) => prev.map(updateStoryLikes));

    // Actualizar Estado Local
    setLikedStories((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(storyId);
        toast.info("Like eliminado");
      } else {
        newSet.add(storyId);
        toast.success("❤️ ¡Le diste amor!");
      }
      return newSet;
    });

    try {
      const endpoint = isLiked
        ? `${API_URL}/stories/${storyId}/unlike`
        : `${API_URL}/stories/${storyId}/like`;

      await axios.patch(endpoint);
    } catch (error) {
      console.error("Error al actualizar like:", error);
      toast.error("Error de conexión.");
      // Aquí se podría revertir el cambio visual si falla
    }
  };

  // --- 5. EFECTOS (Side Effects) ---

  // EFECTO: Revisar si es la primera visita
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome_v1");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem("hasSeenWelcome_v1", "true");
    setShowWelcome(false);
  };

  // Carga inicial de datos (SOLO UNA VEZ)
  useEffect(() => {
    fetchStories();
  }, []);

  // --- EFECTO: CONEXIÓN REAL-TIME (WEBSOCKETS) ---
  useEffect(() => {
    // 1. Conectar al servidor
    const socket = io(API_URL.replace("/api", "")); // Quitamos /api porque Socket.io conecta a la raíz

    // 2. Escuchar cuando alguien crea una historia
    socket.on("new-story", (newStory: Story) => {
      // 3. Agregarla a la lista sin recargar
      // Usamos el callback del setStories para asegurar tener el estado previo más fresco
      setStories((prevStories) => [newStory, ...prevStories]);

      toast.success("¡Alguien acaba de publicar una historia nueva!", {
        icon: "📡",
      });
    });

    // 4. Limpieza al salir (Evita conexiones duplicadas)
    return () => {
      socket.disconnect();
    };
  }, []);

  // Guardar likes en LocalStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(
      "likedStories",
      JSON.stringify(Array.from(likedStories))
    );
  }, [likedStories]);

  // Geolocalización al iniciar
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zoom: 14,
          }));
          toast.success("Ubicación encontrada");
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          // No mostramos error en pantalla para no molestar si el usuario bloqueó el GPS
        }
      );
    }
  }, []);

  // --- 6. RENDERIZADO ---
  return (
    <div className="app-container">
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      <Toaster theme="dark" position="bottom-center" />

      {/* --- BARRA DE FILTROS --- */}
      <div className="filter-bar">
        {["Miedo", "Amor", "Crimen", "Curiosidad"].map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilterChange(cat)}
            style={{
              background:
                activeFilter === cat ? getCategoryColor(cat) : "transparent",
              color: "white",
              border: `1px solid ${
                activeFilter === cat ? getCategoryColor(cat) : "#555"
              }`,
              padding: "6px 12px",
              borderRadius: "15px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexShrink: 0, // Evita que los botones se aplasten en mobile
            }}
          >
            {activeFilter === cat && <span>•</span>}
            {cat}
          </button>
        ))}

        {activeFilter && (
          <button
            onClick={() => handleFilterChange(null)}
            style={{
              background: "#333",
              color: "#ccc",
              border: "1px solid #444",
              padding: "6px 12px",
              borderRadius: "15px",
              cursor: "pointer",
              fontSize: "0.85rem",
              flexShrink: 0,
            }}
          >
            Ver Todo
          </button>
        )}
      </div>

      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
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

        {/* MARCADORES */}
        {stories.map((story) => (
          <Marker
            key={story.id}
            latitude={story.latitude}
            longitude={story.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              const cluster = findNearbyStories(story, stories);
              setSelectedCluster(cluster);
              setNewStoryLocation(null);
            }}
            style={{ zIndex: 10 }}
          >
            <div className="cursor-pointer hover:scale-110 transition-transform duration-200">
              <MapPin
                color={getCategoryColor(story.category)}
                size={32}
                fill={getCategoryColor(story.category)}
                fillOpacity={0.6}
              />
            </div>
          </Marker>
        ))}

        {/* POPUP DE DETALLE */}
        {selectedCluster.length > 0 && (
          <Popup
            latitude={selectedCluster[0].latitude}
            longitude={selectedCluster[0].longitude}
            anchor="bottom"
            offset={40}
            onClose={() => setSelectedCluster([])}
            closeButton={false}
            className="custom-popup"
            maxWidth="320px"
          >
            <div
              style={{
                padding: "0",
                color: "#1a1a1a",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "10px 15px",
                  borderBottom: "1px solid #eee",
                  background: "#f8f9fa",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    color: "#444",
                  }}
                >
                  📍 {selectedCluster.length}{" "}
                  {selectedCluster.length === 1 ? "Historia" : "Historias aquí"}
                </span>
                <button
                  onClick={() => setSelectedCluster([])}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#999",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lista */}
              <div style={{ padding: "0 15px 15px 15px" }}>
                {selectedCluster.map((story, index) => (
                  <div
                    key={story.id}
                    style={{
                      marginTop: "15px",
                      borderBottom:
                        index !== selectedCluster.length - 1
                          ? "1px dashed #eee"
                          : "none",
                      paddingBottom:
                        index !== selectedCluster.length - 1 ? "15px" : "0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                      }}
                    >
                      {getCategoryIcon(story.category)}
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          color: "#555",
                          textTransform: "uppercase",
                        }}
                      >
                        {story.category}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#999",
                          marginLeft: "auto",
                          fontStyle: "italic",
                        }}
                      >
                        {formatDistanceToNow(new Date(story.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        lineHeight: "1.5",
                        color: "#333",
                      }}
                    >
                      {story.content}
                    </p>

                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleLike(story.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          color: likedStories.has(story.id)
                            ? "#e11d48"
                            : "#666",
                          fontSize: "0.8rem",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          transition: "all 0.2s",
                        }}
                        className="hover:bg-gray-100"
                      >
                        <Heart
                          size={16}
                          fill={likedStories.has(story.id) ? "#e11d48" : "none"}
                        />
                        <span style={{ fontWeight: "bold" }}>
                          {story.likes || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        )}

        {/* PIN TEMPORAL */}
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
      </Map>

      {/* FORMULARIO */}
      {newStoryLocation && (
        <div
          style={{
            position: "absolute",
            top: "120px",
            left: "20px",
            background: "#1a1a1a",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
            width: "300px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            zIndex: 100,
            border: "1px solid #333",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Nueva Historia</h3>
            <button
              onClick={() => setNewStoryLocation(null)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "#888",
                  marginBottom: "5px",
                }}
              >
                Categoría
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {["Miedo", "Amor", "Crimen", "Curiosidad"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    style={{
                      padding: "8px",
                      background:
                        formData.category === cat ? "#ff0055" : "#333",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    {getCategoryIcon(cat)} {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <textarea
                rows={4}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Cuenta tu secreto..."
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#222",
                  border: "1px solid #444",
                  color: "white",
                  borderRadius: "6px",
                  resize: "none",
                  outline: "none",
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "12px",
                background: isSubmitting ? "#555" : "#ff0055",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                "Publicando..."
              ) : (
                <>
                  <Plus size={18} /> Publicar
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 5. TÍTULO Y CONTADOR (Ahora usa clases CSS) */}
      <div className="app-title-container">
        <h1 className="app-title-text">MAPA OCULTO</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "5px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              background: "#ff0055",
              borderRadius: "50%",
              boxShadow: "0 0 10px #ff0055",
            }}
          ></div>
          <p
            style={{
              margin: 0,
              opacity: 0.9,
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            {stories.length} secretos revelados
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
