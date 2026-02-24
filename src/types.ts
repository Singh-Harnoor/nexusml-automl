export interface Dataset {
  id: string;
  name: string;
  type: 'csv' | 'json' | 'images' | 'sensor' | 'kaggle';
  size: number;
  rows: number;
  columns: string; // JSON string
  data?: string; // JSON string of rows
  created_at: string;
}

export interface Experiment {
  id: string;
  dataset_id: string;
  dataset_name?: string;
  name: string;
  model_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  hyperparameters: string; // JSON string
  metrics: string; // JSON string
  created_at: string;
}

export interface TrainingLog {
  id: number;
  experiment_id: string;
  epoch: number;
  loss: number;
  accuracy: number;
  timestamp: string;
}

export interface ModelMetrics {
  final_accuracy: number;
  final_loss: number;
}
