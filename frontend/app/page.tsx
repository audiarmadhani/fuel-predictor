"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export default function Home() {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);

  /* INIT DARK MODE */
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

  /* LOAD DATA */
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

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!row) return <div style={{ padding: 40 }}>No predictions yet</div>;

  const preds = row.model;
  const confs = row.confidence;
  const current = row.current_prices;

  return (
    <main className="page">
      {/* DARK MODE TOGGLE */}
      <button className="dark-toggle" onClick={toggleDark}>
        {dark ? "🌚" : "🌝"}
      </button>

      <div className="container">
        <h1 className="title">Prediksi Harga Bensin</h1>

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

                  <td>{renderCell(`pertamina_${ron}`, preds, confs, current)}</td>

                  <td>
                    {["92", "95"].includes(ron)
                      ? renderCell(`bp_${ron}`, preds, confs, current)
                      : "-"}
                  </td>

                  <td>
                    {ron === "90"
                      ? "-"
                      : renderCell(`shell_${ron}`, preds, confs, current)}
                  </td>

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

        <p className="updated">
          Updated: {new Date(row.created_at).toLocaleString()}
        </p>
      </div>

      {/* GLOBAL CSS */}
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
          padding: 40px;
          display: flex;
          justify-content: center;
          position: relative;
          font-family: sans-serif;
        }

        .dark-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 28px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text);
        }

        .container {
          width: 100%;
          max-width: 1200px;
        }

        .title {
          text-align: center;
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 30px;
          color: var(--text);
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
          color: var(--text);
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

        /* MOBILE FIXES */
        @media (max-width: 768px) {
          .page {
            padding: 0 !important;
          }
          .container {
            max-width: 100%;
            padding: 0;
          }
          .table-wrapper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .fuel-table {
            border-left: 0;
            border-right: 0;
          }
        }
      `}</style>
    </main>
  );
}

/* ---------- RENDER CELL ---------- */
function renderCell(
  key: string,
  preds: any,
  confs: any,
  current: any
) {
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
        {BRAND_LABELS[key] || key}
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