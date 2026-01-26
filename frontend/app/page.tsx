import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data } = await supabase
    .from("predictions")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  const row = data?.[0];
  if (!row) return <div>No predictions yet</div>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Fuel Price Forecast</h1>
      <p>Next Month: {row.month}</p>

      <pre>{JSON.stringify(row.model, null, 2)}</pre>
    </main>
  );
}