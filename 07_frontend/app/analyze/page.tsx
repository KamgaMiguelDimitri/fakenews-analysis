"use client";

import { useState, useRef, useEffect } from "react";
import { analyzeText } from "@/lib/api";
import type { PredictResponse } from "@/lib/api";

const EXAMPLE_TEXTS = [
  {
    label: "Exemple fake",
    text: "SHOCKING: Scientists discover that 5G towers are secretly emitting mind-control waves. The government is HIDING this truth from us! Leaked documents show that microchips in vaccines activate when near 5G signals. SHARE THIS BEFORE IT GETS DELETED!!",
  },
  {
    label: "Exemple réel",
    text: "Researchers at Stanford University published findings in Nature Medicine showing that a new mRNA-based therapy has demonstrated significant efficacy in treating aggressive forms of pancreatic cancer in early-stage clinical trials, with patients showing a 40% improvement in survival rates compared to standard chemotherapy.",
  },
];

function ConfidenceGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: PredictResponse }) {
  const isFake = result.label === "FAKE";
  const accentColor = isFake ? "var(--danger)" : "var(--success)";
  const bgGradient = isFake
    ? "linear-gradient(135deg, rgba(255,69,96,0.1) 0%, rgba(255,69,96,0.04) 100%)"
    : "linear-gradient(135deg, rgba(0,227,150,0.1) 0%, rgba(0,227,150,0.04) 100%)";
  const borderColor = isFake ? "rgba(255,69,96,0.35)" : "rgba(0,227,150,0.35)";

  return (
    <div
      style={{
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: isFake
                ? "linear-gradient(135deg, #FF4560, #FF7A8A)"
                : "linear-gradient(135deg, #00E396, #00B377)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            {isFake ? "⚠️" : "✓"}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.35rem", color: accentColor, letterSpacing: "-0.01em" }}>
              {result.label}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Confiance : {(result.confidence * 100).toFixed(1)}%
              {result._simulated && " · mode simulation"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Modèle
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: 500, marginTop: "2px" }}>
            {result.model_used}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {result.processing_time_ms}ms
          </div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <ConfidenceGauge value={result.fake_probability} label="Probabilité FAKE" color="var(--danger)" />
        <ConfidenceGauge value={result.real_probability} label="Probabilité REAL" color="var(--success)" />
      </div>

      {/* NLP features */}
      {result.nlp_features && (
        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Indicateurs NLP
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
            {[
              { label: "Mots", value: result.nlp_features.word_count },
              { label: "Majuscules", value: `${(result.nlp_features.capital_ratio * 100).toFixed(0)}%` },
              { label: "Sentiment", value: result.nlp_features.sentiment_score.toFixed(2) },
              { label: "!", value: result.nlp_features.exclamation_count },
              { label: "?", value: result.nlp_features.question_count },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "0.5rem 0.625rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.9rem", color: "var(--text)", fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict message */}
      <div
        style={{
          marginTop: "1.25rem",
          padding: "0.875rem 1rem",
          background: isFake ? "rgba(255,69,96,0.08)" : "rgba(0,227,150,0.08)",
          borderRadius: "var(--radius)",
          borderLeft: `3px solid ${accentColor}`,
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          lineHeight: "1.6",
        }}
      >
        {isFake
          ? "Ce texte présente des caractéristiques associées à la désinformation : langage alarmiste, absence de sources vérifiables, formulation émotionnelle. Vérifiez auprès de sources officielles avant de partager."
          : "Ce texte présente des caractéristiques d'un article fiable : ton factuel, références précises, absence d'indicateurs de manipulation. Restez vigilant et croisez toujours vos sources."}
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ text: string; result: PredictResponse }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleAnalyze() {
    if (!text.trim() || text.length < 10) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const prediction = await analyzeText(text);
      setResult(prediction);
      setHistory((prev) =>
        [{ text: text.length > 90 ? text.slice(0, 90) + "…" : text, result: prediction }, ...prev].slice(0, 12)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setIsLoading(false);
    }
  }

  function loadExample(exampleText: string) {
    setText(exampleText);
    setResult(null);
    setError(null);
    textareaRef.current?.focus();
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "1.6rem",
            letterSpacing: "-0.02em",
            color: "var(--text)",
            marginBottom: "0.375rem",
          }}
        >
          Analyser un texte
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Collez un article, une déclaration ou un tweet — l'IA détermine s'il est FAKE ou REAL.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1.25rem", alignItems: "start" }}>

        {/* LEFT: Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Example buttons */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>Exemples :</span>
            {EXAMPLE_TEXTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => loadExample(ex.text)}
                className="btn-ghost"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
            }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleAnalyze();
              }}
              placeholder="Collez votre texte ici (minimum 10 caractères)…&#10;&#10;Ctrl+Enter pour analyser"
              rows={11}
              className="input-dark"
              style={{ resize: "none", border: "none", background: "transparent", padding: "0" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "0.875rem",
                paddingTop: "0.875rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {text.length} caractères
                </span>
                {text.length > 0 && text.length < 10 && (
                  <span style={{ fontSize: "0.7rem", color: "var(--warning)" }}>
                    Minimum 10 caractères
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {text.length > 0 && (
                  <button
                    onClick={() => { setText(""); setResult(null); setError(null); }}
                    className="btn-ghost"
                    style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem" }}
                  >
                    Effacer
                  </button>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || text.length < 10}
                  className="btn-primary"
                  style={{ minWidth: "120px", justifyContent: "center" }}
                >
                  {isLoading ? (
                    <>
                      <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Analyse…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      Analyser
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(255,69,96,0.08)",
                border: "1px solid rgba(255,69,96,0.3)",
                borderRadius: "var(--radius)",
                padding: "0.75rem 1rem",
                color: "var(--danger)",
                fontSize: "0.85rem",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Result */}
          {result && <ResultPanel result={result} />}
        </div>

        {/* RIGHT: History */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.875rem 1rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Historique session
            </span>
            {history.length > 0 && (
              <span
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "'Space Mono', monospace",
                  color: "var(--accent)",
                  background: "rgba(108,99,255,0.12)",
                  border: "1px solid rgba(108,99,255,0.2)",
                  borderRadius: "4px",
                  padding: "1px 6px",
                }}
              >
                {history.length}
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📋</div>
              Les analyses apparaîtront ici
            </div>
          ) : (
            <div style={{ maxHeight: "480px", overflowY: "auto" }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: idx < history.length - 1 ? "1px solid rgba(42,42,58,0.5)" : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.625rem",
                    animation: idx === 0 ? "slideUp 0.3s ease-out" : "none",
                  }}
                >
                  <span
                    className={item.result.label === "FAKE" ? "badge badge-danger" : "badge badge-success"}
                    style={{ flexShrink: 0, fontSize: "0.58rem" }}
                  >
                    {item.result.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.5" }}>
                      {item.text}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "3px" }}>
                      {(item.result.confidence * 100).toFixed(0)}% · {item.result.processing_time_ms}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
