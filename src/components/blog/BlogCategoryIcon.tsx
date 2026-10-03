import { useState } from "react";
import { blogCategory } from "@/game/blog";

/** v5.8 : icône d'une catégorie du devblog (public/assets/blog/<id>.webp),
 *  l'emoji prend le relais tant que l'image n'existe pas. */
export function BlogCategoryIcon({ category, className = "-my-1 h-6 w-6" }: { category: string; className?: string }) {
  const c = blogCategory(category);
  const [broken, setBroken] = useState(false);
  if (broken) return <span aria-hidden>{c.emoji}</span>;
  return <img src={`/assets/blog/${c.id}.webp`} alt="" aria-hidden className={`inline-block shrink-0 object-contain align-[-0.2em] ${className}`} onError={() => setBroken(true)} />;
}
