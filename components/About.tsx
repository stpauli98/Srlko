import Image from "next/image";
import { site } from "@/content/site.config";

export function About() {
  return (
    <section id="about" className="bg-cream-dark/40">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div className="relative order-2 aspect-[4/3] w-full overflow-hidden rounded-3xl md:order-1">
          <Image src={site.about.image} alt={site.about.title} fill className="object-cover" />
        </div>

        <div className="order-1 md:order-2">
          <h2 className="text-4xl font-bold text-charcoal">{site.about.title}</h2>
          <div className="mt-5 space-y-4">
            {site.about.paragraphs.map((p, i) => (
              <p key={i} className="text-lg leading-relaxed text-charcoal/80">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
