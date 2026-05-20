"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

const NAV = [
  {
    href: "/analyze",
    label: "Analyser",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/stream",
    label: "Stream Monitor",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    badge: "LIVE",
  },
];

type HealthStatus = "ok" | "degraded" | "offline" | "loading";

export default function Sidebar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus>("loading");
  const [modelName, setModelName] = useState<string>("");

  useEffect(() => {
    const check = () =>
      getHealth()
        .then((h) => {
          setHealth(h.model_loaded ? "ok" : "degraded");
          setModelName(h.model_name || "");
        })
        .catch(() => setHealth("offline"));

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const healthColor =
    health === "ok" ? "var(--success)" :
    health === "degraded" ? "var(--warning)" : "var(--danger)";

  const healthLabel =
    health === "ok" ? "Opérationnel" :
    health === "degraded" ? "Simulation" :
    health === "loading" ? "Connexion…" : "Hors ligne";

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "1.25rem 0.875rem",
        gap: "0",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 0.25rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              width: "28px",
              height: "28px",
              background: "linear-gradient(135deg, #6C63FF, #9B8FFF)",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              flexShrink: 0,
            }}
          >
            🔍
          </span>
          <span>
            FakeNews<br />
            <span style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.04em" }}>
              ANALYZER
            </span>
          </span>
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>
          v1.0 · DevComplex
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: "1rem" }}>
        <div style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem", padding: "0 0.25rem" }}>
          Navigation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.875rem",
                  borderRadius: "var(--radius)",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  background: active ? "rgba(108,99,255,0.12)" : "transparent",
                  border: active ? "1px solid rgba(108,99,255,0.2)" : "1px solid transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.15s",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "var(--success)",
                      background: "rgba(0,227,150,0.1)",
                      border: "1px solid rgba(0,227,150,0.25)",
                      borderRadius: "3px",
                      padding: "1px 5px",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Model Health */}
      <div
        style={{
          marginTop: "auto",
          padding: "0.875rem",
          background: "rgba(28,28,40,0.6)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          fontSize: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            API Status
          </span>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: health === "loading" ? "var(--text-muted)" : healthColor,
              boxShadow: health === "loading" ? "none" : `0 0 8px ${healthColor}`,
              display: "inline-block",
              animation: health === "ok" ? "pulseGreen 2s ease-in-out infinite" : "none",
            }}
          />
        </div>
        <div style={{ color: health === "loading" ? "var(--text-muted)" : healthColor, fontWeight: 600 }}>
          {healthLabel}
        </div>
        {modelName && (
          <div style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {modelName}
          </div>
        )}
      </div>
    </aside>
  );
}
