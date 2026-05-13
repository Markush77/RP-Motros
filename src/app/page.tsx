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
    <main className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur shadow-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="RP Motors"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+59822032070"
              className="rounded-full border border-slate-600 text-white px-6 py-2 text-sm font-semibold transition-all duration-300 hover:border-white hover:bg-white hover:text-slate-900"
            >
              Llamar
            </a>
            <a
              href="https://wa.me/59898153089?text=Hola%20RP%20Motors"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-400 hover:scale-105 shadow-lg shadow-emerald-500/20"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/4895421/pexels-photo-4895421.jpeg"
          alt="Concesionaria"
          fill
          priority
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-red-500 font-semibold mb-4">
              Montevideo, Uruguay
            </p>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-white max-w-2xl">
              Tu próximo <br />
              <span className="text-red-500">auto ideal</span><br />
              está aquí.
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-md leading-relaxed">
              Compraventa de automóviles usados con atención profesional y contacto directo.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#vehiculos"
                className="rounded-full bg-red-600 px-8 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-red-500 hover:scale-105 shadow-lg shadow-red-600/30"
              >
                Ver vehículos
              </a>
              <a
                href="https://wa.me/59898153089?text=Hola%20RP%20Motors"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/30 px-8 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-slate-900"
              >
                Contactar ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* VEHÍCULOS */}
      <section id="vehiculos" className="mx-auto w-full max-w-7xl px-6 py-24">

        <div className="mb-4 h-1 w-16 rounded-full bg-red-600" />

        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-3">
            Destacados
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            Vehículos seleccionados
          </h2>
        </div>

        {featuredCars.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">
            Estamos actualizando el inventario.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {featuredCars.map((car) => (
              <Link
                key={car.id}
                href={`/vehiculo/${car.id}`}
                className="block"
              >
                <div className="cursor-pointer group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-slate-600">

                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={car.imageUrl}
                      alt={car.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold leading-snug text-white">
                        {car.name}
                      </h3>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[car.status]}`}>
                        {car.status}
                      </span>
                    </div>

                    <p className="mt-3 text-3xl font-extrabold text-red-500 tracking-tight">
                      USD {car.priceUsd.toLocaleString("en-US")}
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
                      <span>{car.year}</span>
                      <span className="text-slate-600">•</span>
                      <span>{car.mileageKm.toLocaleString("es-UY")} Km</span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Montevideo, Uruguay
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-red-500 group-hover:gap-3 transition-all duration-300">
                      Ver detalles
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <Image
            src="/logo.png"
            alt="RP Motors"
            width={140}
            height={56}
            className="object-contain"
          />
          <p className="text-sm text-slate-500 text-center">
            © {new Date().getFullYear()} RP Motors · Montevideo, Uruguay · Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="tel:+59822032070" className="text-sm text-slate-400 hover:text-white transition">
              Llamar
            </a>
            <a
              href="https://wa.me/59898153089"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}