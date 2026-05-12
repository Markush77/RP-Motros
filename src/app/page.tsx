import type { Metadata } from "next";
import Image from "next/image";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";

const testimonials = [
  { author: "Ricardo López", text: "Excelente en todo, atención y vehículos.", rating: "★★★★★" },
  { author: "Álvaro Lacalle", text: "Excelente experiencia, cuando cambie el auto vuelvo sin duda.", rating: "★★★★★" },
  { author: "Reseña en Google", text: "Muy buena atención y trato claro durante la consulta.", rating: "★★★★★" },
  { author: "Reseña en Google", text: "Proceso ágil, con buena disposición para resolver dudas.", rating: "★★★★☆" },
  { author: "Reseña en Google", text: "Vehículo en buen estado y documentación explicada paso a paso.", rating: "★★★★★" },
  { author: "Reseña en Google", text: "Atención personalizada y respuesta rápida por WhatsApp.", rating: "★★★★★" },
];

const statusStyles: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  reservado: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  vendido: "bg-slate-200 text-slate-800 ring-1 ring-slate-400",
};

export async function generateMetadata(): Promise<Metadata> {
  const countResult = await db.select({ count: count() }).from(vehicles);
  const totalVehicles = countResult[0]?.count ?? 0;

  const title = `RP Motors | ${totalVehicles} vehículos en stock`;
  const description =
    "Compraventa de automóviles usados en Montevideo. Fichas claras, contacto directo y atención personalizada.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_UY",
      siteName: "RP Motors",
    },
  };
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredCars = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isFeatured, true))
    .orderBy(desc(vehicles.createdAt))
    .limit(15);

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              RP Motors
            </p>
            <p className="text-sm font-bold">Compraventa de automóviles</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+59822032070"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-slate-900"
            >
              Llamar
            </a>
            <a
              href="https://wa.me/59898153089?text=Hola%20RP%20Motors"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] min-h-[500px]">
        <Image
          src="https://images.pexels.com/photos/4895421/pexels-photo-4895421.jpeg"
          alt="Concesionaria"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-14 text-white">
            <p className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em]">
              Confianza • Transparencia • Profesionalismo
            </p>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight">
              Tu próximo auto está en RP Motors
            </h1>
            <p className="mt-4 text-lg text-slate-200">
              Atención clara, inspección con mecánico y acompañamiento legal.
            </p>
          </div>
        </div>
      </section>

      {/* VEHÍCULOS */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">

        <div className="mx-auto w-16 h-1 bg-red-600 rounded-full mb-6"></div>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Destacados
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">
            Vehículos seleccionados
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {featuredCars.map((car) => (
            <article
              key={car.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative h-56 w-full">
                <Image
                  src={car.imageUrl}
                  alt={car.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold">{car.name}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusStyles[car.status]}`}
                  >
                    {car.status}
                  </span>
                </div>

                <p className="mt-2 text-3xl font-extrabold text-red-600 tracking-tight">
                  USD {car.priceUsd.toLocaleString("en-US")}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  {car.year} | {car.mileageKm.toLocaleString("es-UY")} Km
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Montevideo, Uruguay
                </p>

                <a
                  href="https://wa.me/59898153089?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20este%20veh%C3%ADculo"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-slate-700 hover:scale-105"
                >
                  Solicitar ficha completa
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}