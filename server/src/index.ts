import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupSocket } from "./socket/socketHandler";
import storiesRouter from "./routes/stories.routes";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render
app.set("trust proxy", 1);

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "API viva" });
});

// Routes
app.use("/api", storiesRouter);

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.io and start server
const httpServer = setupSocket(app);

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Servidor (HTTP + Sockets) corriendo en http://localhost:${PORT}`
  );
});