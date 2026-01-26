"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ===================================================
//                SUPABASE CLIENT
// ===================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ===================================================
//                 BRAND NAME MAPPING
// ===================================================
const NAME_MAP: Record<string, string> = {
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

// Group by RON
const RON_GROUPS = {
  "RON 90": ["pertamina_90", "vivo_90"],
  "RON 92": ["pertamina_92", "shell_92", "bp_92", "vivo_92"],
  "RON 95": ["pertamina_95", "shell_95", "bp_95", "vivo_95"],
  "RON 98": ["pertamina_98", "shell_98"],
};

// ===================================================
//               ROUNDER FUNCTION
// ===================================================
function roundToNearest10(value: number) {
  return Math.round(value / 10) * 10;
}

// ===================================================
//                    COMPONENT
// ===================================================
export default function Home() {
  const [row, setRow] = useState<any>(null);
  const [dark, setDark] = useState(false);

  // Load last prediction
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("predictions")
        .select("*")
        .order("id", { ascending: false })
        .limit(1);

      if (data && data.length > 0) setRow(data[0]);
    }

    load();
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  if (!row)
    return (
      <main className="p-10 text-center text-gray-600 dark:text-gray-300">
        Loading…
      </main>
    );

  const pred = row.model;
  const conf = row.confidence;

  const month = row.month; // already next month from backend
  const updated = new Date(row.created_at).toLocaleString("id-ID");

  return (
    <main
      className="
      min-h-screen 
      bg-gray-100 text-gray-900 
      dark:bg-[#0d0d0d] dark:text-gray-100
      p-6 md:p-10
    "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Fuel Price Forecast – Indonesia
        </h1>

        <button
          onClick={() => setDark(!dark)}
          className="
            px-3 py-1 border rounded text-sm
            dark:border-gray-500 dark:bg-gray-800
          "
        >
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <p className="text-lg mb-6">
        Predicted retail prices for <strong>{month}</strong>
      </p>

      {/* ===================================================
                     GROUPED RON SECTIONS
      =================================================== */}
      <div className="space-y-10">
        {Object.entries(RON_GROUPS).map(([ronLabel, fuels]) => (
          <section key={ronLabel}>
            <h2 className="text-xl font-semibold mb-3 border-b border-gray-300 dark:border-gray-700 pb-1">
              {ronLabel}
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-800">
                  <th className="p-2 border border-gray-300 dark:border-gray-700 text-left">
                    Brand
                  </th>
                  <th className="p-2 border border-gray-300 dark:border-gray-700 text-right">
                    Predicted Price
                  </th>
                  <th className="p-2 border border-gray-300 dark:border-gray-700 text-center">
                    Confidence
                  </th>
                </tr>
              </thead>

              <tbody>
                {fuels.map((fuel) => (
                  <tr key={fuel} className="odd:bg-white even:bg-gray-50 dark:odd:bg-[#111] dark:even:bg-[#1a1a1a]">
                    <td className="p-2 border border-gray-300 dark:border-gray-700">
                      {NAME_MAP[fuel]}
                    </td>

                    <td className="p-2 border border-gray-300 dark:border-gray-700 text-right">
                      {roundToNearest10(pred[fuel]).toLocaleString("id-ID")}
                    </td>

                    <td className="p-2 border border-gray-300 dark:border-gray-700 text-center">
                      {Math.round(conf[fuel])}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-gray-500 dark:text-gray-400">
        Updated: {updated}
      </p>
    </main>
  );
}