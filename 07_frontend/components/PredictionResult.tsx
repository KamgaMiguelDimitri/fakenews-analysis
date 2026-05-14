"use client";

import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import type { PredictResponse } from "../lib/api";

interface Props {
  result: PredictResponse;
}

export default function PredictionResult({ result }: Props) {
  const isFake = result.label === "FAKE";
  const confPct = Math.round(result.confidence * 100);

  const contextMessage =
    result.confidence >= 0.9
      ? { text: "Prédiction très fiable", Icon: CheckCircle }
      : result.confidence >= 0.7
      ? { text: "Prédiction probable — vérifiez avec d'autres sources", Icon: Info }
      : { text: "Résultat incertain — interpréter avec prudence", Icon: AlertTriangle };

  const { text: ctxText, Icon } = contextMessage;
  const accentColor = isFake ? "#ff3333" : "#00ccaa";

  return (
    <div className="bg-surface border rounded-xl p-6 space-y-5" style={{ borderColor: accentColor + "66" }}>
      {/* Label + confiance */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-3xl font-bold"
          style={{ color: accentColor }}
        >
          {result.label}
        </span>
        <span className="font-mono text-lg text-slate-300">{confPct}% confiance</span>
      </div>

      {/* Barre de confiance */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${confPct}%`, backgroundColor: accentColor }}
        />
      </div>

      {/* Probabilités */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-background rounded-lg p-3 text-center">
          <div className="font-mono text-fake font-bold text-lg">{Math.round(result.fake_probability * 100)}%</div>
          <div className="text-slate-500 text-xs mt-1">Probabilité FAKE</div>
        </div>
        <div className="bg-background rounded-lg p-3 text-center">
          <div className="font-mono text-real font-bold text-lg">{Math.round(result.real_probability * 100)}%</div>
          <div className="text-slate-500 text-xs mt-1">Probabilité REAL</div>
        </div>
      </div>

      {/* Message contextuel */}
      <div className="flex items-start gap-2 text-slate-400 text-sm">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{ctxText}</span>
      </div>

      {/* Métadonnées */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-mono border-t border-border pt-3">
        <span>modèle : {result.model_used}</span>
        <span>temps : {result.processing_time_ms}ms</span>
        {result._simulated && <span className="text-yellow-500">⚠ simulation</span>}
        {result.nlp_features && (
          <>
            <span>mots : {result.nlp_features.word_count}</span>
            <span>sentiment : {result.nlp_features.sentiment_score}</span>
          </>
        )}
      </div>
    </div>
  );
}
