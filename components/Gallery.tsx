import Image from "next/image";
import { site } from "@/content/site.config";

export function Gallery() {
  const { title, intro, images } = site.gallery;

  return (
    <section id="gallery" className="bg-cream-dark/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-charcoal">{title}</h2>
          <p className="mt-3 text-lg text-charcoal/70">{intro}</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-2xl bg-cream-dark"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
