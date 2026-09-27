import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import RecentSearches from "@/components/home/RecentSearches";
import FeaturedListings from "@/components/home/FeaturedListings";
import Partners from "@/components/home/Partners";
import PropertyAdvice from "@/components/home/PropertyAdvice";
import LocationOverview from "@/components/home/LocationOverview";
import { unstable_noStore as noStore } from "next/cache";
import { searchProperties } from "@/lib/propertySearch";
import { query } from "@/lib/db";
import { resolvePageMeta } from "@/lib/seo/overrides";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// page_meta ('/') admin edits and any agent seo_page_override both layer on top of
// the root layout's seo_config-driven defaults — returning {} inherits them untouched.
export async function generateMetadata(): Promise<Metadata> {
  const resolved = await resolvePageMeta("/", { type: "static", id: "" });
  if (!resolved) return {};
  return {
    title: resolved.title,
    description: resolved.description,
    keywords: resolved.keywords,
    robots: resolved.noIndex ? { index: false, follow: true } : undefined,
  };
}

interface PartnerRow {
  id: string;
  name: string;
  logo: string | null;
  link: string;
}

interface BlogCategory {
  id: string;
  name: string;
}

interface BlogTag {
  id: string;
  name: string;
}

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  createdAt: Date | string;
  category: string | null;
  tag: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "real-estate-news": "bg-blue-100 text-blue-800",
  "neighborhood-guides": "bg-green-100 text-green-800",
  "property-guides": "bg-purple-100 text-purple-800",
  "mortgage-financing": "bg-yellow-100 text-yellow-800",
  "legal-advice": "bg-pink-100 text-pink-800",
  "home-improvements": "bg-indigo-100 text-indigo-800",
  "agent-advice": "bg-red-100 text-red-800",
  "decor-lifestyle": "bg-orange-100 text-orange-800",
};

function normalizePartnerLink(link: string): string {
  if (!link) return "#";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

function formatPartnerLogo(logo: string | null): string {
  if (!logo) {
    return "/images/placeholder.png";
  }

  if (logo.startsWith("http")) {
    return logo;
  }

  if (logo.startsWith("/api/images/serve/")) {
    return logo;
  }

  if (logo.startsWith("/api/images/partners/")) {
    const filename = logo.split("/api/images/partners/")[1];
    return `/api/images/serve/partners/${filename}`;
  }

  const filename = logo.includes("/") ? logo.split("/").pop() : logo;
  return `/api/images/serve/partners/${filename}`;
}

function formatPostImage(image: string | null): string {
  if (!image) {
    return "/images/placeholder.png";
  }

  if (image.includes("vectorafriqproperties.co.ke")) {
    const match = image.match(/\/api\/images\/(.+)$/);
    if (match) {
      return `/api/images/${match[1]}`;
    }
  }

  return image;
}

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    console.error("Failed to parse JSON array:", error);
    return [];
  }
}

async function getHomePageData() {
  noStore();

  const [featuredResult, partners, posts] = await Promise.all([
    searchProperties({ featured: true, limit: 8 }),
    query<PartnerRow>(
      `
        SELECT id, name, logo, link
        FROM partner
        ORDER BY createdAt DESC
        LIMIT 12
      `
    ),
    query<BlogPostRow>(
      `
        SELECT id, title, slug, content, excerpt, image, createdAt, category, tag
        FROM post
        WHERE published = 1
        ORDER BY createdAt DESC
        LIMIT 6
      `
    ),
  ]);

  const formattedPartners = partners.map((partner) => ({
    ...partner,
    logo: formatPartnerLogo(partner.logo),
    link: normalizePartnerLink(partner.link),
  }));

  const formattedPosts = posts.map((post) => ({
    ...post,
    image: formatPostImage(post.image),
    createdAt: new Date(post.createdAt).toISOString(),
    categories: parseJsonArray<BlogCategory>(post.category),
    tags: parseJsonArray<BlogTag>(post.tag),
  }));

  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  for (const post of formattedPosts) {
    for (const category of post.categories) {
      const existing = categoryMap.get(category.id);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(category.id, { ...category, count: 1 });
      }
    }
  }

  const categories = Array.from(categoryMap.values()).map((category) => ({
    ...category,
    color: CATEGORY_COLORS[category.id] || "bg-gray-100 text-gray-800",
  }));

  return {
    featuredProperties: featuredResult.properties,
    partners: formattedPartners,
    posts: formattedPosts,
    categories,
  };
}

export default async function Home() {
  const { featuredProperties, partners, posts, categories } =
    await getHomePageData();

  return (
    <main>
      <Hero />
      <RecentSearches />
      <FeaturedListings properties={featuredProperties} />
      <LocationOverview />
      <Partners partners={partners} />
      <PropertyAdvice posts={posts} categories={categories} />
    </main>
  );
}
