"use client";

import Image from "next/image";
import { useState } from "react";

export default function VehiclePageClient({
  vehicle,
  images,
}: any) {
  const [mainImage, setMainImage] = useState(vehicle.imageUrl);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-6 py-16">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-extrabold mb-2">
          {vehicle.name}
        </h1>

        <p className="text-3xl font-extrabold text-red-600 mb-8">
          USD {vehicle.priceUsd.toLocaleString("en-US")}
        </p>

        <div className="grid gap-8 md:grid-cols-2">

          {/* Imagen principal */}
          <div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={mainImage}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Miniaturas */}
          <div className="grid grid-cols-3 gap-4">
            {[vehicle.imageUrl, ...images.map((i: any) => i.imageUrl)].map(
              (img: string, index: number) => (
                <div
                  key={index}
                  onClick={() => setMainImage(img)}
                  className="relative h-32 w-full overflow-hidden rounded-xl shadow-md cursor-pointer hover:scale-105 transition"
                >
                  <Image
                    src={img}
                    alt="Miniatura"
                    fill
                    className="object-cover"
                  />
                </div>
              )
            )}
          </div>

        </div>

      </div>
    </main>
  );
}