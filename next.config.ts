import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholderi su lokalni SVG-ovi; ovo dozvoljava da prođu kroz next/image.
    // Kad ubaciš prave JPG/PNG fotke, ovo ostaje bezopasno.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
