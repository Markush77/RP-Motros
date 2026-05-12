import Image from "next/image";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
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

  // 👇 Traemos TODOS los vehículos como hace el admin
  const rows = await db.select().from(vehicles);

  const vehicle = rows.find((v) => v.id === id);

  if (!vehicle) {
    return notFound();
  }

  const images = await db
    .select()
    .from(vehicleImages)
    .where((table) => table.vehicleId.eq(id));

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-extrabold mb-4">
          {vehicle.name}
        </h1>

        <p className="text-3xl font-extrabold text-red-600 mb-8">
          USD {vehicle.priceUsd.toLocaleString("en-US")}
        </p>

        <div className="relative h-[450px] w-full overflow-hidden rounded-3xl shadow-xl mb-8">
          <Image
            src={vehicle.imageUrl}
            alt={vehicle.name}
            fill
            className="object-cover"
          />
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative h-32 w-full overflow-hidden rounded-xl shadow-md"
              >
                <Image
                  src={img.imageUrl}
                  alt="Imagen vehículo"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}