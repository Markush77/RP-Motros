import Image from "next/image";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

type VehicleStatus = "disponible" | "reservado" | "vendido";

/* ========================= */
/* CLOUDINARY UNSIGNED */
/* ========================= */

async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET!;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!response.ok) {
    throw new Error("Error subiendo imagen.");
  }

  const data = await response.json();
  return data.secure_url;
}

/* ========================= */
/* CREATE VEHICLE */
/* ========================= */

async function createVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const name = String(formData.get("name"));
  const year = Number(formData.get("year"));
  const mileageKm = Number(formData.get("mileageKm"));
  const fuel = String(formData.get("fuel"));
  const transmission = String(formData.get("transmission"));
  const priceUsd = Number(formData.get("priceUsd"));
  const status = String(formData.get("status")) as VehicleStatus;
  const isFeatured = formData.get("isFeatured") === "on";

  const files = formData.getAll("imageFiles") as File[];

  if (!files.length) {
    throw new Error("Debes subir al menos una imagen.");
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (file.size > 0) {
      const url = await uploadImageToCloudinary(file);
      uploadedUrls.push(url);
    }
  }

  const mainImage = uploadedUrls[0];

  const [newVehicle] = await db
    .insert(vehicles)
    .values({
      name,
      year,
      mileageKm,
      fuel,
      transmission,
      priceUsd,
      imageUrl: mainImage,
      status,
      isFeatured,
    })
    .returning();

  for (const imageUrl of uploadedUrls) {
    await db.insert(vehicleImages).values({
      vehicleId: newVehicle.id,
      imageUrl,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

/* ========================= */
/* PAGE */
/* ========================= */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();

  const rows = await db
    .select()
    .from(vehicles)
    .orderBy(desc(vehicles.createdAt));

  return (
    <main className="min-h-screen bg-white p-10">
      <h1 className="text-2xl font-bold mb-6">Admin RP Motors</h1>

      <form
        action={createVehicle}
        encType="multipart/form-data"
        className="border p-6 rounded mb-10 space-y-4"
      >
        <h2 className="font-bold text-lg">Publicar nuevo vehículo</h2>

        <input name="name" required placeholder="Nombre" className="border p-2 w-full" />
        <input name="year" type="number" required placeholder="Año" className="border p-2 w-full" />
        <input name="mileageKm" type="number" required placeholder="Kilometraje" className="border p-2 w-full" />
        <input name="fuel" required placeholder="Combustible" className="border p-2 w-full" />
        <input name="transmission" required placeholder="Transmisión" className="border p-2 w-full" />
        <input name="priceUsd" type="number" required placeholder="Precio USD" className="border p-2 w-full" />

        <select name="status" className="border p-2 w-full">
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
        </select>

        <label className="flex gap-2 items-center">
          <input type="checkbox" name="isFeatured" defaultChecked />
          Destacado
        </label>

        {/* ✅ MULTIPLE FILE INPUT */}
        <input
          type="file"
          name="imageFiles"
          accept="image/*"
          multiple
          required
          className="border p-2 w-full"
        />

        <button className="bg-black text-white px-4 py-2 rounded">
          Publicar vehículo
        </button>
      </form>

      <h2 className="text-xl font-bold mb-4">
        Vehículos cargados: {rows.length}
      </h2>

      {rows.map((car) => (
        <div key={car.id} className="border p-6 mb-6 rounded">
          <Image
            src={car.imageUrl}
            alt={car.name}
            width={300}
            height={200}
            className="rounded mb-3"
          />
          <p className="font-semibold">{car.name}</p>
        </div>
      ))}
    </main>
  );
}