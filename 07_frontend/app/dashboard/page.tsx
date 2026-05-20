"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { getKpis, getModelStats } from "@/lib/api";
import {
  generateTimeSeries,
  generateWeeklyData,
  generateConfidenceDist,
  generateSourceData,
  generateHistory,
  MOCK_KPIS,
} from "@/lib/mock-data";

/* ─── Helpers ─── */
function KpiCard({
  label, value, sub, color = "var(--accent)", icon,
}: { label: string; value: string | number; sub?: string; color?: string; icon?: string }) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        animation: "slideUp 0.4s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em" }}>
          {label.toUpperCase()}
        </span>
        {icon && <span style={{ fontSize: "1.1rem" }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.75rem", fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-bright)", borderRadius: "8px", padding: "0.6rem 0.875rem", fontSize: "0.78rem" }}>
      <div style={{ color: "var(--text-muted)", marginBottom: "0.3rem" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, fontFamily: "'Space Mono', monospace" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Record<string, number | string>>(MOCK_KPIS as any);
  const [modelStats, setModelStats] = useState<Record<string, unknown> | null>(null);
  const timeSeries = generateTimeSeries(24);
  const weeklyData = generateWeeklyData();
  const confidenceDist = generateConfidenceDist();
  const sourceData = generateSourceData();
  const history = generateHistory(15);

  useEffect(() => {
    getKpis().then(setKpis).catch(() => {});
    getModelStats().then(setModelStats).catch(() => {});
  }, []);

  const total = Number(kpis.total_predictions || MOCK_KPIS.total_predictions);
  const fakeCount = Number(kpis.fake_count || MOCK_KPIS.fake_count);
  const realCount = Number(kpis.real_count || MOCK_KPIS.real_count);
  const avgConf = Number(kpis.avg_confidence || MOCK_KPIS.avg_confidence);
  const fakeRatio = total > 0 ? (fakeCount / total) * 100 : 0;

  const pieData = [
    { name: "FAKE", value: fakeCount, color: "var(--danger)" },
    { name: "REAL", value: realCount, color: "var(--success)" },
  ];

  const metricsData = modelStats
    ? [
        { name: "Accuracy", value: Math.round(Number(modelStats.accuracy || 0.91) * 1000) / 10 },
        { name: "F1",       value: Math.round(Number(modelStats.f1_score  || 0.89) * 1000) / 10 },
        { name: "AUC-ROC",  value: Math.round(Number(modelStats.auc_roc  || 0.95) * 1000) / 10 },
      ]
    : [
        { name: "Accuracy", value: 91.2 },
        { name: "F1",       value: 89.4 },
        { name: "AUC-ROC",  value: 95.1 },
      ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.6rem", letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "0.375rem" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Vue d'ensemble · performances et métriques du modèle
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>live</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        <KpiCard label="Total prédictions" value={total.toLocaleString()} icon="📊" />
        <KpiCard label="Articles FAKE" value={fakeCount.toLocaleString()} sub={`${fakeRatio.toFixed(1)}% du total`} color="var(--danger)" icon="🚨" />
        <KpiCard label="Articles REAL" value={realCount.toLocaleString()} sub={`${(100 - fakeRatio).toFixed(1)}% du total`} color="var(--success)" icon="✅" />
        <KpiCard label="Confiance moy." value={`${(avgConf * 100).toFixed(1)}%`} icon="🎯" color="var(--warning)" />
      </div>

      {/* Model metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        {metricsData.map(({ name, value }) => (
          <div key={name} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{name}</span>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--accent)", letterSpacing: "-0.02em" }}>{value}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${value}%`, background: "linear-gradient(135deg, #6C63FF, #9B8FFF)" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1: area + pie */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Area chart */}
        <div className="card">
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem" }}>Volume horaire (24h)</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>Prédictions par heure</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4560" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF4560" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E396" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00E396" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: "var(--text-muted)", fontSize: 11 }} interval={3} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="fake" name="FAKE" stroke="#FF4560" strokeWidth={2} fill="url(#fakeGrad)" />
              <Area type="monotone" dataKey="real" name="REAL" stroke="#00E396" strokeWidth={2} fill="url(#realGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>Répartition</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>FAKE vs REAL</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pieData.map((entry) => (
              <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color, display: "inline-block" }} />
                  {entry.name}
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: entry.color, fontWeight: 700 }}>
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2: weekly + confidence + sources */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Weekly */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem", marginBottom: "1rem" }}>Activité hebdo</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fake" name="FAKE" fill="#FF4560" radius={[3, 3, 0, 0]} />
              <Bar dataKey="real" name="REAL" fill="#00E396" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence distribution */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem", marginBottom: "1rem" }}>Distribution confiance</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={confidenceDist} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" fill="#6C63FF" radius={[3, 3, 0, 0]}>
                {confidenceDist.map((_, i) => (
                  <Cell key={i} fill={`hsl(${248 - i * 12}, 70%, ${55 + i * 6}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sources */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem", marginBottom: "0.875rem" }}>Par source</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sourceData.map((s) => {
              const fRatio = s.fake / s.total;
              return (
                <div key={s.source}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "3px" }}>
                    <span style={{ color: "var(--text-muted)" }}>{s.source}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", color: fRatio > 0.5 ? "var(--danger)" : "var(--success)", fontSize: "0.68rem" }}>
                      {(fRatio * 100).toFixed(0)}% fake
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: "4px" }}>
                    <div className="progress-fill" style={{ width: `${fRatio * 100}%`, background: fRatio > 0.5 ? "var(--danger)" : "var(--success)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem" }}>
            Historique récent
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)" }}>
            {history.length} entrées
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table-dark">
            <thead>
              <tr>
                <th>Label</th>
                <th>Texte</th>
                <th>Confiance</th>
                <th>Modèle</th>
                <th>Temps</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={item.result.label === "FAKE" ? "badge badge-danger" : "badge badge-success"} style={{ fontSize: "0.6rem" }}>
                      {item.result.label}
                    </span>
                  </td>
                  <td style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                    {item.text}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="progress-bar" style={{ width: "60px", height: "4px" }}>
                        <div className="progress-fill" style={{ width: `${item.result.confidence * 100}%`, background: item.result.label === "FAKE" ? "var(--danger)" : "var(--success)" }} />
                      </div>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem" }}>
                        {(item.result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {item.result.model_used}
                  </td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {item.result.processing_time_ms}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model info */}
      {modelStats && (
        <div className="card" style={{ marginTop: "1.25rem" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "var(--text)", marginBottom: "1rem" }}>Informations modèle</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {[
              { label: "Nom", value: String(modelStats.model_name || "distilbert") },
              { label: "Type", value: String(modelStats.model_type || "transformers") },
              { label: "Statut", value: modelStats.is_ready ? "✓ Prêt" : "⚠ Simulation" },
              { label: "Entraîné le", value: String(modelStats.trained_at || "N/A").split("T")[0] },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{label}</div>
                <div style={{ color: "var(--text)", fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
