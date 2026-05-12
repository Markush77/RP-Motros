"use client";

import Image from "next/image";
import { useState } from "react";

export default function VehicleGallery({
  mainImage,
  images,
}: any) {
  const allImages = [mainImage, ...images.map((i: any) => i.imageUrl)];
  const [selectedImage, setSelectedImage] = useState(allImages[0]);

  return (
    <div className="grid gap-8 md:grid-cols-2">

      <div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-xl">
        <Image
          src={selectedImage}
          alt="Vehículo"
          fill
          className="object-cover"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {allImages.map((img: string, index: number) => (
          <div
            key={index}
            onClick={() => setSelectedImage(img)}
            className="relative h-32 w-full overflow-hidden rounded-xl shadow-md cursor-pointer hover:scale-105 transition"
          >
            <Image
              src={img}
              alt="Miniatura"
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

    </div>
  );
}