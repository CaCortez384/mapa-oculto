import { Request, Response } from "express";
import prisma from "../prisma/client";
import { getIO } from "../socket/socketHandler";

// Palabras prohibidas básicas (expandir según necesidad)
const BANNED_WORDS = [
    "mierda", "puto", "puta", "maricón", "marica",
];

const sanitizeContent = (content: string): string => {
    let sanitized = content.trim();
    // Escapar HTML básico
    sanitized = sanitized
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    return sanitized;
};

const containsBannedWords = (content: string): boolean => {
    const lower = content.toLowerCase();
    return BANNED_WORDS.some((word) => lower.includes(word));
};

// GET /api/stories
export const getStories = async (req: Request, res: Response): Promise<void> => {
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
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        res.json(stories);
    } catch (error) {
        console.error("Error obteniendo historias:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// GET /api/stories/:id
export const getStoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const story = await prisma.story.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                content: true,
                category: true,
                latitude: true,
                longitude: true,
                createdAt: true,
                likes: true,
            },
        });

        if (!story) {
            res.status(404).json({ error: "Historia no encontrada" });
            return;
        }

        res.json(story);
    } catch (error) {
        console.error("Error buscando historia:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// POST /api/stories
export const createStory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, category, latitude, longitude } = req.body;

        // Sanitizar contenido
        const sanitizedContent = sanitizeContent(content);

        // Filtro de palabras
        if (containsBannedWords(sanitizedContent)) {
            res.status(400).json({
                error: "Tu historia contiene contenido inapropiado. Por favor, modifícala.",
            });
            return;
        }

        const result = await prisma.$queryRaw`
      INSERT INTO "Story" (content, category, latitude, longitude, "createdAt", location, likes)
      VALUES (${sanitizedContent}, ${category}, ${latitude}, ${longitude}, NOW(), ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 0)
      RETURNING id, content, category, latitude, longitude, likes, "createdAt";
    `;

        const savedStory = Array.isArray(result) ? result[0] : result;

        // Emitir evento real-time
        const io = getIO();
        io.emit("new-story", savedStory);
        console.log("📡 Evento 'new-story' emitido");

        res.json(savedStory);
    } catch (error) {
        console.error("🔥 Error creando historia:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// PATCH /api/stories/:id/like
export const likeStory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await prisma.story.update({
            where: { id: Number(id) },
            data: { likes: { increment: 1 } },
        });
        res.json(updated);
    } catch (error) {
        console.error("Error en like:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// PATCH /api/stories/:id/unlike
export const unlikeStory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const story = await prisma.story.findUnique({
            where: { id: Number(id) },
        });

        if (!story) {
            res.status(404).json({ error: "Historia no encontrada" });
            return;
        }

        const updated = await prisma.story.update({
            where: { id: Number(id) },
            data: { likes: Math.max(0, story.likes - 1) },
        });
        res.json(updated);
    } catch (error) {
        console.error("Error en unlike:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// POST /api/stories/:id/report
export const reportStory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Verificar que la historia existe
        const story = await prisma.story.findUnique({
            where: { id: Number(id) },
        });

        if (!story) {
            res.status(404).json({ error: "Historia no encontrada" });
            return;
        }

        const report = await prisma.report.create({
            data: {
                storyId: Number(id),
                reason,
            },
        });

        console.log(`🚩 Reporte creado para historia #${id}: ${reason}`);
        res.json({ message: "Reporte recibido. Gracias.", reportId: report.id });
    } catch (error) {
        console.error("Error creando reporte:", error);
        res.status(500).json({ error: "Error interno" });
    }
};
