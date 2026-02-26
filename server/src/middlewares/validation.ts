import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.issues.map(
                (issue: z.core.$ZodIssue) => issue.message
            );
            res.status(400).json({
                error: "Datos inválidos",
                details: messages,
            });
            return;
        }
        req.body = result.data;
        next();
    };
};
