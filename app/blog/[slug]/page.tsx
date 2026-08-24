import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findFirst({ where: { slug: params.slug, status: "PUBLISHED" }, include: { location: { select: { name: true, city: true, state: true } } } });
  if (!post) notFound();
  return <article className="mx-auto max-w-3xl px-6 py-16 prose dark:prose-invert"><p className="text-sm text-zinc-500">{post.location.name} · {post.location.city}, {post.location.state}</p><h1>{post.title}</h1><p className="lead">{post.excerpt}</p><div className="whitespace-pre-wrap">{post.content}</div></article>;
}
