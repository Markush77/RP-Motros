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
              <Link key={car.id} href={`/vehiculo/${car.id}`} className="block">
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
                    <p className="mt-1 text-xs text-slate-500">Montevideo, Uruguay</p>
                    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-red-500 group-hover:gap-3 transition-all duration-300">
                      Ver detalles <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 pt-14 pb-8 px-6">
        <div className="mx-auto max-w-7xl">

          {/* FILA PRINCIPAL */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">

            {/* LOGO + INFO */}
            <div className="flex flex-col gap-4">
              <Image
                src="/logo.png"
                alt="RP Motors"
                width={140}
                height={56}
                className="object-contain"
              />
              <div className="flex flex-col gap-1 text-sm text-slate-400">
                <span>📍 Av. General Flores 3474, Montevideo</span>
                <a
                  href="tel:+59822032070"
                  className="hover:text-white transition"
                >
                  📞 2203 2070
                </a>
                <a
                  href="https://wa.me/59898153089"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition"
                >
                  💬 WhatsApp: 098 153 089
                </a>
              </div>
            </div>

            {/* REDES SOCIALES */}
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                Seguinos
              </p>

              {/* INSTAGRAM */}
              <a
                href="https://www.instagram.com/automotorarpmotors/?hl=es-la"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg group-hover:scale-110 transition">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="text-sm">Instagram</span>
              </a>

              {/* FACEBOOK */}
              <a
                href="https://www.facebook.com/RPAUTOMOVILES/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg group-hover:scale-110 transition">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-sm">Facebook</span>
              </a>

              {/* MERCADO LIBRE */}
              <a
                href="https://vehiculos.mercadolibre.com.uy/_CustId_135332403"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 shadow-lg group-hover:scale-110 transition">
                  <svg className="h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm0 4.5c1.11 0 2.01.9 2.01 2.01S13.11 8.52 12 8.52c-1.11 0-2.01-.9-2.01-2.01S10.89 4.5 12 4.5zm4.5 10.5h-9v-1.5l2.25-3 1.5 2.25 2.25-3 3 4.5-.75.75z"/>
                  </svg>
                </div>
                <span className="text-sm">Mercado Libre</span>
              </a>

            </div>
          </div>

          {/* LÍNEA + COPYRIGHT */}
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600 text-center">
              © {new Date().getFullYear()} RP Motors · Av. General Flores 3474, Montevideo, Uruguay
            </p>
            <p className="text-xs text-slate-700">
              Todos los derechos reservados.
            </p>
          </div>

        </div>
      </footer>

    </main>
  );
}