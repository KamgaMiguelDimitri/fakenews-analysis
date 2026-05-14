"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import KpiCard from "../../components/KpiCard";
import { getKpis, getModelStats } from "../../lib/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Record<string, number | string> | null>(null);
  const [modelStats, setModelStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    getKpis().then(setKpis).catch(console.error);
    getModelStats().then(setModelStats).catch(console.error);
  }, []);

  const pieData = kpis
    ? [
        { name: "FAKE", value: Number(kpis.fake_count), color: "#ff3333" },
        { name: "REAL", value: Number(kpis.real_count), color: "#00ccaa" },
      ]
    : [];

  const metricsData = modelStats
    ? [
        { name: "Accuracy", value: Number(modelStats.accuracy || 0) * 100 },
        { name: "F1-score", value: Number(modelStats.f1_score || 0) * 100 },
        { name: "AUC-ROC", value: Number(modelStats.auc_roc || 0) * 100 },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        <div>
          <h1 className="font-mono text-2xl font-bold text-cyan-DEFAULT mb-2">Dashboard</h1>
          <p className="text-slate-400 text-sm">Vue d'ensemble des prédictions et performances des modèles.</p>
        </div>

        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Total prédictions" value={Number(kpis.total_predictions)} />
            <KpiCard label="Articles FAKE" value={Number(kpis.fake_count)} color="#ff3333" />
            <KpiCard label="Articles REAL" value={Number(kpis.real_count)} color="#00ccaa" />
            <KpiCard label="Confiance moy." value={Number(kpis.avg_confidence) * 100} suffix="%" decimals={1} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pieData.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-mono text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                Répartition FAKE / REAL
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {metricsData.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-mono text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                Métriques du modèle
              </h2>
              <p className="text-xs text-slate-500 mb-4">Modèle : {String(modelStats?.model_name || "N/A")}</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={metricsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="value" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {modelStats && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-mono text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
              Informations modèle
            </h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: "Nom", value: String(modelStats.model_name || "N/A") },
                { label: "Type", value: String(modelStats.model_type || "N/A") },
                { label: "Statut", value: modelStats.is_ready ? "✓ Prêt" : "⚠ Simulation" },
                { label: "Entraîné le", value: String(modelStats.trained_at || "N/A").split("T")[0] },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-slate-500 font-mono text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="text-slate-200 mt-1">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}
