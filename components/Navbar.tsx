"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/content/site.config";

const links = [
  { href: "#about", label: "Naša priča" },
  { href: "#menu", label: "Cjenovnik" },
  { href: "#gallery", label: "Galerija" },
  { href: "#location", label: "Lokacija" },
  { href: "#contact", label: "Kontakt" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-cream-dark">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <Image src={site.logo} alt={site.brand} width={40} height={40} className="rounded-full" />
          <span className="font-serif text-xl font-bold text-charcoal">{site.brand}</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-charcoal/80 transition hover:text-orange"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={site.contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition hover:bg-orange-dark"
            >
              Instagram
            </a>
          </li>
        </ul>

        <button
          aria-label="Meni"
          className="md:hidden text-charcoal"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-cream-dark bg-cream px-5 py-3 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-base font-medium text-charcoal/80 hover:text-orange"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={site.contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-1 inline-block rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream"
            >
              Instagram
            </a>
          </li>
        </ul>
      )}
    </header>
  );
}
