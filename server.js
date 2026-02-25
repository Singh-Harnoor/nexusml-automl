"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var vite_1 = require("vite");
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var url_1 = require("url");
var adm_zip_1 = require("adm-zip");
var papaparse_1 = require("papaparse");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var db = new better_sqlite3_1.default("/tmp/automl.db");
// Initialize Database
db.exec("\n  CREATE TABLE IF NOT EXISTS datasets (\n    id TEXT PRIMARY KEY,\n    name TEXT NOT NULL,\n    type TEXT NOT NULL,\n    size INTEGER,\n    rows INTEGER,\n    columns TEXT,\n    data TEXT,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n  );\n\n  CREATE TABLE IF NOT EXISTS experiments (\n    id TEXT PRIMARY KEY,\n    dataset_id TEXT,\n    name TEXT NOT NULL,\n    model_type TEXT NOT NULL,\n    status TEXT DEFAULT 'pending',\n    hyperparameters TEXT,\n    metrics TEXT,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(dataset_id) REFERENCES datasets(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS training_logs (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    experiment_id TEXT,\n    epoch INTEGER,\n    loss REAL,\n    accuracy REAL,\n    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(experiment_id) REFERENCES experiments(id)\n  );\n");
// Migration: Add 'data' column if it doesn't exist
var tableInfo = db.prepare("PRAGMA table_info(datasets)").all();
var hasDataColumn = tableInfo.some(function (col) { return col.name === 'data'; });
if (!hasDataColumn) {
    db.exec("ALTER TABLE datasets ADD COLUMN data TEXT");
}
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var app, PORT, vite;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = (0, express_1.default)();
                    PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
                    app.use(express_1.default.json({ limit: "50mb" }));
                    app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
                    // API Routes
                    app.get("/api/datasets", function (req, res) {
                        var datasets = db.prepare("SELECT * FROM datasets ORDER BY created_at DESC").all();
                        res.json(datasets);
                    });
                    app.post("/api/datasets", function (req, res) {
                        var _a = req.body, id = _a.id, name = _a.name, type = _a.type, size = _a.size, rows = _a.rows, columns = _a.columns, data = _a.data;
                        db.prepare("INSERT INTO datasets (id, name, type, size, rows, columns, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
                            .run(id, name, type, size, rows, JSON.stringify(columns), JSON.stringify(data));
                        res.status(201).json({ success: true });
                    });
                    app.delete("/api/datasets/:id", function (req, res) {
                        db.prepare("DELETE FROM datasets WHERE id = ?").run(req.params.id);
                        res.json({ success: true });
                    });
                    app.get("/api/experiments", function (req, res) {
                        var experiments = db.prepare("\n      SELECT e.*, d.name as dataset_name \n      FROM experiments e \n      LEFT JOIN datasets d ON e.dataset_id = d.id \n      ORDER BY e.created_at DESC\n    ").all();
                        res.json(experiments);
                    });
                    app.post("/api/experiments", function (req, res) {
                        var _a = req.body, id = _a.id, dataset_id = _a.dataset_id, name = _a.name, model_type = _a.model_type, hyperparameters = _a.hyperparameters;
                        db.prepare("INSERT INTO experiments (id, dataset_id, name, model_type, hyperparameters) VALUES (?, ?, ?, ?, ?)")
                            .run(id, dataset_id, name, model_type, JSON.stringify(hyperparameters));
                        res.status(201).json({ success: true });
                    });
                    app.post("/api/experiments/:id/run", function (req, res) {
                        var id = req.params.id;
                        // Simulate training process
                        db.prepare("UPDATE experiments SET status = 'running' WHERE id = ?").run(id);
                        // In a real app, this would be a background task. 
                        // Here we'll simulate it with a loop that inserts logs.
                        var accuracy = 0.1;
                        var loss = 2.5;
                        for (var i = 1; i <= 10; i++) {
                            accuracy += Math.random() * 0.08;
                            loss -= Math.random() * 0.2;
                            if (accuracy > 0.99)
                                accuracy = 0.99;
                            if (loss < 0.1)
                                loss = 0.1;
                            db.prepare("INSERT INTO training_logs (experiment_id, epoch, loss, accuracy) VALUES (?, ?, ?, ?)")
                                .run(id, i, loss, accuracy);
                        }
                        db.prepare("UPDATE experiments SET status = 'completed', metrics = ? WHERE id = ?")
                            .run(JSON.stringify({ final_accuracy: accuracy, final_loss: loss }), id);
                        res.json({ success: true });
                    });
                    app.get("/api/experiments/:id/logs", function (req, res) {
                        var logs = db.prepare("SELECT * FROM training_logs WHERE experiment_id = ? ORDER BY epoch ASC").all(req.params.id);
                        res.json(logs);
                    });
                    app.post("/api/experiments/auto-run", function (req, res) {
                        var dataset_id = req.body.dataset_id;
                        var models = ['Random Forest', 'XGBoost', 'Neural Network', 'Logistic Regression'];
                        var results = [];
                        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
                            var modelType = models_1[_i];
                            var id = Math.random().toString(36).substring(7);
                            var name_1 = "Auto: ".concat(modelType, " Search");
                            var hyperparameters = {
                                n_estimators: Math.floor(Math.random() * 200) + 50,
                                max_depth: Math.floor(Math.random() * 20) + 5,
                                learning_rate: Math.random() * 0.1
                            };
                            db.prepare("INSERT INTO experiments (id, dataset_id, name, model_type, hyperparameters, status) VALUES (?, ?, ?, ?, ?, ?)")
                                .run(id, dataset_id, name_1, modelType, JSON.stringify(hyperparameters), 'completed');
                            // Simulate training logs for each
                            var accuracy = 0.5 + Math.random() * 0.4;
                            var loss = 1.0 - Math.random() * 0.8;
                            for (var i = 1; i <= 5; i++) {
                                var epochAcc = accuracy * (0.8 + (i / 5) * 0.2);
                                var epochLoss = loss * (1.2 - (i / 5) * 0.2);
                                db.prepare("INSERT INTO training_logs (experiment_id, epoch, loss, accuracy) VALUES (?, ?, ?, ?)")
                                    .run(id, i, epochLoss, epochAcc);
                            }
                            db.prepare("UPDATE experiments SET metrics = ? WHERE id = ?")
                                .run(JSON.stringify({ final_accuracy: accuracy, final_loss: loss }), id);
                            results.push({ id: id, modelType: modelType, accuracy: accuracy });
                        }
                        // Sort to find best
                        results.sort(function (a, b) { return b.accuracy - a.accuracy; });
                        var bestModel = results[0];
                        res.json({ success: true, best_model: bestModel });
                    });
                    app.get("/api/experiments/:id/report", function (req, res) {
                        var experiment = db.prepare("\n      SELECT e.*, d.name as dataset_name, d.columns as dataset_columns\n      FROM experiments e \n      LEFT JOIN datasets d ON e.dataset_id = d.id \n      WHERE e.id = ?\n    ").get(req.params.id);
                        if (!experiment)
                            return res.status(404).json({ error: "Experiment not found" });
                        var logs = db.prepare("SELECT * FROM training_logs WHERE experiment_id = ? ORDER BY epoch ASC").all(req.params.id);
                        // Simple HTML report generation
                        var reportHtml = "\n      <html>\n        <head>\n          <style>\n            body { font-family: sans-serif; padding: 40px; color: #334155; }\n            h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }\n            .section { margin-bottom: 30px; }\n            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }\n            .value { font-size: 18px; margin-top: 5px; }\n            table { width: 100%; border-collapse: collapse; margin-top: 20px; }\n            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }\n            th { bg-color: #f8fafc; }\n          </style>\n        </head>\n        <body>\n          <h1>Experiment Report: ".concat(experiment.name, "</h1>\n          <div class=\"section\">\n            <div class=\"label\">Model Type</div>\n            <div class=\"value\">").concat(experiment.model_type, "</div>\n          </div>\n          <div class=\"section\">\n            <div class=\"label\">Dataset</div>\n            <div class=\"value\">").concat(experiment.dataset_name, "</div>\n          </div>\n          <div class=\"section\">\n            <div class=\"label\">Status</div>\n            <div class=\"value\">").concat(experiment.status, "</div>\n          </div>\n          <div class=\"section\">\n            <div class=\"label\">Hyperparameters</div>\n            <pre>").concat(JSON.stringify(JSON.parse(experiment.hyperparameters), null, 2), "</pre>\n          </div>\n          <div class=\"section\">\n            <h2>Training History</h2>\n            <table>\n              <thead>\n                <tr>\n                  <th>Epoch</th>\n                  <th>Loss</th>\n                  <th>Accuracy</th>\n                </tr>\n              </thead>\n              <tbody>\n                ").concat(logs.map(function (log) { return "\n                  <tr>\n                    <td>".concat(log.epoch, "</td>\n                    <td>").concat(log.loss.toFixed(4), "</td>\n                    <td>").concat((log.accuracy * 100).toFixed(2), "%</td>\n                  </tr>\n                "); }).join(''), "\n              </tbody>\n            </table>\n          </div>\n        </body>\n      </html>\n    ");
                        res.setHeader('Content-Type', 'text/html');
                        res.send(reportHtml);
                    });
                    app.post("/api/datasets/:id/preprocess", function (req, res) {
                        var id = req.params.id;
                        var steps = req.body.steps;
                        // In a real app, this would trigger a data processing pipeline.
                        // For the MVP, we'll just log it and return success.
                        console.log("Preprocessing dataset ".concat(id, " with steps:"), steps);
                        res.json({ success: true, message: "Preprocessing pipeline initiated" });
                    });
                    app.post("/api/kaggle/import", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var slug, username, key, _a, owner, dataset, auth, metaUrl, metaRes, metadata, downloadUrl, downloadRes, buffer, contentType, csvContent, zip, zipEntries, csvEntries, mainCsv, parsed, id, sampleData, newDataset, error_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    slug = req.body.slug;
                                    username = process.env.KAGGLE_USERNAME;
                                    key = process.env.KAGGLE_KEY || process.env.KAGGLE_API_TOKEN;
                                    if (!username || !key) {
                                        return [2 /*return*/, res.status(400).json({ error: "Kaggle credentials (KAGGLE_USERNAME and KAGGLE_KEY/KAGGLE_API_TOKEN) not configured in environment variables." })];
                                    }
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 6, , 7]);
                                    _a = slug.split('/'), owner = _a[0], dataset = _a[1];
                                    auth = Buffer.from("".concat(username, ":").concat(key)).toString('base64');
                                    metaUrl = "https://www.kaggle.com/api/v1/datasets/view/".concat(owner, "/").concat(dataset);
                                    return [4 /*yield*/, fetch(metaUrl, {
                                            headers: { 'Authorization': "Basic ".concat(auth) }
                                        })];
                                case 2:
                                    metaRes = _b.sent();
                                    if (!metaRes.ok) {
                                        throw new Error("Kaggle API error: ".concat(metaRes.statusText));
                                    }
                                    return [4 /*yield*/, metaRes.json()];
                                case 3:
                                    metadata = _b.sent();
                                    downloadUrl = "https://www.kaggle.com/api/v1/datasets/download/".concat(owner, "/").concat(dataset);
                                    return [4 /*yield*/, fetch(downloadUrl, {
                                            headers: { 'Authorization': "Basic ".concat(auth) }
                                        })];
                                case 4:
                                    downloadRes = _b.sent();
                                    if (!downloadRes.ok) {
                                        throw new Error("Failed to download dataset: ".concat(downloadRes.statusText));
                                    }
                                    return [4 /*yield*/, downloadRes.arrayBuffer()];
                                case 5:
                                    buffer = _b.sent();
                                    contentType = downloadRes.headers.get('content-type');
                                    csvContent = '';
                                    if ((contentType === null || contentType === void 0 ? void 0 : contentType.includes('application/zip')) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes('application/x-zip-compressed'))) {
                                        try {
                                            zip = new adm_zip_1.default(Buffer.from(buffer));
                                            zipEntries = zip.getEntries();
                                            csvEntries = zipEntries.filter(function (entry) { return !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv'); });
                                            if (csvEntries.length === 0) {
                                                throw new Error("No CSV file found in the Kaggle dataset zip archive.");
                                            }
                                            mainCsv = csvEntries.sort(function (a, b) { return b.header.size - a.header.size; })[0];
                                            csvContent = mainCsv.getData().toString('utf8');
                                        }
                                        catch (e) {
                                            if (e.message.includes("No CSV file"))
                                                throw e;
                                            // If zip parsing fails, maybe it's actually a CSV
                                            csvContent = Buffer.from(buffer).toString('utf8');
                                        }
                                    }
                                    else {
                                        // Assume it's a direct CSV download
                                        csvContent = Buffer.from(buffer).toString('utf8');
                                    }
                                    if (!csvContent || !csvContent.includes(',')) {
                                        throw new Error("The downloaded content does not appear to be a valid CSV file.");
                                    }
                                    parsed = papaparse_1.default.parse(csvContent, {
                                        header: true,
                                        skipEmptyLines: true
                                    });
                                    id = Math.random().toString(36).substring(7);
                                    sampleData = parsed.data.slice(0, 500);
                                    newDataset = {
                                        id: id,
                                        name: "[Kaggle] ".concat(metadata.title || dataset),
                                        type: 'kaggle',
                                        size: buffer.byteLength,
                                        rows: parsed.data.length,
                                        columns: parsed.meta.fields || [],
                                        data: sampleData
                                    };
                                    db.prepare("INSERT INTO datasets (id, name, type, size, rows, columns, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
                                        .run(newDataset.id, newDataset.name, newDataset.type, newDataset.size, newDataset.rows, JSON.stringify(newDataset.columns), JSON.stringify(newDataset.data));
                                    res.status(201).json({ success: true, dataset: newDataset });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_1 = _b.sent();
                                    console.error("Kaggle Import Error:", error_1);
                                    res.status(500).json({ error: error_1.message || "Failed to import from Kaggle" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            server: { middlewareMode: true },
                            appType: "spa",
                        })];
                case 1:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 3];
                case 2:
                    app.use(express_1.default.static(path_1.default.join(__dirname, "dist")));
                    app.get("*", function (req, res) {
                        res.sendFile(path_1.default.join(__dirname, "dist/index.html"));
                    });
                    _a.label = 3;
                case 3:
                    app.listen(PORT, "0.0.0.0", function () {
                        console.log("Server running on http://localhost:".concat(PORT));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
startServer();
