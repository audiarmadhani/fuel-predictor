"use client";

import React, { useMemo } from "react";

/* -------------------------------------------------
   HELPER: Safe number conversion
---------------------------------------------------*/
const safe = (v: any): number | null =>
  v == null || isNaN(Number(v)) ? null : Number(v);

/* -------------------------------------------------
   CORRELATION FUNCTION
---------------------------------------------------*/
function correlation(X: number[], Y: number[]): number | null {
  if (X.length !== Y.length || X.length < 3) return null;

  const n = X.length;
  const meanX = X.reduce((a, b) => a + b, 0) / n;
  const meanY = Y.reduce((a, b) => a + b, 0) / n;

  let num = 0,
    denX = 0,
    denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = X[i] - meanX;
    const dy = Y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  if (denom === 0) return null;

  return num / denom;
}

/* -------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------*/

export default function CorrelationHeatmap({ history }: { history: any[] }) {
  // If no data yet
  if (!history || history.length === 0) return null;

  /* -------------------------------------------------
     SERIES DEFINITIONS
  ---------------------------------------------------*/
  const fuelKeys = [
    "pertamina_90",
    "pertamina_92",
    "pertamina_95",
    "pertamina_98",
    "bp_92",
    "bp_95",
    "shell_92",
    "shell_95",
    "shell_98",
    "vivo_90",
    "vivo_92",
    "vivo_95",
  ];

  const commodityKeys = ["brent", "rbob", "usd_idr", "base_mops"];

  /* Friendly labels */
  const labels: Record<string, string> = {
    pertamina_90: "Pertalite",
    pertamina_92: "Pertamax",
    pertamina_95: "Pertamax Green",
    pertamina_98: "Pertamax Turbo",
    bp_92: "BP 92",
    bp_95: "BP Ultimate",
    shell_92: "Shell Super",
    shell_95: "Shell V-Power",
    shell_98: "Shell Nitro+",
    vivo_90: "Vivo 90",
    vivo_92: "Vivo 92",
    vivo_95: "Vivo 95",
    brent: "Brent",
    rbob: "RBOB",
    usd_idr: "USD/IDR",
    base_mops: "MOPS",
  };

  /* -------------------------------------------------
     BUILD CORRELATION MATRIX
  ---------------------------------------------------*/
  const matrix = useMemo(() => {
    const rows: any[] = [];

    fuelKeys.forEach((fuelKey) => {
      const fuelSeries = history
        .map((r) => safe(r[fuelKey]))
        .filter((v) => v !== null) as number[];

      const row: Record<string, number | null> = {};

      commodityKeys.forEach((comKey) => {
        const commoditySeries = history
          .map((r) => safe(r[comKey]))
          .filter((v) => v !== null) as number[];

        // Align lengths (simple approach: truncate to shortest)
        const n = Math.min(fuelSeries.length, commoditySeries.length);
        const corr = correlation(
          fuelSeries.slice(0, n),
          commoditySeries.slice(0, n)
        );

        row[comKey] = corr;
      });

      rows.push({
        fuelKey,
        values: row,
      });
    });

    return rows;
  }, [history]);

  /* -------------------------------------------------
     COLOR SCALE
  ---------------------------------------------------*/
  const getColor = (v: number | null): string => {
    if (v == null) return "var(--border)";

    // Strength-based color scale
    if (v >= 0.85) return "#c62828"; // strong red
    if (v >= 0.70) return "#ef6c00"; // orange
    if (v >= 0.50) return "#f9a825"; // yellow
    return "#616161"; // grey
  };

  const getTextColor = (v: number | null): string =>
    v != null && v >= 0.70 ? "white" : "var(--text)";

  /* -------------------------------------------------
     RENDER
  ---------------------------------------------------*/
  return (
    <div style={{ marginTop: 60 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>
        Korelasi Harga Bensin vs Komoditas Global
      </h2>

      <div className="heatmap-grid">
        {/* Column headers */}
        <div className="heatmap-cell label-cell"></div>
        {commodityKeys.map((key) => (
          <div key={key} className="heatmap-cell header-cell">
            {labels[key]}
          </div>
        ))}

        {/* Rows */}
        {matrix.map((row) => (
          <React.Fragment key={row.fuelKey}>
            <div className="heatmap-cell row-label">
              {labels[row.fuelKey]}
            </div>

            {commodityKeys.map((cKey) => {
              const val = row.values[cKey];
              return (
                <div
                  key={cKey}
                  className="heatmap-cell"
                  style={{
                    background: getColor(val),
                    color: getTextColor(val),
                    fontWeight: 600,
                  }}
                >
                  {val == null ? "–" : val.toFixed(2)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {HEATMAP_CSS}
    </div>
  );
}

/* -------------------------------------------------
   CSS (grid layout + responsive + dark mode)
---------------------------------------------------*/
const HEATMAP_CSS = (
  <style>{`
    .heatmap-grid {
      display: grid;
      grid-template-columns: 160px repeat(4, 1fr);
      gap: 4px;
      width: 90%;
      margin: 0 auto;
    }

    .heatmap-cell {
      padding: 10px;
      text-align: center;
      border-radius: 6px;
      background: var(--card);
      border: 1px solid var(--border);
      font-size: 13px;
    }

    .header-cell {
      font-weight: 700;
      background: var(--th-bg);
    }

    .row-label {
      font-weight: 600;
      background: var(--th-bg);
      text-align: left;
    }

    @media (max-width: 768px) {
      .heatmap-grid {
        grid-template-columns: 120px repeat(4, 1fr);
        width: 100%;
      }
      .heatmap-cell {
        padding: 8px;
        font-size: 11px;
      }
    }
  `}</style>
);