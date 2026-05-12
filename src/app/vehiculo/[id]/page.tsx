import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id));

  if (!vehicle) return notFound();

  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, id));

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-extrabold mb-4">
          {vehicle.name}
        </h1>

        <p className="text-3xl font-extrabold text-red-600 mb-8">
          USD {vehicle.priceUsd.toLocaleString("en-US")}
        </p>

        <div className="grid gap-6 md:grid-cols-2">

          <div className="relative h-[450px] w-full overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={vehicle.imageUrl}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
          </div>

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
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 text-sm text-slate-700">
          <div>
            <p className="font-semibold">Año</p>
            <p>{vehicle.year}</p>
          </div>

          <div>
            <p className="font-semibold">Kilometraje</p>
            <p>{vehicle.mileageKm.toLocaleString("es-UY")} Km</p>
          </div>

          <div>
            <p className="font-semibold">Combustible</p>
            <p>{vehicle.fuel}</p>
          </div>

          <div>
            <p className="font-semibold">Transmisión</p>
            <p>{vehicle.transmission}</p>
          </div>

          <div>
            <p className="font-semibold">Estado</p>
            <p className="capitalize">{vehicle.status}</p>
          </div>
        </div>

      </div>
    </main>
  );
}