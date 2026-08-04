import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import universityRoutes from "./routes/university.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "*" },
});

app.set("io", io); // accessible in routes via req.app.get("io")

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", limiter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

io.on("connection", (socket) => {
  socket.on("join", (userId) => socket.join(userId)); // room per user for targeted notifications
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`EthioStudentHub API running on port ${PORT}`));
