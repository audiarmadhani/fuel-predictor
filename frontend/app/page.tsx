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
        <h1 style={{ textAlign: "center", marginBottom: 10 }}>
          Indonesia Fuel Price Forecast
        </h1>

        <p style={{ textAlign: "center", marginBottom: 40, color: "#666" }}>
          Prediction for next month
        </p>

        {/* TABLE WRAPPER */}
        <div
          style={{
            width: "70%",
            margin: "0 auto",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 16,
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
                  {/* RON column */}
                  <td style={ronCellStyle}>RON {ron}</td>

                  {/* Pertamina */}
                  <td style={tdStyle}>
                    {renderCell(`pertamina_${ron}`, preds, confs)}
                  </td>

                  {/* BP (only 92 & 95) */}
                  <td style={tdStyle}>
                    {ron === "90" || ron === "98"
                      ? "-"
                      : renderCell(`bp_${ron}`, preds, confs)}
                  </td>

                  {/* Shell (92, 95, 98) */}
                  <td style={tdStyle}>
                    {ron === "90"
                      ? "-"
                      : renderCell(`shell_${ron}`, preds, confs)}
                  </td>

                  {/* Vivo */}
                  <td style={tdStyle}>
                    {ron === "98"
                      ? "-"
                      : renderCell(`vivo_${ron}`, preds, confs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 40, textAlign: "center", color: "#777" }}>
          Updated: {new Date(row.created_at).toLocaleString()}
        </p>
      </div>
    </main>
  );
}

/** ---------- Helpers ---------- **/

function renderCell(key: string, preds: any, confs: any) {
  if (!preds[key]) return "-";

  const price = Math.round(preds[key] / 10) * 10; // rounded to nearest 10
  const conf = Math.round(confs[key]);

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {price.toLocaleString("id-ID")}
      </div>

      <div style={{ fontSize: 12, color: "#777" }}>
        {BRAND_LABELS[key] || key}
      </div>

      <div style={{ fontSize: 11, color: "#aaa" }}>Confidence: {conf}%</div>
    </div>
  );
}

/** ---------- Styles ---------- **/

const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "2px solid #ddd",
  background: "#616161ff",
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