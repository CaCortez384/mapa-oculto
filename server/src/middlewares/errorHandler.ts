import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error("🔥 Error no manejado:", err);
    res.status(500).json({
        error: "Error interno del servidor",
    });
};
