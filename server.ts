import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import Papa from "papaparse";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database persistence in current directory
const db = new Database(path.join(__dirname, "automl.db"));

// Schema Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER,
    rows INTEGER,
    columns TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    dataset_id TEXT,
    name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    hyperparameters TEXT,
    metrics TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(dataset_id) REFERENCES datasets(id)
  );

  CREATE TABLE IF NOT EXISTS training_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_id TEXT,
    epoch INTEGER,
    loss REAL,
    accuracy REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(experiment_id) REFERENCES experiments(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 8080;

  // 1. GLOBAL CORS & PREFLIGHT HANDLING
  app.use(cors({
    origin: true, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 2. STRIP GITHUB REPO PREFIX
  app.use((req, res, next) => {
    if (req.url.startsWith('/nexusml-automl/api')) {
      req.url = req.url.replace('/nexusml-automl/api', '/api');
    }
    next();
  });

  // --- API Routes ---

  app.get("/api/datasets", (req, res) => {
    const datasets = db.prepare("SELECT * FROM datasets ORDER BY created_at DESC").all();
    res.json(datasets);
  });

  app.post("/api/datasets", (req, res) => {
    const { id, name, type, size, rows, columns, data } = req.body;
    db.prepare("INSERT INTO datasets (id, name, type, size, rows, columns, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, name, type, size, rows, JSON.stringify(columns), JSON.stringify(data));
    res.status(201).json({ success: true });
  });

  app.get("/api/experiments", (req, res) => {
    const experiments = db.prepare(`
      SELECT e.*, d.name as dataset_name 
      FROM experiments e 
      LEFT JOIN datasets d ON e.dataset_id = d.id 
      ORDER BY e.created_at DESC
    `).all();
    res.json(experiments);
  });

  app.post("/api/experiments", (req, res) => {
    const { id, dataset_id, name, model_type, hyperparameters } = req.body;
    db.prepare("INSERT INTO experiments (id, dataset_id, name, model_type, hyperparameters) VALUES (?, ?, ?, ?, ?)")
      .run(id, dataset_id, name, model_type, JSON.stringify(hyperparameters));
    res.status(201).json({ success: true });
  });

  app.get("/api/experiments/:id/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM training_logs WHERE experiment_id = ? ORDER BY epoch ASC").all(req.params.id);
    res.json(logs);
  });

  // --- Vite & Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist/index.html")));
  }

  // Use default listener for better local discovery
  app.listen(PORT, () => {
    console.log(`\n✅ SERVER IS LIVE`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🛠️ API: http://localhost:${PORT}/api/datasets`);
  });
}

startServer();