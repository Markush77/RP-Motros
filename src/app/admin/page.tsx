import Image from "next/image";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

type VehicleStatus = "disponible" | "reservado" | "vendido";

/* ========================= */
/* CLOUDINARY */
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

  if (!response.ok) throw new Error("Error subiendo imagen.");

  const data = await response.json();
  return data.secure_url;
}

/* ========================= */
/* CREATE */
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

  if (!files.length) throw new Error("Debes subir al menos una imagen.");

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
/* UPDATE */
/* ========================= */

async function updateVehicle(formData: FormData) {
  "use server";
  await requireAdminSession();

  const id = Number(formData.get("id"));

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
/* PAGE */
/* ========================= */

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();

  const rows = await db
    .select()
    .from(vehicles)
    .orderBy(desc(vehicles.createdAt));

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-12">
          <p className="text-sm uppercase tracking-widest text-red-500">
            Panel administrativo
          </p>
          <h1 className="text-4xl font-extrabold mt-2">
            Admin RP Motors
          </h1>
        </div>

        {/* FORM CREAR */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-2xl mb-16">
          <h2 className="text-2xl font-bold mb-8">
            Publicar nuevo vehículo
          </h2>

          <form
            action={createVehicle}
            encType="multipart/form-data"
            className="grid md:grid-cols-2 gap-6"
          >
            <input name="name" required placeholder="Nombre" className="input-admin" />
            <input name="year" type="number" required placeholder="Año" className="input-admin" />
            <input name="mileageKm" type="number" required placeholder="Kilometraje" className="input-admin" />
            <input name="fuel" required placeholder="Combustible" className="input-admin" />
            <input name="transmission" required placeholder="Transmisión" className="input-admin" />
            <input name="priceUsd" type="number" required placeholder="Precio USD" className="input-admin" />

            <select name="status" className="input-admin">
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked />
              Vehículo destacado
            </label>

            <div className="md:col-span-2">
              <input
                type="file"
                name="imageFiles"
                accept="image/*"
                multiple
                required
                className="input-admin"
              />
            </div>

            <div className="md:col-span-2">
              <button className="w-full rounded-xl bg-red-600 py-3 font-bold hover:bg-red-500 transition">
                Publicar vehículo
              </button>
            </div>
          </form>
        </div>

        {/* LISTADO */}
        <h2 className="text-2xl font-bold mb-8">
          Vehículos cargados ({rows.length})
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {rows.map((car) => (
            <div
              key={car.id}
              className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl"
            >
              <div className="relative h-56">
                <Image
                  src={car.imageUrl}
                  alt={car.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6">
                <form action={updateVehicle} className="space-y-3">
                  <input type="hidden" name="id" value={car.id} />

                  <input name="name" defaultValue={car.name} className="input-admin" />
                  <input name="year" type="number" defaultValue={car.year} className="input-admin" />
                  <input name="mileageKm" type="number" defaultValue={car.mileageKm} className="input-admin" />
                  <input name="fuel" defaultValue={car.fuel} className="input-admin" />
                  <input name="transmission" defaultValue={car.transmission} className="input-admin" />
                  <input name="priceUsd" type="number" defaultValue={car.priceUsd} className="input-admin" />

                  <select
                    name="status"
                    defaultValue={car.status}
                    className="input-admin"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                  </select>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      defaultChecked={car.isFeatured}
                    />
                    Destacado
                  </label>

                  <button className="w-full rounded-xl bg-emerald-600 py-2 font-semibold hover:bg-emerald-500 transition">
                    Guardar cambios
                  </button>
                </form>

                <form action={deleteVehicle} className="mt-4">
                  <input type="hidden" name="id" value={car.id} />
                  <button className="text-sm font-semibold text-red-500 hover:text-red-400 transition">
                    Eliminar vehículo
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}