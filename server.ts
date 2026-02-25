import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import Papa from "papaparse";
import cors from "cors"; // Added for GH Pages compatibility

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Changed to local directory so it works across all OS environments locally
const db = new Database(path.join(__dirname, "automl.db"));

// Initialize Database
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

// Migration logic
const tableInfo = db.prepare("PRAGMA table_info(datasets)").all();
const hasDataColumn = tableInfo.some((col: any) => col.name === 'data');
if (!hasDataColumn) {
  db.exec("ALTER TABLE datasets ADD COLUMN data TEXT");
}

async function startServer() {
  const app = express();
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  // 1. ENABLE CORS: This is crucial for GitHub Pages. 
  // It allows your browser to send requests from 'username.github.io' to 'localhost:8080'
  app.use(cors()); 

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
    
    let accuracy = 0.1;
    let loss = 2.5;
    for (let i = 1; i <= 10; i++) {
      accuracy += Math.random() * 0.08;
      loss -= Math.random() * 0.2;
      if (accuracy > 0.99) accuracy = 0.99;
      if (loss < 0.1) loss = 0.1;
      db.prepare("INSERT INTO training_logs (experiment_id, epoch, loss, accuracy) VALUES (?, ?, ?, ?)")
        .run(id, i, loss, accuracy);
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
      const name = `Auto: ${modelType} Search`;
      const hyperparameters = {
        n_estimators: Math.floor(Math.random() * 200) + 50,
        max_depth: Math.floor(Math.random() * 20) + 5,
        learning_rate: Math.random() * 0.1
      };

      db.prepare("INSERT INTO experiments (id, dataset_id, name, model_type, hyperparameters, status) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, dataset_id, name, modelType, JSON.stringify(hyperparameters), 'completed');

      let accuracy = 0.5 + Math.random() * 0.4;
      let loss = 1.0 - Math.random() * 0.8;
      for (let i = 1; i <= 5; i++) {
        const epochAcc = accuracy * (0.8 + (i/5) * 0.2);
        const epochLoss = loss * (1.2 - (i/5) * 0.2);
        db.prepare("INSERT INTO training_logs (experiment_id, epoch, loss, accuracy) VALUES (?, ?, ?, ?)")
          .run(id, i, epochLoss, epochAcc);
      }
      db.prepare("UPDATE experiments SET metrics = ? WHERE id = ?").run(JSON.stringify({ final_accuracy: accuracy, final_loss: loss }), id);
      results.push({ id, modelType, accuracy });
    }
    results.sort((a, b) => b.accuracy - a.accuracy);
    res.json({ success: true, best_model: results[0] });
  });

  app.get("/api/experiments/:id/report", (req, res) => {
    const experiment = db.prepare(`
      SELECT e.*, d.name as dataset_name, d.columns as dataset_columns
      FROM experiments e 
      LEFT JOIN datasets d ON e.dataset_id = d.id 
      WHERE e.id = ?
    `).get(req.params.id) as any;

    if (!experiment) return res.status(404).json({ error: "Experiment not found" });
    const logs = db.prepare("SELECT * FROM training_logs WHERE experiment_id = ? ORDER BY epoch ASC").all(req.params.id) as any[];
    
    const reportHtml = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .section { margin-bottom: 30px; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 18px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Experiment Report: ${experiment.name}</h1>
          <div class="section"><div class="label">Model Type</div><div class="value">${experiment.model_type}</div></div>
          <div class="section"><div class="label">Dataset</div><div class="value">${experiment.dataset_name}</div></div>
          <div class="section"><h2>Training History</h2>
            <table>
              <thead><tr><th>Epoch</th><th>Loss</th><th>Accuracy</th></tr></thead>
              <tbody>${logs.map(log => `<tr><td>${log.epoch}</td><td>${log.loss.toFixed(4)}</td><td>${(log.accuracy * 100).toFixed(2)}%</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(reportHtml);
  });

  app.post("/api/kaggle/import", async (req, res) => {
    const { slug } = req.body;
    const username = process.env.KAGGLE_USERNAME;
    const key = process.env.KAGGLE_KEY || process.env.KAGGLE_API_TOKEN;

    if (!username || !key) {
      return res.status(400).json({ error: "Kaggle credentials missing in environment." });
    }

    try {
      const [owner, dataset] = slug.split('/');
      const auth = Buffer.from(`${username}:${key}`).toString('base64');
      const metaRes = await fetch(`https://www.kaggle.com/api/v1/datasets/view/${owner}/${dataset}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      const metadata: any = await metaRes.json();
      const downloadRes = await fetch(`https://www.kaggle.com/api/v1/datasets/download/${owner}/${dataset}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      const buffer = await downloadRes.arrayBuffer();
      let csvContent = '';
      const zip = new AdmZip(Buffer.from(buffer));
      const csvEntries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.toLowerCase().endsWith('.csv'));
      csvContent = csvEntries.sort((a, b) => b.header.size - a.header.size)[0].getData().toString('utf8');

      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      const id = Math.random().toString(36).substring(7);
      
      db.prepare("INSERT INTO datasets (id, name, type, size, rows, columns, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, `[Kaggle] ${metadata.title}`, 'kaggle', buffer.byteLength, parsed.data.length, JSON.stringify(parsed.meta.fields), JSON.stringify(parsed.data.slice(0, 500)));

      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite & Static Handling ---
  // In development, keep Vite middleware.
  // In production (GitHub Pages scenario), the backend remains just an API.
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // If you are running the backend locally while the frontend is on GH Pages,
    // this section is technically unused by the user, but kept for local "prod" testing.
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
    console.log(`CORS enabled for GitHub Pages compatibility.`);
  });
}

startServer();