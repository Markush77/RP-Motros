import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function VehiclePage(props: any) {
  const resolvedParams = await props.params;
  const id = parseInt(resolvedParams.id, 10);

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
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-6 py-16">
      <div className="mx-auto max-w-6xl">

        {/* Título y precio */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">
            {vehicle.name}
          </h1>
          <p className="text-3xl font-extrabold text-red-600">
            USD {vehicle.priceUsd.toLocaleString("en-US")}
          </p>
        </div>

        {/* Layout principal */}
        <div className="grid gap-10 md:grid-cols-2">

          {/* Imagen principal */}
          <div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={vehicle.imageUrl}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Ficha técnica */}
          <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4">
            <h2 className="text-xl font-bold mb-4">
              Ficha técnica
            </h2>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Año</span>
              <span>{vehicle.year}</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Kilometraje</span>
              <span>{vehicle.mileageKm.toLocaleString("es-UY")} Km</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Combustible</span>
              <span>{vehicle.fuel}</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Transmisión</span>
              <span>{vehicle.transmission}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold">Estado</span>
              <span className="capitalize">{vehicle.status}</span>
            </div>

            {/* Botón WhatsApp */}
            <a
              href={`https://wa.me/59898153089?text=Hola%20quiero%20información%20sobre%20${encodeURIComponent(vehicle.name)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block w-full text-center rounded-full bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-500 hover:scale-105"
            >
              Consultar por WhatsApp
            </a>

          </div>

        </div>

      </div>
    </main>
  );
}