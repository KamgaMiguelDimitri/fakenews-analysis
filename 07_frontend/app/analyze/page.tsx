"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../components/Header";
import PredictionResult from "../../components/PredictionResult";
import { analyzeText } from "../../lib/api";
import type { PredictResponse } from "../../lib/api";

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ text: string; result: PredictResponse }>>([]);

  async function handleAnalyze() {
    if (!text.trim() || text.length < 10) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const prediction = await analyzeText(text);
      setResult(prediction);
      setHistory((prev) => [{ text: text.slice(0, 80) + "...", result: prediction }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-8">
        <div>
          <h1 className="font-mono text-2xl font-bold text-cyan-DEFAULT mb-2">Analyser un texte</h1>
          <p className="text-slate-400 text-sm">Collez un article, une déclaration ou un tweet pour détecter s'il est FAKE ou REAL.</p>
        </div>

        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez votre texte ici (minimum 10 caractères)..."
            rows={8}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-DEFAULT resize-none font-sans"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{text.length} caractères</span>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || text.length < 10}
              className="px-6 py-2 bg-cyan-DEFAULT text-background font-mono font-bold text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-dim transition-colors"
            >
              {isLoading ? "Analyse en cours..." : "Analyser"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-fake/40 rounded-lg px-4 py-3 text-fake text-sm">
            {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PredictionResult result={result} />
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div>
            <h2 className="font-mono text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest">
              Historique de la session
            </h2>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-2 text-sm">
                  <span className="text-slate-400 truncate flex-1 mr-4">{item.text}</span>
                  <span className={`font-mono font-bold text-xs ${item.result.label === "FAKE" ? "text-fake" : "text-real"}`}>
                    {item.result.label}
                  </span>
                  <span className="font-mono text-xs text-slate-500 ml-3">
                    {Math.round(item.result.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
