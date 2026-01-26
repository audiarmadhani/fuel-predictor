import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data: rows } = await supabase
    .from("predictions")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  const row = rows?.[0];

  if (!row) return <div>No predictions yet</div>;

  const pred = row.model;
  const conf = row.confidence;

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Fuel Price Forecast</h1>
      <p>Predictions for next month ({row.month})</p>

      <table border={1} cellPadding={10} style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Fuel Type</th>
            <th>Predicted Price</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pred).map(([fuel, price]) => (
            <tr key={fuel}>
              <td>{fuel}</td>
              <td>{Math.round(price).toLocaleString("id-ID")}</td>
              <td>{Math.round(conf[fuel] * 100)}%</td>
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