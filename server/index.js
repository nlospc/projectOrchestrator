import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getDb } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import bootstrapRouter from "./routes/bootstrap.js";
import projectsRouter from "./routes/projects.js";
import milestonesRouter from "./routes/milestones.js";
import commentsRouter from "./routes/comments.js";
import importsRouter from "./routes/imports.js";
import exportRouter from "./routes/exports.js";
import settingsRouter from "./routes/settings.js";
import linksRouter from "./routes/links.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const STATIC_ROOT = join(__dirname, "..");
const HOST = "0.0.0.0";

// Initialise DB + seed on first boot
getDb();
seedIfEmpty();

const app = express();
app.set("etag", false);
app.use(express.json({ limit: "50mb" }));
app.use("/api", (_req, res, next) => {
    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});

// API routes
app.use("/api", bootstrapRouter);
app.use("/api", projectsRouter);
app.use("/api", milestonesRouter);
app.use("/api", commentsRouter);
app.use("/api", importsRouter);
app.use("/api", exportRouter);
app.use("/api", settingsRouter);
app.use("/api", linksRouter);

// Static: serve repo root (index.html, app.js, src/, styles.css)
app.use(express.static(STATIC_ROOT));

// SPA fallback
app.get("*", (req, res) => {
    if (req.path.startsWith("/api"))
        return res.status(404).json({ error: "Not found" });
    res.sendFile(join(STATIC_ROOT, "index.html"));
});

app.listen(PORT, () => {
    console.log(`PMO Orchestrator running at http://${HOST}:${PORT}`);
});
