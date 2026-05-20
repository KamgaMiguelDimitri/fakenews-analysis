"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { generateStreamItem } from "@/lib/mock-data";
import type { StreamItem } from "@/lib/mock-data";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const MAX_ITEMS = 50;
const MAX_CHART_POINTS = 30;

type ChartPoint = { t: string; fake: number; real: number };

function StreamRow({ item, idx }: { item: StreamItem; idx: number }) {
  const isFake = item.result.label === "FAKE";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 80px 80px 70px",
        gap: "0.75rem",
        padding: "0.625rem 1rem",
        borderBottom: "1px solid rgba(42,42,58,0.5)",
        alignItems: "center",
        animation: idx === 0 ? "slideUp 0.25s ease-out" : "none",
        background: item.flagged ? "rgba(255,69,96,0.04)" : "transparent",
        transition: "background 0.2s",
      }}
    >
      <span className={isFake ? "badge badge-danger" : "badge badge-success"} style={{ fontSize: "0.58rem", justifyContent: "center" }}>
        {item.result.label}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.flagged && <span style={{ color: "var(--danger)", marginRight: "0.375rem" }}>🚩</span>}
          {item.text}
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "2px" }}>
          {item.source}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
        <div className="progress-bar" style={{ width: "56px", height: "3px" }}>
          <div className="progress-fill" style={{ width: `${item.result.confidence * 100}%`, background: isFake ? "var(--danger)" : "var(--success)" }} />
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: isFake ? "var(--danger)" : "var(--success)" }}>
          {(item.result.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "right" }}>
        {item.result.processing_time_ms}ms
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.62rem", color: "var(--text-muted)", textAlign: "right" }}>
        {item.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  );
}

export default function StreamPage() {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [running, setRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(2000);
  const [totalFake, setTotalFake] = useState(0);
  const [totalReal, setTotalReal] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const counterRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const addItem = useCallback(() => {
    const item = generateStreamItem(counterRef.current++);
    const now = new Date();
    const t = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));

    if (item.result.label === "FAKE") setTotalFake((n) => n + 1);
    else setTotalReal((n) => n + 1);
    if (item.flagged) setFlaggedCount((n) => n + 1);

    setChartData((prev) => {
      const last = prev[prev.length - 1];
      const newPoint: ChartPoint = {
        t,
        fake: item.result.label === "FAKE" ? (last?.fake ?? 0) + 1 : last?.fake ?? 0,
        real: item.result.label === "REAL" ? (last?.real ?? 0) + 1 : last?.real ?? 0,
      };
      return [...prev, newPoint].slice(-MAX_CHART_POINTS);
    });
  }, []);

  function toggleStream() {
    if (running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setRunning(false);
    } else {
      addItem();
      timerRef.current = setInterval(addItem, intervalMs);
      setRunning(true);
    }
  }

  // Re-create interval when speed changes while running
  useEffect(() => {
    if (running && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(addItem, intervalMs);
    }
  }, [intervalMs, running, addItem]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const total = totalFake + totalReal;
  const fakeRatio = total > 0 ? (totalFake / total) * 100 : 0;

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.6rem", letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "0.375rem" }}>
            Stream Monitor
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Surveillance en temps réel des articles entrants
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Speed selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>Vitesse</span>
            {[{ label: "Lent", ms: 4000 }, { label: "Normal", ms: 2000 }, { label: "Rapide", ms: 700 }].map(({ label, ms }) => (
              <button
                key={ms}
                onClick={() => setIntervalMs(ms)}
                style={{
                  fontSize: "0.72rem",
                  padding: "0.3rem 0.625rem",
                  borderRadius: "5px",
                  border: `1px solid ${intervalMs === ms ? "var(--accent)" : "var(--border)"}`,
                  background: intervalMs === ms ? "rgba(108,99,255,0.15)" : "transparent",
                  color: intervalMs === ms ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleStream}
            className={running ? "btn-ghost" : "btn-primary"}
            style={{ minWidth: "120px", justifyContent: "center" }}
          >
            {running ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                Pause
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
                {items.length > 0 ? "Reprendre" : "Démarrer"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        {/* Stat: total */}
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Total analysés</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "2rem", color: "var(--accent)", letterSpacing: "-0.02em" }}>{total}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginTop: "0.375rem" }}>
            {running ? <div className="live-dot" /> : <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--border)" }} />}
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{running ? "En cours" : "En pause"}</span>
          </div>
        </div>

        {/* Stat: fake */}
        <div className="card card-danger" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--danger)", opacity: 0.7, marginBottom: "0.5rem" }}>FAKE détectés</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "2rem", color: "var(--danger)", letterSpacing: "-0.02em" }}>{totalFake}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
            {fakeRatio.toFixed(1)}% du total
            {flaggedCount > 0 && <span style={{ color: "var(--danger)", marginLeft: "0.5rem" }}>· 🚩 {flaggedCount} flagged</span>}
          </div>
        </div>

        {/* Stat: real */}
        <div className="card card-success" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--success)", opacity: 0.7, marginBottom: "0.5rem" }}>REAL détectés</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "2rem", color: "var(--success)", letterSpacing: "-0.02em" }}>{totalReal}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
            {(100 - fakeRatio).toFixed(1)}% du total
          </div>
        </div>
      </div>

      {/* Chart + Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.25rem", alignItems: "start" }}>

        {/* Cumulative chart */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.9rem", marginBottom: "1rem" }}>
            Évolution cumulative
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="sFakeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4560" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF4560" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sRealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E396" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00E396" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fill: "var(--text-muted)", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-bright)", borderRadius: "8px", fontSize: "0.75rem" }}
                />
                <Area type="monotone" dataKey="fake" name="FAKE" stroke="#FF4560" strokeWidth={2} fill="url(#sFakeGrad)" />
                <Area type="monotone" dataKey="real" name="REAL" stroke="#00E396" strokeWidth={2} fill="url(#sRealGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              {running ? "En attente de données…" : "Démarrez le stream pour voir le graphe"}
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 80px 70px", gap: "0.75rem", padding: "0.625rem 1rem", borderBottom: "1px solid var(--border)" }}>
            {["LABEL", "TEXTE / SOURCE", "CONFIANCE", "TEMPS", "HORODATAGE"].map((h) => (
              <div key={h} style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {h}
              </div>
            ))}
          </div>

          <div ref={listRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📡</div>
                <div style={{ marginBottom: "0.25rem" }}>Stream inactif</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Cliquez sur Démarrer pour lancer la surveillance</div>
              </div>
            ) : (
              items.map((item, idx) => <StreamRow key={item.id} item={item} idx={idx} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
