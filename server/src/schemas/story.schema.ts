import { z } from "zod";

export const createStorySchema = z.object({
    content: z
        .string()
        .min(10, "La historia debe tener al menos 10 caracteres")
        .max(500, "La historia no puede superar 500 caracteres"),
    category: z.enum(["Miedo", "Amor", "Crimen", "Curiosidad"], {
        error: "Categoría inválida",
    }),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export const reportStorySchema = z.object({
    reason: z
        .string()
        .min(5, "El motivo debe tener al menos 5 caracteres")
        .max(300, "El motivo no puede superar 300 caracteres"),
});

export const reactStorySchema = z.object({
    type: z.enum(["shock", "sad", "fire", "laugh", "love"], {
        error: "Tipo de reacción inválido",
    }),
    sessionId: z.string().min(1, "sessionId es requerido"),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type ReportStoryInput = z.infer<typeof reportStorySchema>;
export type ReactStoryInput = z.infer<typeof reactStorySchema>;

