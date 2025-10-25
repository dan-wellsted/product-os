import app from "./app.js";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";

const port = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";
const serverRoot = process.cwd();
const clientDist = path.resolve(serverRoot, "../client/dist");
const indexHtmlPath = path.join(clientDist, "index.html");

function configureAssets() {
  if (isProd) {
    if (existsSync(clientDist)) {
      app.use(express.static(clientDist));
    }
  }
}

configureAssets();

if (isProd) {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/discovery/api") || req.path.startsWith("/health")) {
      return next();
    }
    if (existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
    return res.status(200).send("Client build missing. Run npm run build in apps/client.");
  });
} else {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/discovery/api") || req.path.startsWith("/health")) {
      return next();
    }
    res.status(200).json({ message: "Client dev server running on http://localhost:5173" });
  });
}

app.listen(port, () => {
  console.log(`Product OS server running on :${port} (${isProd ? "prod" : "dev"})`);
});
