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
      }}
    >
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: 40,
            fontSize: "48px",
            fontWeight: 700,
          }}
        >
          Prediksi Harga Bensin
        </h1>

        <div
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

                  {/* Pertamina */}
                  <td style={tdStyle}>
                    {renderCell(`pertamina_${ron}`, preds, confs, current)}
                  </td>

                  {/* BP */}
                  <td style={tdStyle}>
                    {["92", "95"].includes(ron)
                      ? renderCell(`bp_${ron}`, preds, confs, current)
                      : "-"}
                  </td>

                  {/* Shell */}
                  <td style={tdStyle}>
                    {ron === "90"
                      ? "-"
                      : renderCell(`shell_${ron}`, preds, confs, current)}
                  </td>

                  {/* Vivo */}
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

        <p style={{ marginTop: 40, textAlign: "center", color: "#777" }}>
          Updated: {new Date(row.created_at).toLocaleString()}
        </p>
        <p style={{ marginTop: 10, textAlign: "center", color: "#777" }}>
          by Audi Armadhani
        </p>
      </div>
    </main>
  );
}

/** Renders each cell with:
 * - Predicted price
 * - Fuel name
 * - Confidence
 * - Price comparison (▲ ▼ ●)
 */
function renderCell(
  key: string,
  preds: any,
  confs: any,
  current: any
) {
  if (!preds[key]) return "-";

  const predicted = Math.round(preds[key] / 10) * 10;
  const curr = current?.[key] ? Math.round(current[key] / 10) * 10 : null;
  const conf = Math.round(confs[key]);

  let diffSymbol = "●";
  let diffColor = "#888";

  if (curr !== null) {
    if (predicted > curr) {
      diffSymbol = "▲";
      diffColor = "green";
    } else if (predicted < curr) {
      diffSymbol = "▼";
      diffColor = "red";
    }
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {predicted.toLocaleString("id-ID")}
        {"  "}
        <span style={{ color: diffColor, fontSize: 14 }}>{diffSymbol}</span>
      </div>

      {curr !== null && (
        <div style={{ fontSize: 12, color: "#777" }}>
          Current: {curr.toLocaleString("id-ID")}
        </div>
      )}

      <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
        {BRAND_LABELS[key] || key}
      </div>

      <div style={{ fontSize: 11, color: "#aaa" }}>
        Confidence: {conf}%
      </div>
    </div>
  );
}

/** ---------- Styles ---------- **/

const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "2px solid #ddd",
  background: "#3a3a3aff",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  textAlign: "center",
  borderBottom: "1px solid #eee",
};

const ronCellStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 700,
};