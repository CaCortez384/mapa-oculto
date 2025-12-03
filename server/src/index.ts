import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { createServer } from "http"; // <--- 1. Importar HTTP
import { Server } from "socket.io";  // <--- 2. Importar Socket.io

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// --- 3. CONFIGURAR SOCKET.IO ---
// Envolvemos Express en un servidor HTTP nativo
const httpServer = createServer(app);

// Inicializamos Socket.io pegado al servidor HTTP
const io = new Server(httpServer, {
  cors: {
    // Permitimos que Vercel y Localhost se conecten
    origin: process.env.CLIENT_URL || "*", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Nuevo cliente conectado:", socket.id);
});

// Configuración de Render
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// ... (TU CONFIGURACIÓN DE RATE LIMIT SE MANTIENE IGUAL) ...
const createStoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "⛔ Calma, vaquero. Has publicado mucho." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ... (RUTA HEALTH CHECK IGUAL) ...
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API viva" });
});

// --- RUTA POST (AQUÍ ESTÁ LA MAGIA) ---
app.post("/api/stories", createStoryLimiter, async (req, res) => {
  // ... (validaciones y logs iguales) ...
  if (!req.body) { res.status(400).json({error: "Body missing"}); return; }
  const { content, category, latitude, longitude } = req.body;
  
  try {
    // ... (Tu código de Prisma insert igual) ...
    const result = await prisma.$queryRaw`
      INSERT INTO "Story" (content, category, latitude, longitude, "createdAt", location, likes)
      VALUES (${content}, ${category}, ${latitude}, ${longitude}, NOW(), ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 0)
      RETURNING id, content, category, latitude, longitude, likes, "createdAt";
    `;
    
    const savedStory = Array.isArray(result) ? result[0] : result;

    // --- 4. EMITIR EL EVENTO REAL-TIME ---
    // Gritamos a TODOS los conectados: "¡Hay nueva historia!"
    io.emit("new-story", savedStory);
    console.log("📡 Evento 'new-story' emitido");

    res.json(savedStory);
  } catch (error) {
    console.error("🔥 Error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ... (RUTAS GET, PATCH, UNLIKE SE MANTIENEN IGUALES) ...
// (Solo asegúrate de copiarlas si no quieres perderlas, 
//  aquí resumo para no pegar 200 líneas de nuevo)
// ...

app.get("/api/stories", async (req, res) => {
    // ... TU CÓDIGO GET EXISTENTE ...
    // (Pégalo aquí)
    // Para simplificar el ejemplo, asumo que lo tienes
    try {
        const { category } = req.query;
        const whereCondition = category ? { category: String(category) } : {};
        const stories = await prisma.story.findMany({
          where: whereCondition,
          select: { id: true, content: true, category: true, latitude: true, longitude: true, createdAt: true, likes: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        });
        res.json(stories);
    } catch (e) { res.status(500).json({error: "Error"}); }
});

app.patch("/api/stories/:id/like", async (req, res) => {
    // ... TU CÓDIGO LIKE EXISTENTE ...
    // (Pégalo aquí)
     try {
        const { id } = req.params;
        const updated = await prisma.story.update({
            where: { id: Number(id) },
            data: { likes: { increment: 1 } }
        });
        
        // OPCIONAL: Emitir evento de like para que los corazones suban en vivo
        // io.emit("update-like", updated); 
        
        res.json(updated);
     } catch (e) { res.status(500).json({error: "Error"}); }
});
// ... (Y EL DE UNLIKE TAMBIÉN) ...


// --- 5. CAMBIO FINAL: Usar httpServer en vez de app.listen ---
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor (HTTP + Sockets) corriendo en http://localhost:${PORT}`);
});