import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { notFound } from "next/navigation";
import VehicleGallery from "./VehicleGallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  const vehicleResult = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id));

  const vehicle = vehicleResult[0];

  if (!vehicle) return notFound();

  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, id));

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-6 py-16">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-extrabold mb-2">
          {vehicle.name}
        </h1>

        <p className="text-3xl font-extrabold text-red-600 mb-8">
          USD {vehicle.priceUsd.toLocaleString("en-US")}
        </p>

        <VehicleGallery
          mainImage={vehicle.imageUrl}
          images={images}
        />

      </div>
    </main>
  );
}