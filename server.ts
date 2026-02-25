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

// Store database in the project root for local persistence
const db = new Database(path.join(__dirname, "automl.db"));

// Initialize Database Schema
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

// Migration: Ensure 'data' column exists
const tableInfo = db.prepare("PRAGMA table_info(datasets)").all();
if (!tableInfo.some((col: any) => col.name === 'data')) {
  db.exec("ALTER TABLE datasets ADD COLUMN data TEXT");
}

async function startServer() {
  const app = express();
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  // 1. ROBUST CORS CONFIGURATION
  // This allows your GitHub Pages URL to talk to your local machine
  app.use(cors({
    origin: true, // Reflects the request origin, allowing any site to access (useful for local dev/GH pages testing)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 2. GITHUB PAGES PATH COMPATIBILITY
  // If your GH pages is at /nexusml-automl/, it might try to call /nexusml-automl/api/...
  // This middleware strips the prefix so the routes below still work.
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

  app.delete("/api/datasets/:id", (req, res) => {
    db.prepare("DELETE FROM datasets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
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

  app.post("/api/experiments/:id/run", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE experiments SET status = 'running' WHERE id = ?").run(id);
    
    let accuracy = 0.1, loss = 2.5;
    for (let i = 1; i <= 10; i++) {
      accuracy += Math.random() * 0.08;
      loss -= Math.random() * 0.2;
      db.prepare("INSERT INTO training_logs (experiment_id, epoch, loss, accuracy) VALUES (?, ?, ?, ?)")
        .run(id, i, Math.max(loss, 0.1), Math.min(accuracy, 0.99));
    }
    
    db.prepare("UPDATE experiments SET status = 'completed', metrics = ? WHERE id = ?")
      .run(JSON.stringify({ final_accuracy: accuracy, final_loss: loss }), id);
    res.json({ success: true });
  });

  app.get("/api/experiments/:id/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM training_logs WHERE experiment_id = ? ORDER BY epoch ASC").all(req.params.id);
    res.json(logs);
  });

  app.post("/api/experiments/auto-run", (req, res) => {
    const { dataset_id } = req.body;
    const models = ['Random Forest', 'XGBoost', 'Neural Network', 'Logistic Regression'];
    const results = [];

    for (const modelType of models) {
      const id = Math.random().toString(36).substring(7);
      const hyperparameters = { n_estimators: 100, max_depth: 10 };
      
      db.prepare("INSERT INTO experiments (id, dataset_id, name, model_type, hyperparameters, status) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, dataset_id, `Auto: ${modelType}`, modelType, JSON.stringify(hyperparameters), 'completed');

      let acc = 0.7 + Math.random() * 0.2;
      db.prepare("UPDATE experiments SET metrics = ? WHERE id = ?").run(JSON.stringify({ final_accuracy: acc }), id);
      results.push({ id, modelType, accuracy: acc });
    }
    res.json({ success: true, best_model: results.sort((a,b) => b.accuracy - a.accuracy)[0] });
  });

  app.post("/api/kaggle/import", async (req, res) => {
    const { slug } = req.body;
    const username = process.env.KAGGLE_USERNAME;
    const key = process.env.KAGGLE_KEY || process.env.KAGGLE_API_TOKEN;

    if (!username || !key) return res.status(400).json({ error: "Kaggle credentials not found." });

    try {
      const [owner, dataset] = slug.split('/');
      const auth = Buffer.from(`${username}:${key}`).toString('base64');
      const downloadRes = await fetch(`https://www.kaggle.com/api/v1/datasets/download/${owner}/${dataset}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      const buffer = await downloadRes.arrayBuffer();
      const zip = new AdmZip(Buffer.from(buffer));
      const csvEntry = zip.getEntries().find(e => e.entryName.endsWith('.csv'));
      if (!csvEntry) throw new Error("No CSV found");

      const csvContent = csvEntry.getData().toString('utf8');
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      const id = Math.random().toString(36).substring(7);

      db.prepare("INSERT INTO datasets (id, name, type, size, rows, columns, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, `[Kaggle] ${dataset}`, 'kaggle', buffer.byteLength, parsed.data.length, JSON.stringify(parsed.meta.fields), JSON.stringify(parsed.data.slice(0, 100)));

      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Vite & Static Assets ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Local Server running at http://localhost:${PORT}`);
    console.log(`📡 Accepting requests from GitHub Pages\n`);
  });
}

startServer();