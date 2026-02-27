import { Request, Response } from "express";
import prisma from "../prisma/client";
import { getIO } from "../socket/socketHandler";

// Palabras prohibidas básicas (expandir según necesidad)
const BANNED_WORDS = [
    "mierda", "puto", "puta", "maricón", "marica",
];

const REACTION_TYPES = ["shock", "sad", "fire", "laugh", "love"] as const;

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

// Helper: get aggregated reaction counts for stories
const getReactionCounts = async (storyIds: number[]) => {
    if (storyIds.length === 0) return {};

    const reactions = await prisma.reaction.groupBy({
        by: ["storyId", "type"],
        where: { storyId: { in: storyIds } },
        _count: { type: true },
    });

    const countsMap: Record<number, Record<string, number>> = {};
    for (const r of reactions) {
        if (!countsMap[r.storyId]) {
            countsMap[r.storyId] = { shock: 0, sad: 0, fire: 0, laugh: 0, love: 0 };
        }
        countsMap[r.storyId][r.type] = r._count.type;
    }
    return countsMap;
};

const defaultReactions = () => ({ shock: 0, sad: 0, fire: 0, laugh: 0, love: 0 });

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

        // Attach reaction counts
        const storyIds = stories.map((s) => s.id);
        const countsMap = await getReactionCounts(storyIds);

        const storiesWithReactions = stories.map((s) => ({
            ...s,
            reactions: countsMap[s.id] || defaultReactions(),
        }));

        res.json(storiesWithReactions);
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

        const countsMap = await getReactionCounts([story.id]);
        res.json({
            ...story,
            reactions: countsMap[story.id] || defaultReactions(),
        });
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

        // Add empty reactions
        const storyWithReactions = {
            ...savedStory,
            reactions: defaultReactions(),
        };

        // Emitir evento real-time
        const io = getIO();
        io.emit("new-story", storyWithReactions);
        console.log("📡 Evento 'new-story' emitido");

        res.json(storyWithReactions);
    } catch (error) {
        console.error("🔥 Error creando historia:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// POST /api/stories/:id/react
export const reactToStory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type, sessionId } = req.body;

        if (!REACTION_TYPES.includes(type)) {
            res.status(400).json({ error: "Tipo de reacción inválido" });
            return;
        }

        const storyId = Number(id);

        // Check story exists
        const story = await prisma.story.findUnique({ where: { id: storyId } });
        if (!story) {
            res.status(404).json({ error: "Historia no encontrada" });
            return;
        }

        // Upsert reaction (unique constraint handles duplicates)
        await prisma.reaction.upsert({
            where: {
                storyId_type_sessionId: { storyId, type, sessionId },
            },
            create: { storyId, type, sessionId },
            update: {}, // Already exists, no-op
        });

        // Update cached likes count
        const totalReactions = await prisma.reaction.count({ where: { storyId } });
        await prisma.story.update({
            where: { id: storyId },
            data: { likes: totalReactions },
        });

        // Get updated reaction counts
        const countsMap = await getReactionCounts([storyId]);
        const reactions = countsMap[storyId] || defaultReactions();

        // Emit real-time event
        const io = getIO();
        io.emit("story-reaction", {
            storyId,
            reactions,
            totalReactions,
        });

        res.json({ storyId, reactions, totalReactions });
    } catch (error) {
        console.error("Error en reacción:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// DELETE /api/stories/:id/react
export const removeReaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type, sessionId } = req.body;

        const storyId = Number(id);

        // Delete the reaction if it exists
        await prisma.reaction.deleteMany({
            where: { storyId, type, sessionId },
        });

        // Update cached likes count
        const totalReactions = await prisma.reaction.count({ where: { storyId } });
        await prisma.story.update({
            where: { id: storyId },
            data: { likes: totalReactions },
        });

        // Get updated reaction counts
        const countsMap = await getReactionCounts([storyId]);
        const reactions = countsMap[storyId] || defaultReactions();

        // Emit real-time event
        const io = getIO();
        io.emit("story-reaction", {
            storyId,
            reactions,
            totalReactions,
        });

        res.json({ storyId, reactions, totalReactions });
    } catch (error) {
        console.error("Error eliminando reacción:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

// GET /api/stories/trending
export const getTrending = async (_req: Request, res: Response): Promise<void> => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const stories = await prisma.story.findMany({
            where: {
                createdAt: { gte: oneWeekAgo },
                likes: { gt: 0 },
            },
            select: {
                id: true,
                content: true,
                category: true,
                latitude: true,
                longitude: true,
                createdAt: true,
                likes: true,
            },
            orderBy: { likes: "desc" },
            take: 10,
        });

        // Attach reaction counts
        const storyIds = stories.map((s) => s.id);
        const countsMap = await getReactionCounts(storyIds);

        const storiesWithReactions = stories.map((s) => ({
            ...s,
            reactions: countsMap[s.id] || defaultReactions(),
        }));

        res.json(storiesWithReactions);
    } catch (error) {
        console.error("Error obteniendo trending:", error);
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
