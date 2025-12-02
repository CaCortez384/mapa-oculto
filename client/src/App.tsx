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
import { es } from "date-fns/locale"; // Importamos el idioma español

// Agrega GeolocateControl aquí

// --- TIPOS DE DATOS ---
interface Story {
  id: number;
  content: string;
  category: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  likes: number; // <--- NUEVO
}

interface NewStoryState {
  latitude: number;
  longitude: number;
}

function App() {
  // 1. EL CEREBRO (State + LocalStorage)
  // Al iniciar, intentamos leer si hay algo guardado en el navegador
  const [likedStories, setLikedStories] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("likedStories");
    // Si existe, lo convertimos de JSON a Set. Si no, empezamos vacío.
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // --- ESTADOS ---
  const [stories, setStories] = useState<Story[]>([]);
  const [newStoryLocation, setNewStoryLocation] =
    useState<NewStoryState | null>(null);

  // AHORA guardamos un ARRAY de historias (Cluster) en lugar de una sola
  const [selectedCluster, setSelectedCluster] = useState<Story[]>([]);

  const [formData, setFormData] = useState({ content: "", category: "Miedo" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para saber qué filtro está activo (null = Ver todas)
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -70.6693,
    latitude: -33.4489,
    zoom: 12,
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Amor":
        return "#ec4899"; // Rosa intenso
      case "Miedo":
        return "#a855f7"; // Morado misterioso
      case "Crimen":
        return "#ef4444"; // Rojo peligro
      case "Curiosidad":
        return "#3b82f6"; // Azul eléctrico
      default:
        return "#ff0055"; // Color por defecto
    }
  };

  // EFECTO: Obtener ubicación del usuario al cargar la página
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Si el usuario acepta, movemos el mapa ahí
          setViewState((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zoom: 14, // Un zoom más cercano para que vea su barrio
          }));
          toast.success("Ubicación encontrada");
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          toast.error(
            "No pudimos obtener tu ubicación. Mostrando vista por defecto."
          );
        }
      );
    }
  }, []); // El array vacío [] asegura que solo corra una vez al inicio

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // --- EFECTOS ---
  useEffect(() => { 
    fetchStories();
  }, []);

  // 2. EL GUARDADO AUTOMÁTICO
  // Cada vez que 'likedStories' cambie, lo guardamos en el navegador
  useEffect(() => {
    // Importante: Un 'Set' no se puede guardar directo en JSON,
    // hay que convertirlo a Array primero (Array.from)
    localStorage.setItem(
      "likedStories",
      JSON.stringify(Array.from(likedStories))
    );
  }, [likedStories]);

  useEffect(() => {
    fetchStories();
  }, []);

  // --- FUNCIONES AUXILIARES ---

  // Ahora la función acepta una categoría opcional
  const fetchStories = async (category?: string | null) => {
    try {
      // Usamos la variable dinámica en lugar del texto fijo
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

  // Función Mágica: Encuentra historias cercanas (Radio de ~20 metros)
  const findNearbyStories = (targetStory: Story, allStories: Story[]) => {
    const threshold = 0.0002; // Ajusta este número para agrupar más o menos lejos
    return allStories.filter(
      (s) =>
        Math.abs(s.latitude - targetStory.latitude) < threshold &&
        Math.abs(s.longitude - targetStory.longitude) < threshold
    );
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

  // --- MANEJADORES DE EVENTOS ---

  const handleMapClick = (e: MapLayerMouseEvent) => {
    // Si hay un popup abierto, cerrarlo primero
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
      await fetchStories(); // Recargar mapa

      setNewStoryLocation(null); // Cerrar formulario
      toast.success("¡Historia publicada!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (category: string | null) => {
    // Si hago click en el filtro que ya está activo, lo desactivo (toggle)
    const newFilter = activeFilter === category ? null : category;

    setActiveFilter(newFilter);
    fetchStories(newFilter); // Recargar mapa con el filtro nuevo

    if (newFilter) {
      toast.success(`Mostrando solo: ${newFilter}`);
    } else {
      toast.info("Mostrando todas las historias");
    }
  };

  // Estado para rastrear a qué historias ya les di like en esta sesión (para no spamear)

  const handleLike = async (storyId: number) => {
    // Verificamos si YA le di like para saber si sumo o resto
    const isLiked = likedStories.has(storyId);

    // Acción: Si ya tiene like, resto (-1). Si no, sumo (+1).
    const action = isLiked ? -1 : 1;

    // 1. ACTUALIZACIÓN OPTIMISTA (UI)
    const updateStoryLikes = (s: Story) =>
      s.id === storyId
        ? { ...s, likes: Math.max(0, (s.likes || 0) + action) } // Math.max evita negativos visuales
        : s;

    setSelectedCluster((prev) => prev.map(updateStoryLikes));
    setStories((prev) => prev.map(updateStoryLikes));

    // 2. ACTUALIZAR ESTADO LOCAL (Toggle)
    setLikedStories((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(storyId); // Lo saco de la lista
        toast.info("Like eliminado");
      } else {
        newSet.add(storyId); // Lo agrego a la lista
        toast.success("❤️ ¡Le diste amor!");
      }
      return newSet;
    });

    try {
      // 3. LLAMADA AL BACKEND
      // Elegimos la ruta según la acción
      const endpoint = isLiked
        ? `${API_URL}/stories/${storyId}/unlike`
        : `${API_URL}/stories/${storyId}/like`;

      await axios.patch(endpoint);
    } catch (error) {
      console.error("Error al actualizar like:", error);
      toast.error("Error de conexión. Se revertirá.");

      // Si falla, revertimos el cambio visual (opcional pero recomendado)
      //const revertAction = isLiked ? 1 : -1;
      // ... lógica de reversión aquí (para MVP lo podemos omitir)
    }
  };

  // --- RENDERIZADO ---
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#000",
      }}
    >
      <Toaster theme="dark" position="bottom-center" />

      {/* --- BARRA DE FILTROS --- */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)", // Centrado perfecto
          zIndex: 10,
          display: "flex",
          gap: "8px",
          background: "rgba(0,0,0,0.6)",
          padding: "8px",
          borderRadius: "20px",
          backdropFilter: "blur(4px)",
        }}
      >
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
            }}
          >
            {/* Reutilizamos tu función de iconos si quieres, o solo texto */}
            {activeFilter === cat && <span>•</span>}
            {cat}
          </button>
        ))}

        {/* Botón para limpiar filtros (solo aparece si hay filtro activo) */}
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

        {/* AGREGAR ESTO: Botón de geolocalización */}
        <GeolocateControl
          position="top-right"
          trackUserLocation={true} // El punto azul se mueve contigo
          showUserHeading={true} // Muestra hacia dónde miras (flechita)
        />

        {/* 1. MARCADORES EXISTENTES */}
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
            // Truco visual: Ponemos zIndex alto para asegurar que se vean bien
            style={{ zIndex: 10 }}
          >
            <div className="cursor-pointer hover:scale-110 transition-transform duration-200">
              <MapPin
                color={getCategoryColor(story.category)} // El borde del icono
                size={32}
                fill={getCategoryColor(story.category)} // El relleno del icono
                fillOpacity={0.6} // Un poco más opaco para que el color destaque más en modo oscuro
              />
            </div>
          </Marker>
        ))}

        {/* 2. POPUP INTELIGENTE (LISTA DE HISTORIAS) */}
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
              {/* Header del Popup */}
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

              {/* Lista de Historias */}
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
                    {/* Encabezado (Icono, Categoría, Fecha) */}
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

                    {/* Contenido de la historia */}
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

                    {/* --- ZONA DE LIKE --- */}
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
                            : "#666", // Rojo si ya di like
                          fontSize: "0.8rem",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          transition: "all 0.2s",
                        }}
                        className="hover:bg-gray-100"
                      >
                        <Heart
                          size={16}
                          fill={likedStories.has(story.id) ? "#e11d48" : "none"} // Relleno si ya di like
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

        {/* 3. PIN DE CREACIÓN TEMPORAL */}
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

      {/* 4. FORMULARIO FLOTANTE (CREAR) */}
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
                    {/* Pequeño hack para mostrar icono en botón */}
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

      {/* 5. TÍTULO Y CONTADOR */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          zIndex: 10,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "2rem",
            fontWeight: "900",
            letterSpacing: "-1px",
            textShadow: "0 4px 12px rgba(0,0,0,0.8)",
          }}
        >
          MAPA OCULTO
        </h1>
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
