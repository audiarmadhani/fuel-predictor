"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// mapping
const LABELS: Record<string, string> = {
  bp_92: "BP 92",
  bp_95: "BP Ultimate",
  vivo_90: "Revvo 90",
  vivo_92: "Revvo 92",
  vivo_95: "Revvo 95",
  shell_92: "Super",
  shell_95: "V-Power",
  shell_98: "V-Power Nitro+",
  pertamina_90: "Pertalite",
  pertamina_92: "Pertamax",
  pertamina_95: "Pertamax Green",
  pertamina_98: "Pertamax Turbo",
};

// grouping
const GROUPS = {
  "RON 90": ["pertamina_90", "vivo_90"],
  "RON 92": ["pertamina_92", "bp_92", "vivo_92", "shell_92"],
  "RON 95": ["pertamina_95", "bp_95", "vivo_95", "shell_95"],
  "RON 98": ["pertamina_98", "shell_98"],
};

export default function Home() {
  const [row, setRow] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch from Supabase
  useEffect(() => {
    async function load() {
      try {
        console.log("Fetching from Supabase...");

        const { data, error } = await supabase
          .from("predictions")
          .select("*")
          .order("id", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Supabase ERROR:", error);
          setError(error.message);
          return;
        }

        if (!data || data.length === 0) {
          setError("No data found in Supabase.");
          return;
        }

        console.log("Supabase DATA:", data[0]);
        setRow(data[0]);
      } catch (err: any) {
        console.error("Unexpected fetch error:", err);
        setError(err.message);
      }
    }

    load();
  }, []);

  // If error — show it
  if (error)
    return (
      <div style={{ padding: 40 }}>
        <h2>Error loading data:</h2>
        <pre>{error}</pre>
      </div>
    );

  // Still loading
  if (!row) return <div style={{ padding: 40 }}>Loading…</div>;

  const pred = row.model;
  const conf = row.confidence;

  // Compute next month
  const dt = new Date();
  dt.setMonth(dt.getMonth() + 1);
  const monthStr = dt.toLocaleString("id-ID", { month: "long", year: "numeric" });

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "sans-serif",
        color: "#eee",
        background: "#111",
        minHeight: "100vh",
      }}
    >
      <h1>Prediksi Harga BBM</h1>
      <p>Perkiraan harga untuk bulan {monthStr}</p>

      {Object.entries(GROUPS).map(([ronLabel, fuels]) => (
        <div key={ronLabel} style={{ marginTop: 30 }}>
          <h2>{ronLabel}</h2>

          <table border={1} cellPadding={10} style={{ width: "100%", marginTop: 10 }}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Prediksi Harga</th>
                <th>Confidence</th>
              </tr>
            </thead>

            <tbody>
              {fuels.map((fuelKey) => {
                if (!pred[fuelKey]) return null;

                // ROUND: e.g., 14.175,88 → 14.170 (nearest 10 rupiah)
                const rawPrice = pred[fuelKey];
                const rounded = Math.round(rawPrice / 10) * 10;

                return (
                  <tr key={fuelKey}>
                    <td>{LABELS[fuelKey]}</td>
                    <td>{rounded.toLocaleString("id-ID")}</td>
                    <td>{Math.round(conf[fuelKey])}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <p style={{ marginTop: 20, color: "#888" }}>
        Terakhir diperbarui: {new Date(row.created_at).toLocaleString("id-ID")}
      </p>
    </main>
  );
}