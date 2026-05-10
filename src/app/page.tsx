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
  disponible: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  reservado: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  vendido: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
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

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "RP Motors",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Gral. Flores 3474",
      addressLocality: "Montevideo",
      addressCountry: "UY",
    },
    telephone: "+59898153089",
    url: "/",
    sameAs: ["https://wa.me/59898153089"],
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">RP Motors</p>
            <p className="text-sm font-bold">Compraventa de automóviles</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="tel:+59822032070"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-900 sm:text-sm"
            >
              Llamar
            </a>
            <a
              href="https://wa.me/59898153089?text=Hola%20RP%20Motors%2C%20quiero%20asesoramiento"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 sm:text-sm"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/4895421/pexels-photo-4895421.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600"
          alt="Atención profesional en concesionaria"
          width={1600}
          height={900}
          priority
          className="h-[70vh] min-h-[500px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-slate-900/20" />

        <div className="absolute inset-0 mx-auto flex w-full max-w-6xl items-end px-4 pb-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              Confianza • Transparencia • Profesionalismo
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">Tu próximo auto está en RP Motors</h1>
            <p className="mt-4 text-base text-slate-200 sm:text-lg">
              Publicamos datos claros, permitimos inspección con mecánico y te acompañamos en todo el proceso legal.
            </p>
          </div>
        </div>
      </section>

      <section id="vehiculos" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Destacados</p>
            <h2 className="mt-2 text-3xl font-extrabold">Vehículos seleccionados</h2>
          </div>
        </div>

        {featuredCars.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            Estamos actualizando el inventario. Consultanos por WhatsApp para enviarte el listado completo.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCars.map((car) => (
              <article key={car.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-52 w-full">
                  <Image src={car.imageUrl} alt={car.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold">{car.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${statusStyles[car.status]}`}>{car.status}</span>
                  </div>
                  <p className="mt-1 text-2xl font-extrabold text-red-700">USD {car.priceUsd.toLocaleString("en-US")}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    {car.year} | {car.mileageKm.toLocaleString("es-UY")} Km
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Bolívar - Montevideo</p>
                  <a
                    href="https://wa.me/59898153089?text=Hola%20RP%20Motors%2C%20quiero%20la%20ficha%20completa%20de%20este%20veh%C3%ADculo"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Solicitar ficha completa
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">
          <h3 className="text-3xl font-extrabold">Agendá tu visita</h3>
          <p className="mt-3 text-sm text-slate-200">Av. Gral. Flores 3474, Montevideo</p>
          <p className="mt-1 text-sm text-slate-200">Cel: 098 153 089 · Tel: 2203 2070</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://wa.me/59898153089?text=Hola%2C%20quiero%20agendar%20una%20visita%20a%20RP%20Motors"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
            >
              WhatsApp
            </a>
            <a href="tel:+59822032070" className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:border-white">
              Llamar ahora
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <summary className="cursor-pointer select-none font-medium text-slate-700">Ver reseñas de Google (4.2 / 5 · 49 opiniones)</summary>
          <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={`${item.author}-${item.text}`} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                <p className="text-xs text-amber-500">{item.rating}</p>
                <p className="mt-1 line-clamp-3 text-xs text-slate-600">“{item.text}”</p>
                <span className="mt-1 block text-xs font-semibold text-slate-700">— {item.author}</span>
              </blockquote>
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}
