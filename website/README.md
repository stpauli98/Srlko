# Tri Lame — web stranica

Landing stranica za **Tri Lame coffee & cookies shop (to go)**, Banjaluka.
Napravljena u **Next.js 15 + TypeScript + Tailwind CSS v4**.

## Pokretanje lokalno

```bash
cd website
npm install
npm run dev      # http://localhost:3000
```

Produkcijski build:

```bash
npm run build
npm start
```

## Gdje se mijenja sadržaj

Sav tekst, cijene, radno vrijeme i kontakt su na jednom mjestu:

- **`content/site.config.ts`** — naziv, slogan, „o nama" tekst, cijeli cjenovnik,
  galerija, adresa, radno vrijeme, Instagram link, Google Maps.

Ne diraš komponente — samo ovaj fajl.

## Slike

U `public/images/` su trenutno **brend-SVG placeholderi** (logo, hero, galerija) u
narandžasto/krem stilu sa Instagrama. Da ubaciš prave fotke:

1. Stavi fotku u `public/images/` (npr. `gallery-cookies.jpg`).
2. U `content/site.config.ts` promijeni putanju (npr. `src: "/images/gallery-cookies.jpg"`).

Preporučene fotke za zamjenu: `logo`, `hero`, `about`, te `gallery-*`.
Za logo je najbolje staviti zvaničnu PNG/SVG verziju (čista, bez pozadine).

## Boje brenda

Definisane na jednom mjestu u `app/globals.css` (`@theme`):

| Token            | Boja      | Upotreba                       |
| ---------------- | --------- | ------------------------------ |
| `--color-orange` | `#ea5b24` | primarna (logo, dugmad, akcenti) |
| `--color-cream`  | `#f6efe3` | pozadina                        |
| `--color-olive`  | `#6f6c39` | tabla menija / akcent           |
| `--color-charcoal` | `#1d1a17` | tekst, footer                 |

## Deploy (Vercel)

Novi Vercel projekat sa **Root Directory = `website`**. Framework: Next.js
(automatski). Bez dodatnih env varijabli.
