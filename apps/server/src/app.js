// app.js

import "dotenv/config";
import express from "express";
import morgan from "morgan";
import routes from "./routes/index.js";
import { attachUser } from "./middleware/auth.middleware.js";
import { notFound, errorHandler } from "./middleware/error.js"; // <-- add

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachUser);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.use(routes);

// API fallback
app.use(notFound);
app.use(errorHandler);

export default app;
