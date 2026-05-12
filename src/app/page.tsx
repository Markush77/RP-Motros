import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";

const statusStyles: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  reservado: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  vendido: "bg-slate-200 text-slate-800 ring-1 ring-slate-400",
};

export async function generateMetadata(): Promise<Metadata> {
  const countResult = await db.select({ count: count() }).from(vehicles);
  const totalVehicles = countResult[0]?.count ?? 0;

  return {
    title: `RP Motors | ${totalVehicles} vehículos en stock`,
    description:
      "Compraventa de automóviles usados en Montevideo. Atención profesional y contacto directo.",
  };
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredCars = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isFeatured, true))
    .orderBy(desc(vehicles.createdAt))
    .limit(12);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              RP MOTORS
            </p>
            <p className="text-sm font-semibold">
              Compraventa de automóviles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+59822032070"
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold transition hover:border-slate-900"
            >
              Llamar
            </a>
            <a
              href="https://wa.me/59898153089?text=Hola%20RP%20Motors"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 hover:scale-105"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/4895421/pexels-photo-4895421.jpeg"
          alt="Concesionaria"
          fill
          priority
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />
      </section>

      {/* VEHÍCULOS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20">

        <div className="mx-auto mb-8 h-1 w-20 rounded-full bg-red-600"></div>

        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Destacados
          </p>
          <h2 className="mt-3 text-4xl font-extrabold">
            Vehículos seleccionados
          </h2>
        </div>

        {featuredCars.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-600">
            Estamos actualizando el inventario.
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-3">
            {featuredCars.map((car) => (
              <Link
                key={car.id}
                href={`/vehiculo/${car.id}`}
                className="block"
              >
                <div className="cursor-pointer group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl">

                  <div className="relative h-60 w-full overflow-hidden">
                    <Image
                      src={car.imageUrl}
                      alt={car.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-7">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold leading-snug">
                        {car.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[car.status]}`}
                      >
                        {car.status}
                      </span>
                    </div>

                    <p className="mt-3 text-4xl font-extrabold text-red-600 tracking-tight">
                      USD {car.priceUsd.toLocaleString("en-US")}
                    </p>

                    <p className="mt-4 text-sm text-slate-600">
                      {car.year} | {car.mileageKm.toLocaleString("es-UY")} Km
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Montevideo, Uruguay
                    </p>

                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}