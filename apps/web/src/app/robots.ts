import type { Robots } from "@/types/metadata";

export default function robots(): Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/api"],
    },
    sitemap: ["https://www.lilnouns.wtf/sitemap.xml"],
  };
}
