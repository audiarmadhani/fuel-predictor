"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LineGraph({ history }: { history: any[] }) {
  const [ron, setRon] = useState("92");

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

  const [smooth, setSmooth] = useState(1);

  if (!history || history.length === 0) return null;

  const safe = (v: any) => (v == null || isNaN(v) ? null : Number(v));

  /* ---------- FIND FIRST VALID INDEX BASE ---------- */
  function firstValid(history: any[], key: string) {
    for (const row of history) {
      const v = safe(row[key]);
      if (v != null) return v;
    }
    return 1;
  }

  const base = {
    pertamina: firstValid(history, `pertamina_${ron}`),
    bp: firstValid(history, `bp_${ron}`),
    shell: firstValid(history, `shell_${ron}`),
    vivo: firstValid(history, `vivo_${ron}`),
    brent: firstValid(history, "brent"),
    rbob: firstValid(history, "rbob"),
    usd: firstValid(history, "usd_idr"),
    mops: firstValid(history, "base_mops"),
  };

  /* ---------- BUILD INDEXED SERIES ---------- */
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

      pertamina_idx:
        vals.pertamina_raw != null ? vals.pertamina_raw / base.pertamina : null,
      bp_idx: vals.bp_raw != null ? vals.bp_raw / base.bp : null,
      shell_idx: vals.shell_raw != null ? vals.shell_raw / base.shell : null,
      vivo_idx: vals.vivo_raw != null ? vals.vivo_raw / base.vivo : null,
      brent_idx: vals.brent_raw != null ? vals.brent_raw / base.brent : null,
      rbob_idx: vals.rbob_raw != null ? vals.rbob_raw / base.rbob : null,
      usd_idx: vals.usd_raw != null ? vals.usd_raw / base.usd : null,
      mops_idx: vals.mops_raw != null ? vals.mops_raw / base.mops : null,

      ...vals,
    };
  });

  const smoothingType =
    smooth === 0 ? "linear" : smooth === 1 ? "monotoneX" : smooth === 2 ? "natural" : "basis";

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
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>
        Grafik Hubungan Harga RON {ron}
      </h2>

      {/* RON + SMOOTH SELECT */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <select
          value={ron}
          onChange={(e) => setRon(e.target.value)}
          style={{
            padding: 8, borderRadius: 6, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--text)", marginRight: 20,
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
            padding: 8, borderRadius: 6, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--text)",
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
      <div className="graph-wrapper" style={{ width: "75%", margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={indexed}>
            <XAxis dataKey="month" stroke="var(--text2)" />
            <YAxis stroke="var(--text2)" />

            <Tooltip
              formatter={(value: any, name: any, props: any) => {
                const label =
                  typeof name === "string" ? name.replace("_idx", "") : String(name ?? "");
                const rawKey = label.toLowerCase() + "_raw";
                const raw = props?.payload?.[rawKey];
                return [
                  `${Number(value).toFixed(3)} (raw: ${raw?.toLocaleString("id-ID") ?? "–"})`,
                  label,
                ];
              }}
            />

            <Legend />

            {/* Fuel lines */}
            {Object.keys(visible).map((key) => {
              const idxKey = key + "_idx";
              return (
                visible[key as keyof typeof visible] && (
                  <Line
                    key={key}
                    type={smoothingType}
                    dataKey={idxKey}
                    name={key.toUpperCase()}
                    stroke={colors[key as keyof typeof colors]}
                    strokeWidth={2}
                    dot={false}
                  />
                )
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}