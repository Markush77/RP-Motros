import { createHash } from "node:crypto";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getRequiredEnv, requireAdminSession } from "@/lib/auth";

type VehicleStatus = "disponible" | "reservado" | "vendido";

async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getRequiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signatureBase).digest("hex");

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error("No se pudo subir la imagen a Cloudinary.");
  }

  const payload = (await response.json()) as { secure_url?: string };
  if (!payload.secure_url) {
    throw new Error("Cloudinary no devolvió URL de imagen.");
  }

  return payload.secure_url;
}

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
    throw new Error("Completá todos los campos obligatorios.");
  }

  if (!Number.isFinite(year) || year < 1990 || year > 2100) {
    throw new Error("Año inválido.");
  }

  if (!Number.isFinite(mileageKm) || mileageKm < 0) {
    throw new Error("Kilometraje inválido.");
  }

  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("Precio inválido.");
  }

  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    throw new Error("Debes subir una foto.");
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

  if (!Number.isFinite(id)) {
    throw new Error("ID inválido.");
  }

  if (!name || !fuel || !transmission) {
    throw new Error("Completá todos los campos obligatorios.");
  }

  if (!Number.isFinite(year) || year < 1990 || year > 2100) {
    throw new Error("Año inválido.");
  }

  if (!Number.isFinite(mileageKm) || mileageKm < 0) {
    throw new Error("Kilometraje inválido.");
  }

  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("Precio inválido.");
  }

  let imageUrl = currentImageUrl;

  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadImageToCloudinary(imageFile);
  }

  if (!imageUrl) {
    throw new Error("El vehículo debe tener imagen.");
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

async function deleteVehicle(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("ID inválido.");
  }

  await db.delete(vehicles).where(eq(vehicles.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  await requireAdminSession();

  const rows = await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Admin RP Motors</h1>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-slate-900">Cerrar sesión</button>
        </form>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_1.45fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Alta de vehículo</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">Crear unidad</h2>

          <form action={createVehicle} className="mt-5 grid gap-3">
            <input name="name" required placeholder="Nombre / versión" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input name="year" type="number" required placeholder="Año" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
              <input name="mileageKm" type="number" required placeholder="Kilometraje (km)" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="fuel" required placeholder="Combustible" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
              <input name="transmission" required placeholder="Transmisión" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            </div>
            <input name="priceUsd" type="number" required placeholder="Precio USD" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />

            <select name="status" defaultValue="disponible" className="rounded-xl border border-slate-300 px-4 py-3 text-sm">
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input name="isFeatured" type="checkbox" defaultChecked className="size-4" />
              Mostrar en destacados
            </label>

            <input name="imageFile" type="file" accept="image/*" required className="text-sm" />

            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700">Crear vehículo</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">CRUD de inventario ({rows.length})</h2>
          <div className="mt-5 space-y-4">
            {rows.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Sin vehículos cargados.</p>
            ) : (
              rows.map((car) => (
                <article key={car.id} className="rounded-xl border border-slate-200 p-4">
                  <form action={updateVehicle} className="grid gap-3">
                    <input type="hidden" name="id" value={car.id} />
                    <input type="hidden" name="currentImageUrl" value={car.imageUrl} />

                    <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                      <div className="relative h-24 w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
                        <Image src={car.imageUrl} alt={car.name} fill className="object-cover" sizes="120px" />
                      </div>
                      <div className="grid gap-2">
                        <input name="name" defaultValue={car.name} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <input name="year" type="number" defaultValue={car.year} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input name="mileageKm" type="number" defaultValue={car.mileageKm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input name="fuel" defaultValue={car.fuel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input name="transmission" defaultValue={car.transmission} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        </div>
                        <input name="priceUsd" type="number" defaultValue={car.priceUsd} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />

                        <select name="status" defaultValue={car.status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                          <option value="disponible">Disponible</option>
                          <option value="reservado">Reservado</option>
                          <option value="vendido">Vendido</option>
                        </select>

                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input name="isFeatured" type="checkbox" defaultChecked={car.isFeatured} className="size-4" />
                          Destacado
                        </label>

                        <input name="imageFile" type="file" accept="image/*" className="text-xs" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">Guardar cambios</button>
                    </div>
                  </form>

                  <form action={deleteVehicle} className="mt-2">
                    <input type="hidden" name="id" value={car.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Eliminar vehículo</button>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
