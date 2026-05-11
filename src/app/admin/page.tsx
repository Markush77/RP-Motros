import { createHash } from "node:crypto";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

type VehicleStatus = "disponible" | "reservado" | "vendido";

/* ========================================================= */
/* ✅ Helper seguro para variables de entorno */
/* ========================================================= */
function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno: ${name}`);
  }
  return value;
}

/* ========================================================= */
/* ✅ Cloudinary upload */
/* ========================================================= */
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
    throw new Error("Error subiendo imagen a Cloudinary.");
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary no devolvió URL.");
  }

  return data.secure_url as string;
}

/* ========================================================= */
/* ✅ CREATE */
/* ========================================================= */
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
    throw new Error("Campos obligatorios faltantes.");
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

/* ========================================================= */
/* ✅ UPDATE */
/* ========================================================= */
async function updateVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const year = Number(formData.get("year"));
  const mileageKm = Number(formData.get("mileageKm"));
  const fuel = String(formData.get("fuel") ?? "").trim();
  const transmission = String(formData.get("transmission") ?? "").trim();
  const priceUsd = Number(formData.get("priceUsd"));
  const status = String(formData.get("status") ?? "disponible") as VehicleStatus;
  const isFeatured = formData.get("isFeatured") === "on";
  const currentImageUrl = String(formData.get("currentImageUrl") ?? "").trim();
  const imageFile = formData.get("imageFile");

  let imageUrl = currentImageUrl;

  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadImageToCloudinary(imageFile);
  }

  await db
    .update(vehicles)
    .set({
      name,
      year,
      mileageKm,
      fuel,
      transmission,
      priceUsd,
      status,
      isFeatured,
      imageUrl,
    })
    .where(eq(vehicles.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
}

/* ========================================================= */
/* ✅ DELETE */
/* ========================================================= */
async function deleteVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = Number(formData.get("id"));

  await db.delete(vehicles).where(eq(vehicles.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
}

/* ========================================================= */
/* ✅ Config */
/* ========================================================= */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========================================================= */
/* ✅ PAGE */
/* ========================================================= */
export default async function AdminPage() {
  await requireAdminSession();

  const rows = await db
    .select()
    .from(vehicles)
    .orderBy(desc(vehicles.createdAt));

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">Admin RP Motors</h1>

      <p className="mb-4">Vehículos cargados: {rows.length}</p>

      {rows.map((car) => (
        <div key={car.id} className="border p-4 mb-4 rounded">
          <Image
            src={car.imageUrl}
            alt={car.name}
            width={200}
            height={150}
          />
          <p className="font-bold mt-2">{car.name}</p>
        </div>
      ))}
    </main>
  );
}