import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Configure this path in Vercel Cron (monthly) or call it from an authenticated scheduler. */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const locations = await prisma.location.findMany({ select: { id: true, name: true, city: true, state: true, primaryCategory: true } });
  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const created: string[] = [];
  for (const location of locations) {
    const result = await ai.chat.completions.create({ model: process.env.OPENAI_BLOG_MODEL ?? "gpt-4o-mini", response_format: { type: "json_object" }, messages: [
      { role: "system", content: "Create an original, useful local SEO blog draft. Return JSON with title, excerpt, content (Markdown), and keywords (string array). Avoid false local claims, keyword stuffing, and competitor references." },
      { role: "user", content: `Business: ${location.name}; service/category: ${location.primaryCategory ?? "local business"}; location: ${location.city}, ${location.state}. Write a timely hyper-local article.` },
    ] });
    const raw = result.choices[0]?.message.content;
    if (!raw) continue;
    const post = JSON.parse(raw) as { title: string; excerpt?: string; content: string; keywords?: string[] };
    if (!post.title || !post.content) continue;
    const stamp = new Date().toISOString().slice(0, 7);
    const slug = `${slugify(post.title)}-${location.id.slice(-6)}-${stamp}`;
    await prisma.post.upsert({ where: { slug }, create: { locationId: location.id, slug, title: post.title, excerpt: post.excerpt, content: post.content, keywords: post.keywords ?? [], status: "DRAFT" }, update: { title: post.title, excerpt: post.excerpt, content: post.content, keywords: post.keywords ?? [] } });
    created.push(slug);
  }
  return NextResponse.json({ generated: created.length, slugs: created });
}
