import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { notFound } from "next/navigation";
import ImageCarousel from "./ImageCarousel";

export const runtime = "nodejs";

const statusStyles: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
  reservado: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
  vendido: "bg-slate-200 text-slate-600 ring-1 ring-slate-400",
};

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

  // ✅ Traer imágenes múltiples
  const imagesResult = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, id));

  const images =
    imagesResult.length > 0
      ? imagesResult.map((img) => img.imageUrl)
      : [vehicle.imageUrl]; // fallback por si no hay imágenes extra

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur shadow-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="RP Motors"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="tel:+59822032070"
              className="rounded-full border border-slate-600 text-white px-6 py-2 text-sm font-semibold transition hover:border-white hover:bg-white hover:text-slate-900"
            >
              Llamar
            </a>
            <a
              href="https://wa.me/59898153089?text=Hola%20RP%20Motors"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 hover:scale-105 shadow-lg shadow-emerald-500/20"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="mx-auto max-w-7xl px-6 py-20">

        {/* BREADCRUMB */}
        <div className="mb-10 flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{vehicle.name}</span>
        </div>

        {/* TÍTULO Y PRECIO */}
        <div className="mb-14">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            {vehicle.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <p className="text-4xl md:text-5xl font-extrabold text-red-500">
              USD {vehicle.priceUsd.toLocaleString("en-US")}
            </p>
            <span
              className={`rounded-full px-5 py-1.5 text-sm font-bold capitalize ${statusStyles[vehicle.status]}`}
            >
              {vehicle.status}
            </span>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr] items-start">

          {/* ✅ CAROUSEL REAL */}
          <ImageCarousel
            images={images}
            name={vehicle.name}
          />

          {/* FICHA TÉCNICA */}
          <div className="sticky top-28">
            <div className="rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-10">

              <h2 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-slate-700">
                Ficha técnica
              </h2>

              <div className="space-y-5 text-slate-300">

                <div className="flex justify-between py-3 border-b border-slate-800">
                  <span className="text-slate-400">Año</span>
                  <span className="font-bold text-white">{vehicle.year}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-slate-800">
                  <span className="text-slate-400">Kilometraje</span>
                  <span className="font-bold text-white">
                    {vehicle.mileageKm.toLocaleString("es-UY")} Km
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-slate-800">
                  <span className="text-slate-400">Combustible</span>
                  <span className="font-bold text-white">{vehicle.fuel}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-slate-800">
                  <span className="text-slate-400">Transmisión</span>
                  <span className="font-bold text-white">{vehicle.transmission}</span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="text-slate-400">Estado</span>
                  <span className="font-bold text-white capitalize">{vehicle.status}</span>
                </div>

              </div>

              {/* BOTÓN CTA */}
              <a
                href={`https://wa.me/59898153089?text=Hola%20quiero%20información%20sobre%20${encodeURIComponent(vehicle.name)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-10 block w-full text-center rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-red-600/30 transition hover:scale-105 hover:shadow-red-500/50"
              >
                Consultar por WhatsApp
              </a>

              <p className="mt-4 text-xs text-slate-500 text-center">
                Respuesta inmediata • Atención personalizada
              </p>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}