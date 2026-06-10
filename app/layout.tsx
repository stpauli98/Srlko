import type { Metadata } from "next";
import { site } from "@/content/site.config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.brand} — ${site.tagline} | Banjaluka`,
  description:
    "Tri Lame coffee & cookies shop u Banjaluci (Veselina Masleše 3). Svježe pečeni cookies, kafa i matcha latte. Tvoj ritual u hodu.",
  keywords: [
    "Tri Lame",
    "coffee shop Banjaluka",
    "cookies Banjaluka",
    "matcha latte",
    "kafić Banja Luka",
    "trilame.bl",
  ],
  openGraph: {
    title: `${site.brand} — ${site.tagline}`,
    description: "Svježe pečeni cookies, kafa i matcha latte u Banjaluci. Tvoj ritual u hodu.",
    type: "website",
    locale: "sr_BA",
  },
  icons: {
    icon: "/images/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
