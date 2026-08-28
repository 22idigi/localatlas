import type { MetadataRoute } from "next";
import { articles } from "@/lib/marketing-content";
import { industries } from "@/lib/industries";
const base = "https://11i.co";
export default function sitemap(): MetadataRoute.Sitemap { const pages = ["", "/solutions", "/services", "/pricing", "/contact", "/blog", "/industries"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.8 })); return [...pages, ...industries.map((industry) => ({ url: `${base}/industries/${industry.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })), ...articles.map((article) => ({ url: `${base}/blog/${article.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 }))]; }
