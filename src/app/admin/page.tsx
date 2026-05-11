import { createHash } from "node:crypto";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

type VehicleStatus = "disponible" | "reservado" | "vendido";

/* ========================= */
/* ENV SAFE */
/* ========================= */
function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno: ${name}`);
  }
  return value;
}

/* ========================= */
/* CLOUDINARY */
/* ========================= */
async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const apiSecret = getEnv("CLOUDINARY_API_SECRET");

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = createHash("sha1")
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error("Error subiendo imagen.");
  }

  const data = await response.json();
  return data.secure_url as string;
}

/* ========================= */
/* CREATE */
/* ========================= */
async function createVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const year = Number(formData.get("year"));
  const mileageKm = Number(formData.get("mileageKm"));
  const fuel = String(formData.get("fuel") ?? "").trim();
  const transmission = String(formData.get("transmission") ?? "").trim();
  const priceUsd = Number(formData.get("priceUsd"));
  const status = String(formData.get("status") ?? "disponible") as VehicleStatus;
  const isFeatured = formData.get("isFeatured") === "on";
  const imageFile = formData.get("imageFile");

  if (!name || !fuel || !transmission) {
    throw new Error("Faltan campos obligatorios.");
  }

  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    throw new Error("Debes subir una imagen.");
  }

  const imageUrl = await uploadImageToCloudinary(imageFile);

  await db.insert(vehicles).values({
    name,
    year,
    mileageKm,
    fuel,
    transmission,
    priceUsd,
    imageUrl,
    status,
    isFeatured,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

/* ========================= */
/* UPDATE */
/* ========================= */
async function updateVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = Number(formData.get("id"));
  const imageFile = formData.get("imageFile");
  const currentImageUrl = String(formData.get("currentImageUrl") ?? "");

  let imageUrl = currentImageUrl;

  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadImageToCloudinary(imageFile);
  }

  await db
    .update(vehicles)
    .set({
      name: String(formData.get("name")),
      year: Number(formData.get("year")),
      mileageKm: Number(formData.get("mileageKm")),
      fuel: String(formData.get("fuel")),
      transmission: String(formData.get("transmission")),
      priceUsd: Number(formData.get("priceUsd")),
      status: String(formData.get("status")) as VehicleStatus,
      isFeatured: formData.get("isFeatured") === "on",
      imageUrl,
    })
    .where(eq(vehicles.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
}

/* ========================= */
/* DELETE */
/* ========================= */
async function deleteVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = Number(formData.get("id"));

  await db.delete(vehicles).where(eq(vehicles.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
}

/* ========================= */
/* CONFIG */
/* ========================= */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========================= */
/* PAGE */
/* ========================= */
export default async function AdminPage() {
  await requireAdminSession();

  const rows = await db
    .select()
    .from(vehicles)
    .orderBy(desc(vehicles.createdAt));

  return (
    <main className="min-h-screen bg-white p-10">
      <h1 className="text-2xl font-bold mb-6">Admin RP Motors</h1>

      {/* CREAR */}
      <form
        action={createVehicle}
        encType="multipart/form-data"
        className="border p-6 rounded mb-10 space-y-3"
      >
        <h2 className="font-bold text-lg">Publicar nuevo vehículo</h2>

        <input name="name" placeholder="Nombre" required className="border p-2 w-full" />
        <input name="year" type="number" placeholder="Año" required className="border p-2 w-full" />
        <input name="mileageKm" type="number" placeholder="Kilometraje" required className="border p-2 w-full" />
        <input name="fuel" placeholder="Combustible" required className="border p-2 w-full" />
        <input name="transmission" placeholder="Transmisión" required className="border p-2 w-full" />
        <input name="priceUsd" type="number" placeholder="Precio USD" required className="border p-2 w-full" />

        <select name="status" className="border p-2 w-full">
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
        </select>

        <label className="flex gap-2 items-center">
          <input type="checkbox" name="isFeatured" defaultChecked />
          Destacado
        </label>

        <input type="file" name="imageFile" accept="image/*" required />

        <button className="bg-black text-white px-4 py-2 rounded">
          Publicar vehículo
        </button>
      </form>

      {/* LISTADO */}
      <h2 className="text-xl font-bold mb-4">
        Vehículos cargados: {rows.length}
      </h2>

      {rows.map((car) => (
        <div key={car.id} className="border p-6 mb-6 rounded">
          <form
            action={updateVehicle}
            encType="multipart/form-data"
            className="space-y-2"
          >
            <input type="hidden" name="id" value={car.id} />
            <input type="hidden" name="currentImageUrl" value={car.imageUrl} />

            <Image
              src={car.imageUrl}
              alt={car.name}
              width={250}
              height={160}
              className="rounded"
            />

            <input name="name" defaultValue={car.name} className="border p-2 w-full" />
            <input name="year" type="number" defaultValue={car.year} className="border p-2 w-full" />
            <input name="mileageKm" type="number" defaultValue={car.mileageKm} className="border p-2 w-full" />
            <input name="fuel" defaultValue={car.fuel} className="border p-2 w-full" />
            <input name="transmission" defaultValue={car.transmission} className="border p-2 w-full" />
            <input name="priceUsd" type="number" defaultValue={car.priceUsd} className="border p-2 w-full" />

            <select name="status" defaultValue={car.status} className="border p-2 w-full">
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>

            <label className="flex gap-2 items-center">
              <input type="checkbox" name="isFeatured" defaultChecked={car.isFeatured} />
              Destacado
            </label>

            <input type="file" name="imageFile" accept="image/*" />

            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Guardar cambios
            </button>
          </form>

          <form action={deleteVehicle} className="mt-3">
            <input type="hidden" name="id" value={car.id} />
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={(e) => {
                if (!confirm("¿Eliminar vehículo?")) e.preventDefault();
              }}
            >
              Eliminar
            </button>
          </form>
        </div>
      ))}
    </main>
  );
}