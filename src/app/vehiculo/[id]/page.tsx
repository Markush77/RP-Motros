import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (!id || isNaN(id)) {
    return notFound();
  }

  const result = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id));

  const vehicle = result[0];

  if (!vehicle) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-extrabold mb-4">
          {vehicle.name}
        </h1>

        <p className="text-3xl font-extrabold text-red-600 mb-8">
          USD {vehicle.priceUsd.toLocaleString("en-US")}
        </p>

        <div className="relative h-[450px] w-full overflow-hidden rounded-3xl shadow-xl">
          <Image
            src={vehicle.imageUrl}
            alt={vehicle.name}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </main>
  );
}