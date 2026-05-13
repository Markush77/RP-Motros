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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* HEADER VEHÍCULO */}
        <div className="mb-14">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {vehicle.name}
          </h1>

          <div className="mt-6 flex items-center gap-6">
            <p className="text-4xl md:text-5xl font-extrabold text-red-600">
              USD {vehicle.priceUsd.toLocaleString("en-US")}
            </p>

            <span className="px-4 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
              {vehicle.status}
            </span>
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid gap-16 lg:grid-cols-[1.7fr_1fr] items-start">

          {/* GALERÍA */}
          <div>
            <div className="relative h-[600px] w-full overflow-hidden rounded-3xl shadow-2xl group">
              <Image
                src={vehicle.imageUrl}
                alt={vehicle.name}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Miniaturas futuras */}
            <div className="mt-8 grid grid-cols-4 gap-4">
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-200" />
            </div>
          </div>

          {/* PANEL DERECHO */}
          <div className="relative">

            <div className="sticky top-28 rounded-3xl bg-white shadow-2xl p-10 border border-slate-100">

              <h2 className="text-2xl font-bold text-slate-900 mb-8">
                Ficha técnica
              </h2>

              <div className="space-y-5 text-slate-700">

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Año</span>
                  <span className="font-semibold">{vehicle.year}</span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Kilometraje</span>
                  <span className="font-semibold">
                    {vehicle.mileageKm.toLocaleString("es-UY")} Km
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Combustible</span>
                  <span className="font-semibold">{vehicle.fuel}</span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Transmisión</span>
                  <span className="font-semibold">{vehicle.transmission}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Estado</span>
                  <span className="font-semibold capitalize">
                    {vehicle.status}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={`https://wa.me/59898153089?text=Hola%20quiero%20información%20sobre%20${encodeURIComponent(
                  vehicle.name
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-10 block w-full text-center rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-red-600/40"
              >
                Consultar por WhatsApp
              </a>

              <p className="mt-4 text-xs text-slate-400 text-center">
                Respuesta rápida • Atención personalizada
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}