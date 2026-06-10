/*
  =========================================================================
  TRI LAME — sadržaj sajta
  =========================================================================
  Sve tekstualne informacije i putanje slika su ovdje. Da promijeniš sadržaj
  (cijene, radno vrijeme, tekst, slike) — mijenjaš SAMO ovaj fajl. Komponente
  ništa ne hardkodiraju.

  Slike: stavi fajlove u /public/images i ovdje upiši putanju (npr. "/images/cookie.jpg").
  Trenutno su postavljeni brend-SVG placeholderi koje slobodno zamijeni pravim fotkama.
  =========================================================================
*/

export type MenuItem = {
  name: string;
  description?: string;
  price?: string; // u KM, npr. "3.50" (cookies nemaju fiksnu cijenu)
};

export type MenuCategory = {
  title: string;
  note?: string;
  items: MenuItem[];
};

export type GalleryImage = {
  src: string;
  alt: string;
};

export type OpeningHour = {
  day: string;
  hours: string;
};

export type SiteConfig = {
  brand: string;
  tagline: string;
  subTagline: string;
  logo: string;
  hero: {
    image: string;
    eyebrow: string;
    title: string;
    text: string;
  };
  about: {
    title: string;
    paragraphs: string[];
    image: string;
  };
  menu: {
    title: string;
    intro: string;
    currencyNote: string;
    categories: MenuCategory[];
  };
  gallery: {
    title: string;
    intro: string;
    images: GalleryImage[];
  };
  location: {
    title: string;
    address: string;
    city: string;
    hours: OpeningHour[];
    mapEmbedUrl: string;
    mapsLink: string;
  };
  contact: {
    instagram: string;
    instagramUrl: string;
    googleBusiness: string;
  };
};

export const site: SiteConfig = {
  brand: "Tri Lame",
  tagline: "coffee & cookies shop",
  subTagline: "tvoj ritual u hodu",
  logo: "/images/logo.svg",

  hero: {
    image: "/images/hero.svg",
    eyebrow: "Banjaluka · to go",
    title: "Tvoj ritual u hodu",
    text:
      "Narandžasto carstvo u kojem vladaju tri lame — okružene najukusnijim i " +
      "hrskavim kolačićima i osvježavajućom matcha latte. Svrati, ponesi, uživaj.",
  },

  about: {
    title: "Naša priča",
    image: "/images/about.svg",
    paragraphs: [
      "Tri Lame je coffee & cookies shop u srcu Banjaluke — malo mjesto u " +
        "Gospodskoj ulici koje je u kratkom periodu postalo nezaobilazna stanica za " +
        "sve ljubitelje dobre kafe i domaćih kolačića.",
      "Kod nas se sve vrti oko dva rituala: pažljivo pripremljene kafe i matcha " +
        "latte, te ručno pravljenih cookieja koji se peku svježi — od ferrero i " +
        "čokoladnih, do pistaći varijanti.",
      "Sve je zamišljeno „to go\" — da poneseš svoj trenutak uživanja sa sobom, " +
        "gdje god da ideš. Tvoj ritual u hodu.",
    ],
  },

  menu: {
    title: "Cjenovnik",
    intro: "Kafa, matcha i cookies — sve svježe, svaki dan.",
    currencyNote: "Cijene su u KM (BAM). Plaćanje isključivo u KM.",
    categories: [
      {
        title: "Tople kafe",
        items: [
          { name: "Espresso", price: "2.50" },
          { name: "Double espresso", price: "4.50" },
          { name: "Americano", price: "2.80" },
          { name: "Cortado", price: "3.50" },
          { name: "Macchiato", price: "3.00" },
          { name: "Cappuccino", price: "3.50" },
          { name: "Latte", price: "3.90" },
          { name: "Latte aroma", price: "4.20" },
        ],
      },
      {
        title: "Matcha",
        items: [
          { name: "Matcha latte", price: "5.30" },
          { name: "Matcha latte aroma", price: "5.70" },
          { name: "Ice matcha", price: "5.80" },
          { name: "Ice matcha latte aroma", price: "6.30" },
        ],
      },
      {
        title: "Hladne kafe",
        items: [
          { name: "Ice cappuccino", price: "4.00" },
          { name: "Ice latte", price: "4.40" },
          { name: "Ice latte aroma", price: "4.70" },
        ],
      },
      {
        title: "Specijalni hladni napici",
        items: [
          { name: "Vanilija cold foam", price: "5.50" },
          { name: "Čokolada cold foam", price: "5.50" },
          { name: "Višnja cold foam", price: "5.70" },
          { name: "Pistacija cold foam", price: "6.10" },
        ],
      },
      {
        title: "Dodaci",
        note: "Arome: vanila, čokolada, jagoda, karamela, lješnik · Biljno mlijeko: kokosovo, bademovo, zobeno",
        items: [
          { name: "Aroma", price: "0.50" },
          { name: "Biljno mlijeko", price: "1.00" },
        ],
      },
      {
        title: "Cookies",
        note: "Ponuda kolačića se mijenja — pitaj šta je danas svježe.",
        items: [
          { name: "Ferrero cookie", description: "kakao cookie punjen ferrero kremom i kremom od tamne čokolade" },
          { name: "Čokoladni cookie", description: "klasik za sve ljubitelje čokolade" },
          { name: "Pistaći cookie", description: "kremasti cookie sa pistaćima" },
          { name: "Bijela čokolada cookie", description: "cookie preliven bijelom čokoladom" },
        ],
      },
    ],
  },

  gallery: {
    title: "Galerija",
    intro: "Kolačići, matcha i narandžasti kutak koji ćeš zavoljeti.",
    images: [
      { src: "/images/gallery-cookies.svg", alt: "Svježe pečeni cookies" },
      { src: "/images/gallery-matcha.svg", alt: "Matcha latte u Tri Lame čaši" },
      { src: "/images/gallery-ferrero.svg", alt: "Ferrero cookie" },
      { src: "/images/gallery-interior.svg", alt: "Enterijer kafića" },
      { src: "/images/gallery-counter.svg", alt: "Vitrina sa kolačićima" },
      { src: "/images/gallery-togo.svg", alt: "Napici za ponijeti" },
    ],
  },

  location: {
    title: "Gdje smo",
    address: "Veselina Masleše 3",
    city: "Banjaluka, BiH",
    hours: [
      { day: "Ponedjeljak – Petak", hours: "07:00 – 21:00" },
      { day: "Subota", hours: "09:00 – 21:00" },
      { day: "Nedjelja", hours: "10:00 – 15:00" },
    ],
    // Google Maps embed za adresu Veselina Masleše 3, Banjaluka
    mapEmbedUrl:
      "https://www.google.com/maps?q=Veselina+Masle%C5%A1e+3,+Banja+Luka&output=embed",
    mapsLink: "https://www.google.com/maps/search/?api=1&query=Tri+Lame+coffee+cookies+Banja+Luka",
  },

  contact: {
    instagram: "@trilame.bl",
    instagramUrl: "https://www.instagram.com/trilame.bl",
    googleBusiness: "Tri Lame coffee & cookies shop (to go)",
  },
};
