import Link from "next/link";
import Image from "next/image";
import {
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaSearch,
  FaTags,
} from "react-icons/fa";
import { getBlogPostPath } from "@/lib/blogSlug";
import {
  buildBlogCategoriesWithCount,
  getPublishedBlogPosts,
  type BlogPost,
} from "@/lib/blogData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BlogsSearchParams = {
  q?: string | string[];
  category?: string | string[];
  page?: string | string[];
};

interface CategoryWithCount {
  id: string;
  name: string;
  count: number;
  color: string;
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
  agriculture: "bg-emerald-100 text-emerald-800",
};

const POSTS_PER_PAGE = 9;

function getParamValue(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function parsePageParam(value?: string | string[]): number {
  const raw = getParamValue(value);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function calculateReadTime(content: string) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function buildBlogsHref({
  q,
  category,
  page,
}: {
  q?: string;
  category?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (category) {
    params.set("category", category);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/blogs?${query}` : "/blogs";
}

function getPageNumbers(currentPage: number, totalPages: number): Array<number | string> {
  const pages: Array<number | string> = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let index = 1; index <= totalPages; index += 1) {
      pages.push(index);
    }

    return pages;
  }

  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, "...", totalPages);
    return pages;
  }

  if (currentPage >= totalPages - 2) {
    pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    return pages;
  }

  pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
  return pages;
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<BlogsSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = getParamValue(resolvedSearchParams.q).trim();
  const selectedCategoryId = getParamValue(resolvedSearchParams.category).trim();
  const requestedPage = parsePageParam(resolvedSearchParams.page);

  const posts = await getPublishedBlogPosts();
  const categories: CategoryWithCount[] = buildBlogCategoriesWithCount(posts).map(
    (category) => ({
      ...category,
      color: CATEGORY_COLORS[category.id] || "bg-gray-100 text-gray-800",
    })
  );

  const filteredPosts = posts.filter((post) => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      !lowerQuery ||
      post.title.toLowerCase().includes(lowerQuery) ||
      (post.excerpt?.toLowerCase() || "").includes(lowerQuery);
    const matchesCategory =
      !selectedCategoryId ||
      post.categories.some((category) => category.id === selectedCategoryId);

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Property Advice & Insights
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Stay informed with the latest real estate trends, expert advice, and
            comprehensive guides to help you make smart property decisions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="mb-8">
              <form method="get" action="/blogs" className="relative">
                {selectedCategoryId && (
                  <input type="hidden" name="category" value={selectedCategoryId} />
                )}
                <input
                  type="text"
                  name="q"
                  placeholder="Search articles..."
                  defaultValue={searchQuery}
                  className="w-full px-5 py-4 pl-14 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] transition-all"
                />
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              </form>
            </div>

            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {paginatedPosts.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredPosts.length}
                </span>{" "}
                articles
                {selectedCategory && (
                  <span className="ml-2">
                    in{" "}
                    <span className="font-semibold text-[#468AD1]">
                      {selectedCategory.name}
                    </span>
                  </span>
                )}
              </p>
            </div>

            {paginatedPosts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">Articles</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No articles found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedPosts.map((post: BlogPost) => (
                  <article
                    key={post.id}
                    className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <Link href={getBlogPostPath(post)} className="block">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={post.image || "/images/placeholder.png"}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                              CATEGORY_COLORS[post.categories?.[0]?.id] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {post.categories?.[0]?.name || "Uncategorized"}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#468AD1] transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {post.excerpt || "No excerpt available"}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaClock className="text-[#468AD1]" />
                            <span>{calculateReadTime(post.content)}</span>
                          </div>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {currentPage > 1 ? (
                    <Link
                      href={buildBlogsHref({
                        q: searchQuery || undefined,
                        category: selectedCategoryId || undefined,
                        page: currentPage - 1,
                      })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md"
                    >
                      <FaChevronLeft className="w-3 h-3" />
                      Previous
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-400">
                      <FaChevronLeft className="w-3 h-3" />
                      Previous
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="w-10 h-10 rounded-lg font-medium text-gray-400 flex items-center justify-center"
                        >
                          ...
                        </span>
                      ) : (
                        <Link
                          key={page}
                          href={buildBlogsHref({
                            q: searchQuery || undefined,
                            category: selectedCategoryId || undefined,
                            page: page as number,
                          })}
                          className={`w-10 h-10 rounded-lg font-medium transition-all flex items-center justify-center ${
                            page === currentPage
                              ? "bg-[#468AD1] text-white shadow-lg shadow-[#468AD1]/25"
                              : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                          }`}
                        >
                          {page}
                        </Link>
                      )
                    )}
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={buildBlogsHref({
                        q: searchQuery || undefined,
                        category: selectedCategoryId || undefined,
                        page: currentPage + 1,
                      })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md"
                    >
                      Next
                      <FaChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-400">
                      Next
                      <FaChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FaTags className="mr-2 text-[#468AD1]" />
                Categories
              </h3>
              <div className="space-y-2">
                <Link
                  href={buildBlogsHref({ q: searchQuery || undefined })}
                  className={`block w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                    !selectedCategoryId
                      ? "bg-gradient-to-r from-[#468AD1] to-[#ff6b6b] text-white shadow-lg shadow-[#468AD1]/25"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  All Categories
                  <span
                    className={`float-right ${
                      !selectedCategoryId ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    ({posts.length})
                  </span>
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={buildBlogsHref({
                      q: searchQuery || undefined,
                      category: category.id,
                    })}
                    className={`block w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                      selectedCategoryId === category.id
                        ? "bg-gradient-to-r from-[#468AD1] to-[#ff6b6b] text-white shadow-lg shadow-[#468AD1]/25"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {category.name}
                    <span
                      className={`float-right ${
                        selectedCategoryId === category.id
                          ? "text-white/80"
                          : "text-gray-400"
                      }`}
                    >
                      ({category.count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Get the latest property insights and news delivered to your
                inbox.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1] text-white placeholder:text-gray-400"
                />
                <button className="w-full px-4 py-3 bg-gradient-to-r from-[#468AD1] to-[#ff6b6b] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#468AD1]/25 transition-all">
                  Subscribe Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
