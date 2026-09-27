"use client";

import React, { useRef, useState, useEffect } from "react";
import { EditorRef } from "@/components/editor/Editor";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiEdit3, FiRefreshCw, FiSave, FiSend, FiUpload, FiX } from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { toast } from "react-hot-toast";
import Editor from "@/components/editor/Editor";
import { generateBlogSlug, isTitleDerivedBlogSlug } from "@/lib/blogSlug";

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

interface Category {
    id: string;
    name: string;
}

interface Tag {
    id: string;
    name: string;
}

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    image: string | null;
    published: boolean;
    categories: Category[];
    tags: Tag[];
}

interface BlogEditorProps {
    id: string;
}

export function BlogEditor({ id }: BlogEditorProps) {
    const router = useRouter();
    const isNew = id === "new";
    const editorRef = useRef<EditorRef>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<
        (File & { preview?: string }) | null
    >(null);
    const [hasPendingImages, setHasPendingImages] = useState(false);
    const [post, setPost] = useState<Post>({
        id: "",
        title: "",
        slug: "",
        content: "",
        excerpt: null,
        image: null,
        published: false,
        categories: [],
        tags: [],
    });
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [useCustomSlug, setUseCustomSlug] = useState(false);
    const [customSlug, setCustomSlug] = useState("");

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                const fileWithPreview = Object.assign(file, {
                    preview: URL.createObjectURL(file),
                });
                setImageFile(fileWithPreview);
            }
        },
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp"],
        },
        maxSize: 5242880, // 5MB
        multiple: false,
    });

    useEffect(() => {
        return () => {
            if (imageFile?.preview) {
                URL.revokeObjectURL(imageFile.preview);
            }
        };
    }, [imageFile]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!isNew) {
                    const postRes = await fetch(`/api/admin/posts/${id}`);
                    if (!postRes.ok) throw new Error("Failed to fetch post");

                    const postData = await postRes.json();

                    // Fix legacy image URL
                    if (postData.image && postData.image.includes('vectorafriqproperties.co.ke')) {
                        const match = postData.image.match(/\/api\/images\/(.+)$/);
                        if (match) {
                            postData.image = `/api/images/${match[1]}`;
                        }
                    }

                    setPost(postData);
                    setSelectedCategory(postData.categories[0]?.id || "");
                    const hasCustomSlug = Boolean(postData.slug) &&
                        !isTitleDerivedBlogSlug(postData.title, postData.slug);
                    setUseCustomSlug(hasCustomSlug);
                    setCustomSlug(hasCustomSlug ? postData.slug : "");
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isNew, id]);

    const resolvedSlug = generateBlogSlug(
        useCustomSlug ? customSlug || post.title || post.id || "post" : post.title || post.id || "post"
    );
    const slugPreview = resolvedSlug ? `/blogs/${resolvedSlug}` : "/blogs/{slug}";

    const syncPostFromResponse = (postData: Post) => {
        const nextPost = { ...postData };

        if (nextPost.image && nextPost.image.includes("vectorafriqproperties.co.ke")) {
            const match = nextPost.image.match(/\/api\/images\/(.+)$/);
            if (match) {
                nextPost.image = `/api/images/${match[1]}`;
            }
        }

        setPost(nextPost);
        setSelectedCategory(nextPost.categories[0]?.id || "");

        const hasCustomSlug = Boolean(nextPost.slug) &&
            !isTitleDerivedBlogSlug(nextPost.title, nextPost.slug);
        setUseCustomSlug(hasCustomSlug);
        setCustomSlug(hasCustomSlug ? nextPost.slug : "");
    };

    const handleSave = async (publish: boolean = false) => {
        if (!selectedCategory) {
            toast.error("Please select a category");
            return;
        }

        if (!post.title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        setSaving(true);
        let loadingToast;
        if (publish) {
            loadingToast = toast.loading("Publishing your post...");
        }

        try {
            // First, process any content images
            let processedContent = post.content;
            if (hasPendingImages && editorRef.current) {
                try {
                    if (publish) {
                        toast.loading("Uploading content images...", { id: loadingToast });
                    }
                    processedContent = await editorRef.current.uploadPendingImages();
                    setPost((prev) => ({ ...prev, content: processedContent }));
                } catch (error) {
                    console.error("Failed to process content images:", error);
                    toast.error("Failed to upload content images");
                    setSaving(false);
                    return;
                }
            }

            // Save post first if new to get ID
            if (isNew && imageFile) {
                if (publish) {
                    toast.loading("Uploading featured image...", { id: loadingToast });
                }

                const method = "POST";
                const url = `/api/admin/posts`;
                const selectedCategoryObj = BLOG_CATEGORIES.find(
                    (cat) => cat.id === selectedCategory
                );

                const tempPostData = {
                    ...post,
                    slug: useCustomSlug ? customSlug : "",
                    content: processedContent,
                    image: null,
                    published: false,
                    categories: selectedCategoryObj ? [selectedCategoryObj] : [],
                    tags: [],
                };

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(tempPostData),
                });

                if (!res.ok) throw new Error("Failed to create post");
                const data = await res.json();

                // Now upload image with the new post ID
                const formData = new FormData();
                formData.append("files", imageFile);
                formData.append("propertyId", `blogs/${data.id}`);

                const uploadRes = await fetch("/api/crm/upload", {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });

                if (!uploadRes.ok) {
                    const error = await uploadRes.json();
                    throw new Error(error.error || "Failed to upload image");
                }

                const result = await uploadRes.json();
                if (!result.success || !result.urls?.[0]) {
                    throw new Error("Failed to get upload URL");
                }

                // Update post with image
                const updateRes = await fetch(`/api/admin/posts/${data.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ image: result.urls[0], published: publish }),
                });

                if (!updateRes.ok) throw new Error("Failed to update post with image");

                if (publish) {
                    toast.dismiss(loadingToast);
                }
                toast.success(publish ? "Post published successfully" : "Draft saved successfully");
                router.push(`/admin/blogs/${data.id}`);
                return;
            }

            // Upload featured image if exists (for existing posts)
            let imageUrl = post.image;
            if (imageFile && !isNew) {
                try {
                    if (publish) {
                        toast.loading("Uploading featured image...", { id: loadingToast });
                    }

                    const formData = new FormData();
                    formData.append("files", imageFile);
                    formData.append("propertyId", `blogs/${id}`);

                    const uploadRes = await fetch("/api/crm/upload", {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    });

                    if (!uploadRes.ok) {
                        const error = await uploadRes.json();
                        throw new Error(error.error || "Failed to upload image");
                    }

                    const result = await uploadRes.json();
                    if (!result.success || !result.urls?.[0]) {
                        throw new Error("Failed to get upload URL");
                    }

                    imageUrl = result.urls[0];
                } catch (error) {
                    console.error("Error uploading featured image:", error);
                    toast.error(
                        error instanceof Error ? error.message : "Failed to upload image"
                    );
                    setSaving(false);
                    return;
                }
            }

            const method = isNew ? "POST" : "PATCH";
            const url = `/api/admin/posts${isNew ? "" : `/${id}`}`;

            const selectedCategoryObj = BLOG_CATEGORIES.find(
                (cat) => cat.id === selectedCategory
            );

            // Ensure image URL is relative path only
            let finalImageUrl = imageUrl;
            if (finalImageUrl && finalImageUrl.includes('://')) {
                const match = finalImageUrl.match(/\/api\/images\/(.+)$/);
                if (match) {
                    finalImageUrl = `/api/images/${match[1]}`;
                }
            }

            const postData = {
                ...post,
                slug: useCustomSlug ? customSlug : "",
                content: processedContent,
                image: finalImageUrl,
                published: publish,
                categories: selectedCategoryObj ? [selectedCategoryObj] : [],
                tags: [],
            };

            if (publish) {
                toast.loading("Finalizing publication...", { id: loadingToast });
            }
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(postData),
            });

            if (!res.ok) throw new Error("Failed to save post");
            const data = await res.json();

            if (publish) {
                toast.dismiss(loadingToast);
                toast.success("Post published successfully");
            } else {
                toast.success("Draft saved successfully");
            }
            if (isNew) {
                router.push(`/admin/blogs/${data.id}`);
                router.refresh();
            } else {
                syncPostFromResponse(data);
            }
        } catch (error) {
            console.error("Error saving post:", error);
            if (publish) {
                toast.dismiss(loadingToast);
            }
            toast.error("Error saving post");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isNew ? "Create New Post" : "Edit Post"}
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        <FiSave className="w-5 h-5" />
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
                    >
                        <FiSend className="w-5 h-5" />
                        Publish
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <input
                        type="text"
                        placeholder="Post Title"
                        className="w-full px-4 py-2 text-xl border rounded-lg"
                        value={post.title}
                        onChange={(e) => setPost({ ...post, title: e.target.value })}
                    />

                    <div className="prose max-w-none">
                        <Editor
                            ref={editorRef}
                            value={post.content}
                            onChange={(content: string) => setPost({ ...post, content })}
                            className="h-96"
                            contextId={isNew ? undefined : `blogs/${id}`}
                            onPendingImagesChange={(count) => setHasPendingImages(count > 0)}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Post Settings</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Excerpt
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={post.excerpt || ""}
                                    onChange={(e) =>
                                        setPost({ ...post, excerpt: e.target.value })
                                    }
                                    placeholder="Brief description of the post"
                                />
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between gap-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Slug
                                    </label>
                                    {useCustomSlug ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUseCustomSlug(false);
                                                setCustomSlug("");
                                            }}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-[#468AD1] hover:text-[#2F6FAE]"
                                        >
                                            <FiRefreshCw className="h-3.5 w-3.5" />
                                            Use Title Slug
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUseCustomSlug(true);
                                                setCustomSlug(post.slug || generateBlogSlug(post.title || "post"));
                                            }}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-[#468AD1] hover:text-[#2F6FAE]"
                                        >
                                            <FiEdit3 className="h-3.5 w-3.5" />
                                            Add Custom Slug
                                        </button>
                                    )}
                                </div>

                                {useCustomSlug ? (
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                        value={customSlug}
                                        onChange={(e) => setCustomSlug(e.target.value)}
                                        placeholder="Enter a custom slug"
                                    />
                                ) : (
                                    <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                        This slug will be generated from the post title when you save.
                                    </div>
                                )}

                                <div className="mt-2 rounded-lg border bg-gray-50 px-3 py-2">
                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Preview
                                    </div>
                                    <div className="mt-1 break-all font-mono text-sm text-gray-900">
                                        {slugPreview}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Special characters are removed automatically. Leave custom slug blank to fall back to the title.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Featured Image
                                </label>
                                <div
                                    {...getRootProps()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#468AD1] transition-colors cursor-pointer"
                                >
                                    <input {...getInputProps()} />
                                    {imageFile?.preview || post.image ? (
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={imageFile?.preview || post.image || ""}
                                                alt="Featured image"
                                                className="object-cover rounded-lg"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                priority
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (imageFile?.preview) {
                                                        URL.revokeObjectURL(imageFile.preview);
                                                    }
                                                    setImageFile(null);
                                                    setPost({ ...post, image: null });
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Drag & drop an image here, or click to select
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Maximum file size: 5MB. Supported formats: JPEG, PNG,
                                                WebP
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOG_CATEGORIES.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
