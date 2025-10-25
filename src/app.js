// app.js

import "dotenv/config";
import express from "express";
import morgan from "morgan";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js"; // <-- add

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(process.cwd(), "src", "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout"); // uses src/views/layout.ejs

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.use(routes);

// NEW: centralized handlers
app.use(notFound);
app.use(errorHandler);

export default app; // agent: hello-world
// agent: hello-world