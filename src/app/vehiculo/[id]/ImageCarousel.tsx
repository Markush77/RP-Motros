"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  images: string[];
  name: string;
}

export default function ImageCarousel({ images, name }: Props) {
  const [current, setCurrent] = useState(0);

  if (!images.length) return null;

  return (
    <div>
      {/* IMAGEN PRINCIPAL */}
      <div className="relative h-[550px] w-full overflow-hidden rounded-3xl shadow-2xl border border-slate-700 group">
        <Image
          src={images[current]}
          alt={`${name} - foto ${current + 1}`}
          fill
          className="object-cover transition-all duration-500"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* FLECHAS */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 transition backdrop-blur"
            >
              ←
            </button>
            <button
              onClick={() =>
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 transition backdrop-blur"
            >
              →
            </button>
          </>
        )}

        {/* CONTADOR */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* MINIATURAS */}
      {images.length > 1 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative h-24 w-full overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                i === current
                  ? "border-red-500 scale-105 shadow-lg shadow-red-500/20"
                  : "border-slate-700 hover:border-slate-400"
              }`}
            >
              <Image
                src={img}
                alt={`${name} miniatura ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* DOTS */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-red-500" : "w-2 bg-slate-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}