import Image from "next/image";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (!id || isNaN(id)) {
    return notFound();
  }

  // 👇 Usamos SQL directo para evitar problemas de comparación
  const vehicleResult = await db.execute(
    sql`SELECT * FROM vehicles WHERE id = ${id} LIMIT 1`
  );

  if (!vehicleResult.rows.length) {
    return notFound();
  }

  const vehicle = vehicleResult.rows[0];

  const imagesResult = await db.execute(
    sql`SELECT * FROM vehicle_images WHERE vehicle_id = ${id}`
  );

  const images = imagesResult.rows;

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-extrabold mb-4">
          {vehicle.name}
        </h1>

        <p className="text-3xl font-extrabold text-red-600 mb-8">
          USD {Number(vehicle.price_usd).toLocaleString("en-US")}
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative h-[450px] w-full overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={vehicle.image_url}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {images.map((img: any) => (
              <div
                key={img.id}
                className="relative h-32 w-full overflow-hidden rounded-xl shadow-md"
              >
                <Image
                  src={img.image_url}
                  alt="Imagen vehículo"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}