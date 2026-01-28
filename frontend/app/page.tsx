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

  /* ---------- LOAD DARK MODE ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";
    setDark(isDark);
    document.body.classList.toggle("dark", isDark);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.body.classList.toggle("dark", next);
    localStorage.setItem("darkMode", next.toString());
  }

  /* ---------- LOAD DATA ---------- */
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
    <main
      style={{
        padding: 40,
        fontFamily: "sans-serif",
        display: "flex",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Dark/Light Toggle */}
      <button
        onClick={toggleDark}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          fontSize: 26,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        {dark ? "🌞" : "🌙"}
      </button>

      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: 30,
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          Prediksi Harga Bensin
        </h1>

        <div className="table-wrapper"
          style={{
            width: "80%",
            margin: "0 auto",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>RON</th>
                <th style={thStyle}>Pertamina</th>
                <th style={thStyle}>BP</th>
                <th style={thStyle}>Shell</th>
                <th style={thStyle}>Vivo</th>
              </tr>
            </thead>

            <tbody>
              {RON_LIST.map((ron) => (
                <tr key={ron}>
                  <td style={ronCellStyle}>RON {ron}</td>

                  <td style={tdStyle}>{renderCell(`pertamina_${ron}`, preds, confs, current)}</td>

                  <td style={tdStyle}>
                    {["92", "95"].includes(ron)
                      ? renderCell(`bp_${ron}`, preds, confs, current)
                      : "-"}
                  </td>

                  <td style={tdStyle}>
                    {ron === "90"
                      ? "-"
                      : renderCell(`shell_${ron}`, preds, confs, current)}
                  </td>

                  <td style={tdStyle}>
                    {ron === "98"
                      ? "-"
                      : renderCell(`vivo_${ron}`, preds, confs, current)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 40, textAlign: "center", color: "var(--text2)" }}>
          Updated: {new Date(row.created_at).toLocaleString()}
        </p>
      </div>

      {/* MOBILE CSS */}
      <style>{`
        @media (max-width: 768px) {
          .table-wrapper {
            width: 100% !important;
            padding: 0 12px;
          }
        }
        body.dark {
          background: #111;
          color: #eee;
        }
        body.dark table {
          color: #eee;
        }
      `}</style>
    </main>
  );
}

/* ---------- Render Cell (with range) ---------- */
function renderCell(key: string, preds: any, confs: any, current: any) {
  if (!preds[key]) return "-";

  let predicted = preds[key];

  // Lock Pertalite at 10.000
  if (key === "pertamina_90") {
    predicted = 10000;
  }

  // PRICE RANGE CALC
  const low = Math.floor(predicted / 100) * 100;
  const high = Math.ceil(predicted / 100) * 100;

  const conf = Math.round(confs[key]);
  const curr = current?.[key] || null;

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {low.toLocaleString("id-ID")} – {high.toLocaleString("id-ID")}
      </div>

      {curr !== null && (
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          Current: {curr.toLocaleString("id-ID")}
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
        {BRAND_LABELS[key] || key}
      </div>

      <div style={{ fontSize: 11, color: "var(--text3)" }}>
        Confidence: {conf}%
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "2px solid #444",
  background: "var(--th-bg)",
  textAlign: "center",
  color: "white",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  textAlign: "center",
  borderBottom: "1px solid #333",
};

const ronCellStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 700,
};