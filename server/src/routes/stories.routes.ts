import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validation";
import { createStorySchema, reportStorySchema } from "../schemas/story.schema";
import {
    getStories,
    getStoryById,
    createStory,
    likeStory,
    unlikeStory,
    reportStory,
} from "../controllers/stories.controller";

const router = Router();

// Rate limiter para creación de historias
const createStoryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: "⛔ Calma, vaquero. Has publicado mucho." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para reportes
const reportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Has reportado demasiadas veces. Intenta más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
router.get("/stories", getStories);
router.get("/stories/:id", getStoryById);
router.post("/stories", createStoryLimiter, validate(createStorySchema), createStory);
router.patch("/stories/:id/like", likeStory);
router.patch("/stories/:id/unlike", unlikeStory);
router.post("/stories/:id/report", reportLimiter, validate(reportStorySchema), reportStory);

export default router;
