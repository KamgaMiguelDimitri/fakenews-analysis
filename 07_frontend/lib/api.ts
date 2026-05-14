// ============================================================
// Fichier  : lib/api.ts
// Rôle     : Client HTTP vers l'API FastAPI
// Projet   : FakeNews Analyzer — DevComplex
// ============================================================

const API_BASE =
  typeof window !== "undefined"
    ? "/api/proxy"
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

export interface PredictResponse {
  label: "FAKE" | "REAL";
  confidence: number;
  fake_probability: number;
  real_probability: number;
  model_used: string;
  processing_time_ms: number;
  nlp_features?: {
    word_count: number;
    sentiment_score: number;
    capital_ratio: number;
    exclamation_count: number;
    question_count: number;
  };
  _simulated?: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const analyzeText = (text: string) =>
  apiFetch<PredictResponse>("/api/predict", {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const analyzeBatch = (texts: string[]) =>
  apiFetch<{ results: PredictResponse[]; total: number; processing_time_ms: number }>(
    "/api/predict/batch",
    { method: "POST", body: JSON.stringify({ texts }) }
  );

export const getKpis = () =>
  apiFetch<Record<string, number | string>>("/api/kpis");

export const getModelStats = () =>
  apiFetch<Record<string, unknown>>("/api/stats/model");

export const getHistory = (limit = 50) =>
  apiFetch<{ predictions: PredictResponse[]; total: number }>(`/api/history?limit=${limit}`);

export const getHealth = () =>
  apiFetch<{ status: string; model_loaded: boolean; model_name: string }>("/api/health");
