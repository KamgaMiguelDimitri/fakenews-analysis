// ============================================================
// Fichier  : lib/mock-data.ts
// Rôle     : Générateurs de données mock reproductibles
// Projet   : FakeNews Analyzer — DevComplex
// ============================================================

import type { PredictResponse } from "./api";

/** Pseudo-random number seeded by value */
function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Generate mock hourly time series for the last N hours */
export function generateTimeSeries(hours = 24): Array<{ time: string; fake: number; real: number; total: number }> {
  return Array.from({ length: hours }, (_, i) => {
    const d = new Date(Date.now() - (hours - 1 - i) * 3_600_000);
    const hour = d.getHours().toString().padStart(2, "0") + ":00";
    const seed = i * 7 + 42;
    const fake = Math.round(seededRand(seed) * 40 + 5);
    const real = Math.round(seededRand(seed + 1) * 60 + 10);
    return { time: hour, fake, real, total: fake + real };
  });
}

/** Weekly data */
export function generateWeeklyData(): Array<{ day: string; fake: number; real: number }> {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  return days.map((day, i) => ({
    day,
    fake: Math.round(seededRand(i * 13 + 5) * 200 + 50),
    real: Math.round(seededRand(i * 13 + 6) * 300 + 100),
  }));
}

/** Confidence distribution buckets */
export function generateConfidenceDist(): Array<{ range: string; count: number }> {
  const buckets = ["50-60%", "60-70%", "70-80%", "80-90%", "90-100%"];
  const values = [45, 112, 198, 234, 187];
  return buckets.map((range, i) => ({ range, count: values[i] }));
}

/** Source breakdown */
export function generateSourceData(): Array<{ source: string; fake: number; real: number; total: number }> {
  return [
    { source: "Twitter/X",   fake: 312, real: 189, total: 501 },
    { source: "News sites",  fake: 145, real: 423, total: 568 },
    { source: "Blogs",       fake: 234, real: 112, total: 346 },
    { source: "Reddit",      fake: 89,  real: 201, total: 290 },
    { source: "Autres",      fake: 67,  real: 134, total: 201 },
  ];
}

/** Mock prediction history */
export function generateHistory(count = 20): Array<{ id: string; text: string; result: PredictResponse; timestamp: Date }> {
  const snippets = [
    "Scientists discover new treatment for cancer using quantum computing",
    "Government secretly poisoning water supply with chemtrails",
    "Stock market reaches all-time high amid economic optimism",
    "5G towers cause COVID-19 according to leaked documents",
    "Climate change report shows record temperatures globally",
    "Vaccine contains microchips for population tracking",
    "EU announces new renewable energy targets for 2030",
    "Moon landing was filmed in a Hollywood studio",
    "New study confirms benefits of Mediterranean diet",
    "Celebrities clone themselves to avoid paparazzi",
  ];

  return Array.from({ length: count }, (_, i) => {
    const seed = i * 17 + 3;
    const fakeProbRaw = seededRand(seed);
    const fakeProbability = Math.round(fakeProbRaw * 8000 + 1000) / 10000;
    const realProbability = Math.round((1 - fakeProbability) * 10000) / 10000;
    const label: "FAKE" | "REAL" = fakeProbability > 0.5 ? "FAKE" : "REAL";
    const confidence = Math.max(fakeProbability, realProbability);
    const snippet = snippets[i % snippets.length];

    return {
      id: `pred_${i.toString().padStart(4, "0")}`,
      text: snippet,
      timestamp: new Date(Date.now() - i * 3_600_000 * seededRand(i + 99)),
      result: {
        label,
        confidence: Math.round(confidence * 10000) / 10000,
        fake_probability: fakeProbability,
        real_probability: realProbability,
        model_used: "distilbert",
        processing_time_ms: Math.round(seededRand(seed + 2) * 400 + 80),
        _simulated: true,
      } satisfies PredictResponse,
    };
  });
}

/** Mock KPIs */
export const MOCK_KPIS = {
  total_predictions: 1906,
  fake_count: 847,
  real_count: 1059,
  avg_confidence: 0.823,
  avg_processing_ms: 142,
  session_analyses: 0,
};

/** Mock stream items */
export type StreamItem = {
  id: string;
  text: string;
  source: string;
  result: PredictResponse;
  timestamp: Date;
  flagged: boolean;
};

export function generateStreamItem(idx: number): StreamItem {
  const sources = ["@user_twitter", "reddit.com/r/news", "bbc.com", "blog.medium.com", "t.me/channel"];
  const texts = [
    "Breaking: Major earthquake hits coastal region, thousands displaced",
    "EXCLUSIVE: Top secret documents prove aliens landed in 1952",
    "New AI model beats humans at all complex reasoning tasks",
    "URGENT: All vaccinated people will die within 5 years",
    "EU parliament passes landmark digital privacy legislation",
    "Scientists prove the earth is actually flat, NASA admits",
    "Renewable energy now cheaper than fossil fuels worldwide",
    "Bill Gates funding mind control drug in coffee supply",
    "Apple releases revolutionary new battery technology",
    "Global elite planning to eliminate 90% of population",
  ];
  const seed = idx * 31 + 7;
  const fakeProbability = Math.round(seededRand(seed) * 8500 + 750) / 10000;
  const realProbability = Math.round((1 - fakeProbability) * 10000) / 10000;
  const label: "FAKE" | "REAL" = fakeProbability > 0.5 ? "FAKE" : "REAL";
  const confidence = Math.max(fakeProbability, realProbability);

  return {
    id: `stream_${idx}`,
    text: texts[idx % texts.length],
    source: sources[idx % sources.length],
    timestamp: new Date(),
    flagged: confidence > 0.85 && label === "FAKE",
    result: {
      label,
      confidence: Math.round(confidence * 10000) / 10000,
      fake_probability: fakeProbability,
      real_probability: realProbability,
      model_used: "distilbert",
      processing_time_ms: Math.round(seededRand(seed + 5) * 350 + 60),
      _simulated: true,
    },
  };
}
