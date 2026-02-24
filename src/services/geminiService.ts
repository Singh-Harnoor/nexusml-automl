import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyB5jVm-AutnOkWO5v3PmeI-eOJBJlsGoS8" });

export async function getDatasetInsights(datasetName: string, columns: string[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this dataset schema for an AutoML workflow:
  Dataset Name: ${datasetName}
  Columns: ${columns.join(", ")}
  
  Provide:
  1. Potential target variable.
  2. Suggested preprocessing steps (e.g., scaling, encoding).
  3. Recommended model types (e.g., Random Forest, XGBoost).
  4. Any potential data quality issues to watch for.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}

export async function suggestHyperparameters(modelType: string, datasetInfo: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Suggest optimal hyperparameter ranges for a ${modelType} model given this dataset context: ${datasetInfo}. Return the response in a structured format.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}
