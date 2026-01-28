"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import CorrelationHeatmap from "@/components/CorrelationHeatmap";
import LineGraph from "@/components/LineGraph";

/* ------------------ CONSTANTS ------------------ */

const BRAND_LABELS: Record<string, string> = {
  pertamina_90: "Pertalite",
  pertamina_92: "Pertamax",
  pertamina_95: "Pertamax Green",
  pertamina_98: "Pertamax Turbo",

  bp_92: "BP 92",
  bp_95: "BP Ultimate",

  shell_92: "Super",
  shell_95: "V-Power",
  shell_98: "V-Power Nitro+",

  vivo_90: "Revvo 90",
  vivo_92: "Revvo 92",
  vivo_95: "Revvo 95",
};

const RON_LIST = ["90", "92", "95", "98"];

/* ------------------ MAIN COMPONENT ------------------ */

export default function Home() {
  const [row, setRow] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [showMore, setShowMore] = useState(false);


  /* ---------- INIT DARK MODE ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";
    setDark(isDark);
    document.body.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.body.classList.toggle("dark", next);
    localStorage.setItem("darkMode", next.toString());
  };

  /* ---------- LOAD SUPABASE LATEST ROW ---------- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("predictions")
        .select("*")
        .order("id", { ascending: false })
        .limit(1);

      setRow(data?.[0] || null);
      setLoading(false);
    })();
  }, []);

/* ---------- LOAD HISTORICAL DATA ---------- */
useEffect(() => {
  (async () => {
    try {
      const res = await fetch("https://fuel-predictor-backend-rf1e.onrender.com/api/history");
      const json = await res.json();
      setHistory(json.rows || []);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  })();
}, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!row) return <div style={{ padding: 40 }}>No predictions yet</div>;

  const preds = row.model;
  const confs = row.confidence;
  const current = row.current_prices;

  /* ------------------ PAGE RENDER ------------------ */
  return (
    <main className="page">

      {/* ---------- HEADER ---------- */}
      <header className="header">
        <div>
          <div className="header-title">prediksi bensin</div>
          <div className="header-sub">not financial advice. DYOR.</div>
        </div>

        <button className="dark-toggle" onClick={toggleDark}>
          {dark ? "🌚" : "🌝"}
        </button>
      </header>

      <div className="container">
        
        {/* ---------- TABLE ---------- */}
        <div className="table-wrapper">
          <table className="fuel-table">
            <thead>
              <tr>
                <th>RON</th>
                <th>Pertamina</th>
                <th>BP</th>
                <th>Shell</th>
                <th>Vivo</th>
              </tr>
            </thead>

            <tbody>
              {RON_LIST.map((ron) => (
                <tr key={ron}>
                  <td className="ron-cell">RON {ron}</td>

                  {/* Pertamina */}
                  <td>{renderCell(`pertamina_${ron}`, preds, confs, current)}</td>

                  {/* BP */}
                  <td>
                    {["92", "95"].includes(ron)
                      ? renderCell(`bp_${ron}`, preds, confs, current)
                      : "-"}
                  </td>

                  {/* Shell */}
                  <td>
                    {ron === "90"
                      ? "-"
                      : renderCell(`shell_${ron}`, preds, confs, current)}
                  </td>

                  {/* Vivo */}
                  <td>
                    {ron === "98"
                      ? "-"
                      : renderCell(`vivo_${ron}`, preds, confs, current)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------- GRAPH ---------- */}
        {/* ---------- SHOW MORE DATA SECTION ---------- */}
        {!showMore && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={() => setShowMore(true)}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              show more
            </button>
          </div>
        )}

        {showMore && (
          <>
            <LineGraph history={history} />

            <div style={{ width: "75%", margin: "40px auto" }}>
              <CorrelationHeatmap history={history} />
            </div>

            {/* ---------- SHOW LESS BUTTON ---------- */}
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={() => setShowMore(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                show less
              </button>
            </div>
          </>
        )}

        <p className="updated">
          last updated: {new Date(row.created_at).toLocaleString()}
        </p>
      </div>

      {GLOBAL_CSS}
    </main>
  );
}

/* ------------------ CELL RENDER ------------------ */

function renderCell(key: string, preds: any, confs: any, current: any) {
  if (!preds[key]) return "-";

  let predicted = preds[key];
  if (key === "pertamina_90") predicted = 10000;

  const low = Math.floor(predicted / 100) * 100;
  const high = Math.ceil(predicted / 100) * 100;
  const midpoint = Math.round((low + high) / 2);
  const conf = Math.round(confs[key]);
  const curr = current?.[key] || null;

  let diffSymbol = "●";
  let diffColor = "var(--text3)";

  if (curr !== null) {
    if (midpoint > curr) diffSymbol = "▲", diffColor = "green";
    else if (midpoint < curr) diffSymbol = "▼", diffColor = "red";
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {low === high
          ? low.toLocaleString("id-ID")
          : `${low.toLocaleString("id-ID")} – ${high.toLocaleString("id-ID")}`}
        {" "}
        <span style={{ color: diffColor, fontSize: 14 }}>{diffSymbol}</span>
      </div>

      <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 2 }}>
        {BRAND_LABELS[key]}
      </div>

      {curr !== null && (
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          Current: {curr.toLocaleString("id-ID")}
        </div>
      )}

      <div style={{ fontSize: 9, color: "var(--text3)" }}>
        Confidence: {conf}%
      </div>
    </div>
  );
}

/* ------------------ GLOBAL CSS ------------------ */

const GLOBAL_CSS = (
  <style>{`
    :root {
      --bg: #f7f7f7;
      --text: #222;
      --text2: #555;
      --text3: #888;
      --card: #ffffff;
      --th-bg: #e8e8e8;
      --border: #cccccc;
    }

    body.dark {
      --bg: #0d0d0d;
      --text: #f2f2f2;
      --text2: #ccc;
      --text3: #999;
      --card: #1a1a1a;
      --th-bg: #333;
      --border: #444;
    }

    body {
      background: var(--bg);
      color: var(--text);
      margin: 0;
      transition: 0.25s ease;
    }

    .page {
      padding: 0;
      font-family: sans-serif;
      min-height: 100vh;
    }

    /* HEADER */
    .header {
      width: 100%;
      padding: 26px 30px 20px 30px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title {
      font-size: 32px;
      font-weight: 700;
    }

    .header-sub {
      font-size: 12px;
      margin-top: 3px;
      color: var(--text2);
    }

    .dark-toggle {
      font-size: 28px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text);
    }

    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding-top: 30px;
    }

    .table-wrapper {
      width: 90%;
      margin: 0 auto;
      overflow-x: auto;
    }

    .fuel-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
      border: 1px solid var(--border);
    }

    th {
      padding: 12px 10px;
      background: var(--th-bg);
      border-bottom: 2px solid var(--border);
    }

    td {
      padding: 14px 10px;
      text-align: center;
      border-bottom: 1px solid var(--border);
    }

    .ron-cell {
      font-weight: 700;
    }

    .updated {
      margin-top: 40px;
      text-align: center;
      color: var(--text2);
    }

    @media (max-width: 768px) {
      .table-wrapper {
        width: 100% !important;
      }
      .graph-wrapper {
        width: 90% !important;
        padding: 0 12px;
      }
    }
  `}</style>
);