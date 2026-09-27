import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaClock, FaUser } from "react-icons/fa";
import { getBlogPostPath } from "@/lib/blogSlug";

interface Category {
  id: string;
  name: string;
}

interface CategoryWithCount extends Category {
  count: number;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  excerpt: string | null;
  createdAt: string;
  categories: Category[];
  tags: Tag[];
}

interface PropertyAdviceProps {
  posts: BlogPost[];
  categories: CategoryWithCount[];
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

export default function PropertyAdvice({
  posts,
  categories,
}: PropertyAdviceProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#514f63] mb-4">
            Property Advice & Insights
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay informed with the latest real estate trends, expert advice, and
            comprehensive guides to make better property decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-8">
            {posts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={getBlogPostPath(post)}
                className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <article className="md:flex">
                  <div className="md:w-1/3 relative flex-shrink-0 h-[300px]">
                    <Image
                      src={post.image || "/images/placeholder.png"}
                      alt={post.title || "Blog post"}
                      fill
                      priority
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                    />
                  </div>
                  <div className="p-6 md:w-2/3">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${
                        CATEGORY_COLORS[post.categories?.[0]?.id] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {post.categories?.[0]?.name || "Uncategorized"}
                    </span>
                    <h3 className="text-xl font-bold text-[#514f63] mb-3 line-clamp-2 group-hover:text-[#468AD1] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <FaUser className="mr-2" />
                          Admin
                        </div>
                        <div className="flex items-center">
                          <FaClock className="mr-2" />
                          {calculateReadTime(post.content)}
                        </div>
                      </div>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}

            <Link
              href="/blogs"
              className="inline-flex items-center text-[#468AD1] hover:text-[#514f63] font-medium transition-colors"
            >
              View all articles
              <FaArrowRight className="ml-2" />
            </Link>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#514f63] mb-6">
                Popular Categories
              </h3>
              <div className="space-y-4">
                <Link
                  href="/blogs"
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-[#468AD1] text-white transition-colors"
                >
                  <span>All Categories</span>
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href="/blogs"
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-3 ${
                          category.color.split(" ")[0] || "bg-gray-100"
                        }`}
                      />
                      <span className="text-current">{category.name}</span>
                    </div>
                    <span className={`${category.color} text-sm px-2 py-1 rounded-full`}>
                      {category.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
