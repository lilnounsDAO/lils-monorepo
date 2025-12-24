import type { Manifest } from "@/types/metadata";

export default function manifest(): Manifest {
  return {
    name: "Lilnouns.wtf",
    short_name: "Lil Nouns",
    description: "Lil Nouns DAO Governance Hub",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
