import Image from "next/image";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, vehicleImages } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

type VehicleStatus = "disponible" | "reservado" | "vendido";

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

async function createVehicle(formData: FormData) {
  "use server";
  await requireAdminSession();

  const files = formData.getAll("imageFiles") as File[];
  if (!files.length) throw new Error("Debes subir al menos una imagen.");

  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (file.size > 0) {
      const url = await uploadImageToCloudinary(file);
      uploadedUrls.push(url);
    }
  }

  const [newVehicle] = await db
    .insert(vehicles)
    .values({
      name: String(formData.get("name")),
      year: Number(formData.get("year")),
      mileageKm: Number(formData.get("mileageKm")),
      fuel: String(formData.get("fuel")),
      transmission: String(formData.get("transmission")),
      priceUsd: Number(formData.get("priceUsd")),
      imageUrl: uploadedUrls[0],
      status: String(formData.get("status")) as VehicleStatus,
      isFeatured: formData.get("isFeatured") === "on",
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

async function updateVehicle(formData: FormData) {
  "use server";
  await requireAdminSession();

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
    .where(eq(vehicles.id, Number(formData.get("id"))));

  revalidatePath("/");
  revalidatePath("/admin");
}

async function addImagesToVehicle(formData: FormData) {
  "use server";
  await requireAdminSession();

  const vehicleId = Number(formData.get("vehicleId"));
  const files = formData.getAll("newImages") as File[];

  for (const file of files) {
    if (file.size > 0) {
      const url = await uploadImageToCloudinary(file);
      await db.insert(vehicleImages).values({
        vehicleId,
        imageUrl: url,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

async function deleteVehicleImage(formData: FormData) {
  "use server";
  await requireAdminSession();

  await db
    .delete(vehicleImages)
    .where(eq(vehicleImages.id, Number(formData.get("imageId"))));

  revalidatePath("/");
  revalidatePath("/admin");
}

async function deleteVehicle(formData: FormData) {
  "use server";
  await requireAdminSession();

  await db
    .delete(vehicles)
    .where(eq(vehicles.id, Number(formData.get("id"))));

  revalidatePath("/");
  revalidatePath("/admin");
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();

  const rows = await db
    .select()
    .from(vehicles)
    .orderBy(desc(vehicles.createdAt));

  const allImages = await db.select().from(vehicleImages);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-14">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-red-500">
            Panel administrativo
          </p>
          <h1 className="text-3xl font-bold mt-2">
            Vehículos cargados ({rows.length})
          </h1>
        </div>

        {/* CREAR VEHÍCULO */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 mb-12">
          <h2 className="text-lg font-semibold mb-6">
            Publicar nuevo vehículo
          </h2>

          <form
            action={createVehicle}
            encType="multipart/form-data"
            className="grid md:grid-cols-3 gap-4"
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

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked />
              Destacado
            </label>

            <div className="md:col-span-3">
              <input
                type="file"
                name="imageFiles"
                accept="image/*"
                multiple
                required
                className="input-admin"
              />
            </div>

            <div className="md:col-span-3">
              <button className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold hover:bg-red-500 transition">
                Publicar vehículo
              </button>
            </div>
          </form>
        </div>

        {/* LISTADO */}
        <div className="space-y-3">
          {rows.map((car) => {
            const carImages = allImages.filter((img) => img.vehicleId === car.id);

            return (
              <details
                key={car.id}
                className="group rounded-xl border border-slate-800 bg-slate-900 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-6 cursor-pointer px-5 py-4 hover:bg-slate-800 transition">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-20 rounded-md overflow-hidden">
                      <Image
                        src={car.imageUrl}
                        alt={car.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{car.name}</p>
                      <p className="text-xs text-slate-400">
                        {car.year} • {car.mileageKm.toLocaleString()} km
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <span className="text-red-500 font-semibold text-sm">
                      USD {car.priceUsd.toLocaleString("en-US")}
                    </span>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      car.status === "disponible"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : car.status === "reservado"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-600 text-slate-300"
                    }`}>
                      {car.status}
                    </span>
                    <span className="text-slate-500 text-xs group-open:rotate-180 transition">▼</span>
                  </div>
                </summary>

                {/* PANEL EDICIÓN */}
                <div className="border-t border-slate-800 p-6 bg-slate-950 space-y-8">

                  {/* EDITAR DATOS */}
                  <form action={updateVehicle} className="grid md:grid-cols-3 gap-4">
                    <input type="hidden" name="id" value={car.id} />
                    <input name="name" defaultValue={car.name} className="input-admin" />
                    <input name="year" type="number" defaultValue={car.year} className="input-admin" />
                    <input name="mileageKm" type="number" defaultValue={car.mileageKm} className="input-admin" />
                    <input name="fuel" defaultValue={car.fuel} className="input-admin" />
                    <input name="transmission" defaultValue={car.transmission} className="input-admin" />
                    <input name="priceUsd" type="number" defaultValue={car.priceUsd} className="input-admin" />
                    <select name="status" defaultValue={car.status} className="input-admin">
                      <option value="disponible">Disponible</option>
                      <option value="reservado">Reservado</option>
                      <option value="vendido">Vendido</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="isFeatured" defaultChecked={car.isFeatured} />
                      Destacado
                    </label>
                    <div className="md:col-span-3">
                      <button className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold hover:bg-emerald-500 transition">
                        Guardar cambios
                      </button>
                    </div>
                  </form>

                  {/* FOTOS ACTUALES */}
                  {carImages.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-3">
                        Fotos actuales ({carImages.length})
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {carImages.map((img) => (
                          <div key={img.id} className="relative group/img">
                            <div className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-700">
                              <Image
                                src={img.imageUrl}
                                alt="foto"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <form action={deleteVehicleImage}>
                              <input type="hidden" name="imageId" value={img.id} />
                              <button className="mt-1 w-full text-xs text-red-500 hover:text-red-400 transition">
                                Eliminar
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AGREGAR FOTOS */}
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-3">
                      Agregar más fotos
                    </p>
                    <form
                      action={addImagesToVehicle}
                      encType="multipart/form-data"
                      className="flex flex-col gap-3"
                    >
                      <input type="hidden" name="vehicleId" value={car.id} />
                      <input
                        type="file"
                        name="newImages"
                        accept="image/*"
                        multiple
                        className="input-admin"
                      />
                      <div>
                        <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold hover:bg-blue-500 transition">
                          Subir fotos
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* ELIMINAR VEHÍCULO */}
                  <form action={deleteVehicle}>
                    <input type="hidden" name="id" value={car.id} />
                    <button className="text-xs font-medium text-red-500 hover:text-red-400 transition">
                      Eliminar vehículo
                    </button>
                  </form>

                </div>
              </details>
            );
          })}
        </div>

      </div>
    </main>
  );
}