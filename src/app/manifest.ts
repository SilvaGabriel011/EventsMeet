import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EventsMeet — Perth Events",
    short_name: "EventsMeet",
    description:
      "Tinder-style discovery for events in Perth, WA. Swipe right to save, powered by AI web search.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0714",
    theme_color: "#0b0714",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
