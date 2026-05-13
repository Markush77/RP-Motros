import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function VehiclePage(props: any) {
  const params = await props.params;
  const id = parseInt(params.id, 10);

  if (!id || isNaN(id)) return notFound();

  const result = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id));

  const vehicle = result[0];

  if (!vehicle) return notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* Título */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight">
            {vehicle.name}
          </h1>
          <p className="mt-4 text-4xl font-extrabold text-red-600">
            USD {vehicle.priceUsd.toLocaleString("en-US")}
          </p>
        </div>

        {/* Layout principal */}
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">

          {/* Galería grande */}
          <div>
            <div className="relative h-[550px] w-full overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src={vehicle.imageUrl}
                alt={vehicle.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Placeholder para futuras miniaturas */}
            <div className="mt-6 grid grid-cols-4 gap-4 opacity-60">
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-200" />
            </div>
          </div>

          {/* Ficha técnica elegante */}
          <div className="bg-white rounded-3xl shadow-xl p-10 space-y-6">

            <h2 className="text-2xl font-bold border-b pb-4">
              Ficha técnica
            </h2>

            <div className="flex justify-between border-b pb-3">
              <span className="font-semibold">Año</span>
              <span>{vehicle.year}</span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="font-semibold">Kilometraje</span>
              <span>{vehicle.mileageKm.toLocaleString("es-UY")} Km</span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="font-semibold">Combustible</span>
              <span>{vehicle.fuel}</span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="font-semibold">Transmisión</span>
              <span>{vehicle.transmission}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold">Estado</span>
              <span className="capitalize">{vehicle.status}</span>
            </div>

            <a
              href={`https://wa.me/59898153089?text=Hola%20quiero%20información%20sobre%20${encodeURIComponent(vehicle.name)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-block w-full text-center rounded-full bg-red-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-red-500 hover:scale-105"
            >
              Consultar por WhatsApp
            </a>

          </div>

        </div>

      </div>
    </main>
  );
}