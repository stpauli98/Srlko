import { site } from "@/content/site.config";

export function Location() {
  const { title, address, city, hours, mapEmbedUrl, mapsLink } = site.location;

  return (
    <section id="location" className="bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <h2 className="text-center text-4xl font-bold text-charcoal">{title}</h2>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-cream-dark">
            <iframe
              src={mapEmbedUrl}
              title={`${site.brand} — lokacija`}
              className="h-72 w-full md:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-orange">📍</span>
              <div>
                <p className="text-xl font-semibold text-charcoal">{address}</p>
                <p className="text-charcoal/70">{city}</p>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-orange-dark hover:underline"
                >
                  Otvori u Google Maps →
                </a>
              </div>
            </div>

            <h3 className="mt-8 font-serif text-2xl font-bold text-orange-dark">Radno vrijeme</h3>
            <ul className="mt-3 space-y-2">
              {hours.map((h) => (
                <li
                  key={h.day}
                  className="flex justify-between border-b border-cream-dark pb-2 text-charcoal"
                >
                  <span>{h.day}</span>
                  <span className="font-medium">{h.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
