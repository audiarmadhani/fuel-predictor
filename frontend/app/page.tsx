"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
          <div className="header-title">Prediksi Bensin</div>
          <div className="header-sub">Not Financial Advice. DYOR.</div>
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
        <RonGraph history={history} />

        <p className="updated">
          Last Updated: {new Date(row.created_at).toLocaleString()}
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

/* ------------------ GRAPH COMPONENT ------------------ */

/* ------------------ GRAPH COMPONENT ------------------ */

function RonGraph({ history }: { history: any[] }) {
  const [ron, setRon] = useState("92");

  // Toggle buttons
  const [visible, setVisible] = useState({
    pertamina: true,
    bp: true,
    shell: true,
    vivo: true,
    brent: true,
    rbob: true,
    usd: true,
    mops: true,
  });

  // smoothing level
  const [smooth, setSmooth] = useState(1);

  if (!history || history.length === 0) return null;

  const safe = (v: any) => (v == null || isNaN(v) ? null : Number(v));

  /* ------------ BASELINES (first data row) ------------ */
  const first = history[0];

  /* ------------ FIND FIRST VALID BASELINES ------------ */
  function findFirstValid(history: any[], key: string) {
    for (const row of history) {
      const v = safe(row[key]);
      if (v != null) return v;
    }
    return 1; // fallback so no division-by-zero
  }

  const base = {
    pertamina: findFirstValid(history, `pertamina_${ron}`),
    bp: findFirstValid(history, `bp_${ron}`),
    shell: findFirstValid(history, `shell_${ron}`),
    vivo: findFirstValid(history, `vivo_${ron}`),

    brent: findFirstValid(history, "brent"),
    rbob: findFirstValid(history, "rbob"),
    usd: findFirstValid(history, "usd_idr"),
    mops: findFirstValid(history, "base_mops"),
  };

  /* ------------ INDEXED + RAW DATASET ------------ */
  const indexed = history.map((row) => {
    const vals = {
      pertamina_raw: safe(row[`pertamina_${ron}`]),
      bp_raw: safe(row[`bp_${ron}`]),
      shell_raw: safe(row[`shell_${ron}`]),
      vivo_raw: safe(row[`vivo_${ron}`]),
      brent_raw: safe(row.brent),
      rbob_raw: safe(row.rbob),
      usd_raw: safe(row.usd_idr),
      mops_raw: safe(row.base_mops),
    };

    return {
      month: row.month,

      // indexed values
      pertamina_idx:
        vals.pertamina_raw != null ? vals.pertamina_raw / base.pertamina : null,
      bp_idx: vals.bp_raw != null ? vals.bp_raw / base.bp : null,
      shell_idx: vals.shell_raw != null ? vals.shell_raw / base.shell : null,
      vivo_idx: vals.vivo_raw != null ? vals.vivo_raw / base.vivo : null,

      brent_idx: vals.brent_raw != null ? vals.brent_raw / base.brent : null,
      rbob_idx: vals.rbob_raw != null ? vals.rbob_raw / base.rbob : null,
      usd_idx: vals.usd_raw != null ? vals.usd_raw / base.usd : null,
      mops_idx: vals.mops_raw != null ? vals.mops_raw / base.mops : null,

      // raw values used inside tooltip
      ...vals,
    };
  });

  /* ------------ SMOOTHING CURVE ------------ */
  const smoothingType =
    smooth === 0
      ? "linear"
      : smooth === 1
      ? "monotoneX"
      : smooth === 2
      ? "natural"
      : "basis";

  /* ------------ COLORS ------------ */
  const colors = {
    pertamina: "#e53935",
    bp: "#00c853",
    shell: "#ffeb3b",
    vivo: "#2979ff",
    brent: "#ff6d00",
    rbob: "#8e24aa",
    usd: "#43a047",
    mops: "#ffa000",
  };

  /* ------------ TOGGLE BUTTON STYLE ------------ */
  const toggleStyle = (active: boolean, color: string) => ({
    padding: "6px 12px",
    margin: "4px",
    borderRadius: 6,
    border: `1px solid ${color}`,
    cursor: "pointer",
    background: active ? color + "22" : "transparent",
    color: "var(--text)",
    fontSize: 12,
  });

  return (
    <div style={{ marginTop: 60 }}>
      <h2 style={{ textAlign: "center" }}>Grafik Hubungan Harga RON {ron}</h2>

      {/* RON + Smooth selectors */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <select
          value={ron}
          onChange={(e) => setRon(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            marginRight: 20,
          }}
        >
          <option value="90">RON 90</option>
          <option value="92">RON 92</option>
          <option value="95">RON 95</option>
          <option value="98">RON 98</option>
        </select>

        <select
          value={smooth}
          onChange={(e) => setSmooth(Number(e.target.value))}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
          }}
        >
          <option value={0}>Linear</option>
          <option value={1}>Smooth</option>
          <option value={2}>Very Smooth</option>
          <option value={3}>Bezier</option>
        </select>
      </div>

      {/* TOGGLE BUTTONS */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        {Object.keys(visible).map((key) => (
          <button
            key={key}
            style={toggleStyle(visible[key as keyof typeof visible], colors[key as keyof typeof colors])}
            onClick={() =>
              setVisible((v) => ({ ...v, [key]: !v[key as keyof typeof visible] }))
            }
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* GRAPH */}
      <div
        className="graph-wrapper"
        style={{ width: "75%", margin: "0 auto" }}
      >
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={indexed}>
            <XAxis dataKey="month" stroke="var(--text2)" />
            <YAxis stroke="var(--text2)" />

            {/* RAW VALUE TOOLTIP */}
            <Tooltip
              formatter={(value: any, name: any, props: any) => {
                const label =
                  typeof name === "string"
                    ? name.replace("_idx", "")
                    : String(name ?? "");

                const rawKey = label.toLowerCase() + "_raw";
                const raw = props?.payload?.[rawKey];

                return [
                  `${Number(value).toFixed(3)}   (raw: ${raw?.toLocaleString(
                    "id-ID"
                  ) ?? "–"})`,
                  label,
                ];
              }}
            />

            <Legend />

            {/* Fuel lines */}
            {visible.pertamina && (
              <Line
                type={smoothingType}
                dataKey="pertamina_idx"
                name="Pertamina"
                stroke={colors.pertamina}
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.bp && (
              <Line
                type={smoothingType}
                dataKey="bp_idx"
                name="BP"
                stroke={colors.bp}
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.shell && (
              <Line
                type={smoothingType}
                dataKey="shell_idx"
                name="Shell"
                stroke={colors.shell}
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.vivo && (
              <Line
                type={smoothingType}
                dataKey="vivo_idx"
                name="Vivo"
                stroke={colors.vivo}
                strokeWidth={2}
                dot={false}
              />
            )}

            {/* Commodities */}
            {visible.brent && (
              <Line
                type={smoothingType}
                dataKey="brent_idx"
                name="Brent"
                stroke={colors.brent}
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.rbob && (
              <Line
                type={smoothingType}
                dataKey="rbob_idx"
                name="RBOB"
                stroke={colors.rbob}
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.usd && (
              <Line
                type={smoothingType}
                dataKey="usd_idx"
                name="USD/IDR"
                stroke={colors.usd}
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.mops && (
              <Line
                type={smoothingType}
                dataKey="mops_idx"
                name="MOPS"
                stroke={colors.mops}
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
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