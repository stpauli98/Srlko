import { site } from "@/content/site.config";

export function Menu() {
  const { title, intro, currencyNote, categories } = site.menu;

  return (
    <section id="menu" className="bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-charcoal">{title}</h2>
          <p className="mt-3 text-lg text-charcoal/70">{intro}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="rounded-2xl border border-cream-dark bg-cream-dark/30 p-6"
            >
              <h3 className="font-serif text-2xl font-bold text-orange-dark">{cat.title}</h3>
              {cat.note && <p className="mt-1 text-sm italic text-charcoal/60">{cat.note}</p>}
              <ul className="mt-4 divide-y divide-cream-dark">
                {cat.items.map((item) => (
                  <li key={item.name} className="flex items-baseline justify-between gap-3 py-2.5">
                    <div>
                      <span className="font-medium text-charcoal">{item.name}</span>
                      {item.description && (
                        <p className="text-sm text-charcoal/60">{item.description}</p>
                      )}
                    </div>
                    {item.price && (
                      <span className="shrink-0 font-semibold text-charcoal">
                        {item.price} <span className="text-sm font-normal text-charcoal/60">KM</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-charcoal/60">{currencyNote}</p>
      </div>
    </section>
  );
}
