"use client";

import React, { use } from "react";
import { BlogEditor } from "@/components/blogs/BlogEditor";

export default function BlogEditorPage({
  params,
}: {
  params: Promise<{ blogId: string }>;
}) {
  // Explicitly type the resolved params
  const resolvedParams = use(params) as { blogId: string };
  return <BlogEditor id={resolvedParams.blogId} />;
}
