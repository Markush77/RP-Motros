import Image from "next/image";
import { db } from "@/db";
import { vehicles } from "@/db/schema";

export const runtime = "nodejs";

export default async function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  const rows = await db.select().from(vehicles);

  return (
    <main style={{ padding: 40 }}>
      <h1>ID recibido: {params.id}</h1>
      <h2>Total vehículos en DB: {rows.length}</h2>

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(rows, null, 2)}
      </pre>
    </main>
  );
}