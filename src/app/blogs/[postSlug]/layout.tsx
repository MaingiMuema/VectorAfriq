import { Metadata } from "next";
import { buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";
import { getBlogPlainText, getBlogPostByIdentifier } from "@/lib/blogData";
import { getCanonicalBlogSlug, normalizeBlogSlug } from "@/lib/blogSlug";
import { overlayPageOverride } from "@/lib/seo/metadata";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server-side metadata generation using the post slug + API fetch
export async function generateMetadata({
    params,
}: {
    params: Promise<{ postSlug: string }>;
}): Promise<Metadata> {
    const { postSlug } = await params;
    const fallbackSlug = normalizeBlogSlug(postSlug);

    try {
        const post = await getBlogPostByIdentifier(postSlug);

        if (!post) {
            return {
                title: "Blog Post | VectorAfriq Kenya",
                alternates: { canonical: `/blogs/${fallbackSlug}` },
            };
        }

        const canonicalSlug = getCanonicalBlogSlug(post);
        const title = post.title || "Blog Post";
        const description = post.excerpt || getBlogPlainText(post.content).slice(0, 160);
        const image = post.image || "/images/og-default.jpg";
        const pageUrl = `${SITE_URL}/blogs/${canonicalSlug}`;

        const baseMetadata: Metadata = {
            title: `${title} | VectorAfriq Kenya`,
            description,
            keywords: post.categories?.map((c: { name: string }) => c.name).join(", "),
            alternates: {
                canonical: pageUrl,
            },
            openGraph: {
                title,
                description,
                type: "article",
                url: pageUrl,
                siteName: "VectorAfriq Kenya",
                publishedTime: post.createdAt,
                modifiedTime: post.updatedAt,
                authors: post.author?.name ? [post.author.name] : undefined,
                images: image
                    ? [{ url: image, width: 1200, height: 630, alt: title }]
                    : undefined,
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: image ? [image] : undefined,
            },
        };

        return overlayPageOverride(`/blogs/${canonicalSlug}`, baseMetadata, { type: "blog_post", id: post.id });
    } catch {
        return {
            title: "Blog Post | VectorAfriq Kenya",
            alternates: { canonical: `/blogs/${fallbackSlug}` },
        };
    }
}

// Server-side JSON-LD injection for the blog post
// (page.tsx is "use client" so cannot export metadata or use Script directly)
export default async function BlogPostLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ postSlug: string }>;
}) {
    const { postSlug } = await params;
    let pageUrl = `${SITE_URL}/blogs/${normalizeBlogSlug(postSlug)}`;

    // Attempt to fetch post for full schema
    let blogSchema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        url: pageUrl,
        publisher: {
            "@type": "Organization",
            name: "VectorAfriq Kenya",
            url: SITE_URL,
            logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/vectorafriq-logo-removebg-preview.png`,
                width: 200,
                height: 60,
            },
        },
        inLanguage: "en-KE",
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": pageUrl,
        },
    };

    try {
        const post = await getBlogPostByIdentifier(postSlug);
        if (post) {
            pageUrl = `${SITE_URL}/blogs/${getCanonicalBlogSlug(post)}`;
            const plainText = getBlogPlainText(post.content);
            const wordCount = plainText.trim().split(/\s+/).length;

            blogSchema = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "@id": `${pageUrl}#article`,
                headline: post.title,
                description: post.excerpt || plainText.slice(0, 200),
                url: pageUrl,
                image: post.image ? [post.image] : undefined,
                author: {
                    "@type": "Person",
                    name: post.author?.name || "VectorAfriq Kenya",
                },
                publisher: {
                    "@type": "Organization",
                    name: "VectorAfriq Kenya",
                    url: SITE_URL,
                    logo: {
                        "@type": "ImageObject",
                        url: `${SITE_URL}/vectorafriq-logo-removebg-preview.png`,
                        width: 200,
                        height: 60,
                    },
                },
                datePublished: post.createdAt,
                dateModified: post.updatedAt || post.createdAt,
                mainEntityOfPage: {
                    "@type": "WebPage",
                    "@id": pageUrl,
                },
                keywords: post.categories?.map((c: { name: string }) => c.name).join(", "),
                articleSection: post.categories?.[0]?.name,
                wordCount,
                inLanguage: "en-KE",
            };
        }
    } catch {
        // Fall through to use minimal schema defined above
    }

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: "Home", url: SITE_URL },
        { name: "Blog", url: `${SITE_URL}/blogs` },
        { name: blogSchema.headline as string || "Article", url: pageUrl },
    ]);

    const graphSchema = {
        "@context": "https://schema.org",
        "@graph": [
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (({ "@context": _ctx, ...rest }) => rest)(blogSchema as Record<string, unknown>),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (({ "@context": _ctx, ...rest }) => rest)(breadcrumbSchema as unknown as Record<string, unknown>),
        ],
    };

    return (
        <>
            <script
                id="blog-post-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }}
            />
            {children}
        </>
    );
}
