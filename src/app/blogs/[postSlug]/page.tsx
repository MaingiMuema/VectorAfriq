import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import {
  FaArrowLeft,
  FaClock,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";
import { getBlogPostByIdentifier, getBlogPlainText } from "@/lib/blogData";
import { getCanonicalBlogSlug } from "@/lib/blogSlug";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function calculateReadTime(content: string) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}) {
  const { postSlug } = await params;
  const post = await getBlogPostByIdentifier(postSlug);

  if (!post) {
    notFound();
  }

  const canonicalSlug = getCanonicalBlogSlug(post);
  if (canonicalSlug !== postSlug) {
    permanentRedirect(`/blogs/${canonicalSlug}`);
  }

  const categoryId = post.categories[0]?.id;
  const categoryColor =
    CATEGORY_COLORS[categoryId] || "bg-gray-100 text-gray-800";
  const pageUrl = `${SITE_URL}/blogs/${canonicalSlug}`;
  const shareTitle = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(pageUrl);
  const plainText = getBlogPlainText(post.content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="relative min-h-[400px] md:min-h-[500px] mt-16 overflow-hidden">
        <Image
          src={post.image || "/images/placeholder.png"}
          alt={post.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />

        <div className="relative h-full container mx-auto px-4 py-10 flex flex-col justify-end min-h-[400px] md:min-h-[500px]">
          <Link
            href="/blogs"
            className="absolute top-6 left-4 md:left-0 inline-flex items-center text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <FaArrowLeft className="mr-2" />
            Back to Blogs
          </Link>

          <div className="max-w-4xl pb-6">
            <span
              className={`inline-block px-4 py-1.5 text-sm font-semibold rounded-full ${categoryColor} mb-4 shadow-lg`}
            >
              {post.categories[0]?.name || "Uncategorized"}
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white drop-shadow-lg">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
                <span className="font-medium">
                  {post.author?.name || "Anonymous"}
                </span>
              </div>
              <span className="hidden sm:block w-1.5 h-1.5 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <FaClock />
                <span>{calculateReadTime(plainText)}</span>
              </div>
              <span className="hidden sm:block w-1.5 h-1.5 bg-white/50 rounded-full" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-10 lg:p-12">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {post.categories.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category) => (
                      <span
                        key={category.id}
                        className={`px-4 py-1.5 text-sm font-medium rounded-full ${
                          CATEGORY_COLORS[category.id] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Share this article
                </h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1877f2] text-white rounded-lg hover:bg-[#1877f2]/90 transition-colors"
                  >
                    <FaFacebook size={18} />
                    <span className="hidden sm:inline">Facebook</span>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1da1f2] text-white rounded-lg hover:bg-[#1da1f2]/90 transition-colors"
                  >
                    <FaTwitter size={18} />
                    <span className="hidden sm:inline">Twitter</span>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0a66c2] text-white rounded-lg hover:bg-[#0a66c2]/90 transition-colors"
                  >
                    <FaLinkedin size={18} />
                    <span className="hidden sm:inline">LinkedIn</span>
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${pageUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors"
                  >
                    <FaWhatsapp size={18} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/blogs"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#468AD1] to-[#ff6b6b] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#468AD1]/25 transition-all"
                >
                  <FaArrowLeft className="mr-2" />
                  Return to All Articles
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
