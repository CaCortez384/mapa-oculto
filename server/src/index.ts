import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit"; // <--- 1. NUEVO IMPORT

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// --- 2. CONFIGURACIÓN CRÍTICA PARA RENDER ---
// Esto permite leer la IP real del usuario a través del proxy de Render
// Si no pones esto, el limitador bloqueará a todos los usuarios a la vez.
app.set('trust proxy', 1);

// --- MIDDLEWARES (El orden importa) ---
app.use(cors());
app.use(express.json()); // OBLIGATORIO: Esto convierte el JSON entrante a objetos JS

// --- 3. DEFINIR EL ESCUDO ANTI-SPAM ---
const createStoryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // Límite de 3 historias por IP en ese tiempo
  message: {
    error: "⛔ Calma, vaquero. Has publicado mucho. Espera 1 minuto.",
  },
  standardHeaders: true, // Devuelve info de límites en las cabeceras
  legacyHeaders: false,
});

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API viva", timestamp: new Date() });
});

// Ruta para crear historias
// --- 4. APLICAMOS EL LIMITADOR AQUÍ (createStoryLimiter) ---
app.post("/api/stories", createStoryLimiter, async (req, res) => {
  console.log("📥 Petición recibida en POST /stories");

  // 1. Verificamos si el body llegó
  if (!req.body) {
    console.log("❌ El body llegó vacío o undefined");
    res
      .status(400)
      .json({ error: "No enviaste un JSON válido o el header Content-Type" });
    return;
  }

  console.log("📦 Datos recibidos:", req.body);

  try {
    const { content, category, latitude, longitude } = req.body;

    // 2. Validación manual
    if (!content || !latitude || !longitude) {
      console.log("❌ Faltan campos obligatorios");
      res
        .status(400)
        .json({ error: "Faltan datos: content, latitude o longitude" });
      return;
    }

    // 3. Inserción con SQL Puro (La forma correcta para PostGIS)
    // Nota: El array devuelve [story], por eso desestructuramos el primer resultado
    const result = await prisma.$queryRaw`
      INSERT INTO "Story" (content, category, latitude, longitude, "createdAt", location, likes)
      VALUES (
        ${content}, 
        ${category}, 
        ${latitude}, 
        ${longitude}, 
        NOW(), 
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        0
      )
      RETURNING id, content, category, latitude, longitude, likes;
    `;

    console.log("✅ Historia guardada!");

    // Prisma con queryRaw devuelve un array, devolvemos el primer elemento
    const savedStory = Array.isArray(result) ? result[0] : result;
    res.json(savedStory);
  } catch (error) {
    console.error("🔥 Error en el servidor:", error);
    res.status(500).json({ error: "Error interno al guardar" });
  }
});

// GET con Filtros
app.get("/api/stories", async (req, res) => {
  try {
    const { category } = req.query;
    const whereCondition = category ? { category: String(category) } : {};

    const stories = await prisma.story.findMany({
      where: whereCondition,
      select: {
        id: true,
        content: true,
        category: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        likes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar historias" });
  }
});

// PATCH: Dar Like a una historia
app.patch("/api/stories/:id/like", async (req, res) => {
  try {
    const { id } = req.params;

    // Usamos update con 'increment' para seguridad atómica
    const updatedStory = await prisma.story.update({
      where: { id: Number(id) },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    console.log(`❤️ Like recibido para historia ${id}`);
    res.json(updatedStory);
  } catch (error) {
    console.error("Error dando like:", error);
    res.status(500).json({ error: "No se pudo dar like" });
  }
});

// PATCH: Quitar Like (Unlike)
app.patch('/api/stories/:id/unlike', async (req, res) => {
  try {
    const { id } = req.params;

    // Usamos decrement, pero solo si es mayor a 0 (para evitar negativos)
    const updatedStory = await prisma.story.update({
      where: { id: Number(id) },
      data: {
        likes: {
          decrement: 1 
        }
      }
    });

    console.log(`💔 Unlike recibido para historia ${id}`);
    res.json(updatedStory);
  } catch (error) {
    console.error('Error quitando like:', error);
    res.status(500).json({ error: 'No se pudo quitar like' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});