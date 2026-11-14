import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Linkdot",
    short_name: "Linkdot",
    description: "Share, organize and grow — all in one place with Linkdot.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf2e6",
    theme_color: "#fbf2e6",
    icons: [
      {
        src: "/assets/linkdot-app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/linkdot-app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
