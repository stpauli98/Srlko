import Image from "next/image";
import { site } from "@/content/site.config";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full bg-orange/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-orange-dark">
            {site.hero.eyebrow}
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-charcoal md:text-6xl">
            {site.hero.title}
          </h1>
          <p className="mt-3 font-serif text-xl italic text-orange-dark">{site.subTagline}</p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-charcoal/80">{site.hero.text}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#menu"
              className="rounded-full bg-orange px-6 py-3 font-semibold text-cream transition hover:bg-orange-dark"
            >
              Pogledaj cjenovnik
            </a>
            <a
              href="#location"
              className="rounded-full border-2 border-orange px-6 py-3 font-semibold text-orange-dark transition hover:bg-orange/10"
            >
              Kako do nas
            </a>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <Image
            src={site.hero.image}
            alt={`${site.brand} ${site.tagline}`}
            fill
            priority
            className="object-contain drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
