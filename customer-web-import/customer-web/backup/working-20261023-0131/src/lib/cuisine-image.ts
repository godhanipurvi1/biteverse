import { cuisineFiles } from "./cuisine-files";

const MAX_USES = 2;
const fallback: Record<string, string> = { "fast-food": "burgers", curry: "north-indian" };
let images: Record<string, string> = {};

export function cuisineSlug(category: string) {
  return category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function setCuisineImages(items: { _id?: unknown; categories?: string[] }[]) {
  const used: Record<string, number> = {};
  const out: Record<string, string> = {};
  for (const item of items) {
    const first = item.categories?.[0];
    if (!first) continue;
    let slug = cuisineSlug(first);
    if (!cuisineFiles[slug]) slug = fallback[slug] ?? slug;
    let best: string | null = null;
    let bestCount = Infinity;
    for (const file of cuisineFiles[slug] ?? []) {
      const count = used[slug + "/" + file] ?? 0;
      if (count < MAX_USES && count < bestCount) { best = file; bestCount = count; }
    }
    if (!best) continue;
    used[slug + "/" + best] = bestCount + 1;
    out[String(item._id)] = `/images/cuisines/${slug}/${best}`;
  }
  images = out;
}

export function getCuisineImage(r: { _id?: unknown }) {
  return images[String(r._id)];
}
