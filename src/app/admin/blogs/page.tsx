"use client";

import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiTrash2, FiEdit3, FiPlus } from "react-icons/fi";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { getBlogPostPath, isTitleDerivedBlogSlug } from "@/lib/blogSlug";

const BLOG_CATEGORIES = [
  { id: "real-estate-news", name: "Real Estate News" },
  { id: "neighborhood-guides", name: "Neighborhood Guides" },
  { id: "property-guides", name: "Property Guides & Advice" },
  { id: "mortgage-financing", name: "Mortgage & Financing" },
  { id: "legal-advice", name: "Legal Advice" },
  { id: "home-improvements", name: "Home Improvements" },
  { id: "agent-advice", name: "Agent Advice" },
  { id: "decor-lifestyle", name: "Decor & Lifestyle" },
  { id: "agriculture", name: "Agriculture" },
];

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  categories: {
    id: string;
    name: string;
  }[];
  tags: {
    id: string;
    name: string;
  }[];
}

export default function BlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const postsRes = await fetch(
        `/api/admin/posts?page=${page}&search=${search}${publishedFilter !== "ALL" ? `&published=${publishedFilter}` : ""
        }${categoryFilter !== "ALL" ? `&category=${categoryFilter}` : ""}`
      );

      if (!postsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const postsData = await postsRes.json();
      console.log('[Blogs Page] Fetched posts:', postsData.posts.length);

      // Fix legacy image URLs
      const fixedPosts = postsData.posts.map((p: Post) => {
        if (p.image && p.image.includes('vectorafriqproperties.co.ke')) {
          // Extract path after /api/images/
          const match = p.image.match(/\/api\/images\/(.+)$/);
          if (match) {
            p.image = `/api/images/${match[1]}`;
          }
        }
        console.log(`[Blogs Page] Post ${p.id}: image = "${p.image}"`);
        return p;
      });

      setPosts(fixedPosts);
      setTotalPages(postsData.pages);
    } catch (err) {
      setError("Error loading data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, publishedFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePostStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          published: !currentStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update post status");

      const updatedPost = await res.json();
      setPosts(posts.map((post) => (post.id === postId ? updatedPost : post)));
      toast.success(
        `Post ${!currentStatus ? "published" : "unpublished"} successfully`
      );
    } catch (err) {
      toast.error("Error updating post status");
      console.error(err);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete post");

      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully");
    } catch (err) {
      toast.error("Error deleting post");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <Link
          href="/admin/blogs/new"
          className="bg-[#468AD1] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2F6FAE]"
        >
          <FiPlus className="w-5 h-5" />
          New Post
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search posts..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {BLOG_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Posts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Posts</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
                >
                  Image
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Author
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    No posts found
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={post.image || '/images/placeholder.png'}
                          alt={post.title}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                          onError={() => {
                            console.log(`[Blogs Page] Image failed to load for post ${post.id}:`, post.image);
                          }}
                          onLoad={() => {
                            console.log(`[Blogs Page] Image loaded successfully for post ${post.id}:`, post.image);
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.excerpt || "No excerpt"}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Link
                          href={getBlogPostPath(post)}
                          target="_blank"
                          className="font-mono text-[#468AD1] hover:text-[#2F6FAE]"
                        >
                          {getBlogPostPath(post)}
                        </Link>
                        {!isTitleDerivedBlogSlug(post.title, post.slug) && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">
                            Custom slug
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {post.categories[0]?.name || "Uncategorized"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {post.author.name || "No name"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.author.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          togglePostStatus(post.id, post.published)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${post.published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blogs/${post.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit3 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
