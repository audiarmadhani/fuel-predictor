import React from "react";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return <div>Error loading data.</div>;
  }

  const row = data?.[0];

  if (!row) {
    return <div>No predictions yet.</div>;
  }

  const model: Record<string, number> = row.model;
  const confidence: Record<string, number> = row.confidence;

  const current = new Date(row.month + "-01T00:00:00");
  const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  const nextMonthLabel = next.toISOString().slice(0, 7);

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Fuel Price Forecast</h1>

      <p>Predictions for next month ({nextMonthLabel})</p>

      <table
        border={1}
        cellPadding={10}
        style={{ marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Fuel Type</th>
            <th>Predicted Price</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(model).map(([fuel, price]) => (
            <tr key={fuel}>
              <td>{fuel}</td>
              <td>
                {Math.floor((Number(price) / 10) * 10).toLocaleString("id-ID")}
              </td>
              <td>{Math.round(Number(confidence[fuel]))}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 20, color: "#666" }}>
        Updated: {new Date(row.created_at).toLocaleString()}
      </p>
    </main>
  );
}