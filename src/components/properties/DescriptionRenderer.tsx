"use client";

import { useState, useEffect } from "react";
import { isHtmlDescription } from "@/lib/descriptionUtils";

interface DescriptionRendererProps {
  description: string;
  className?: string;
}

const PURIFY_OPTIONS = {
  ALLOWED_TAGS: [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "b", "i", "u", "strong", "em",
    "a", "img", "blockquote", "pre", "code", "hr", "sup", "sub",
    "mark", "s", "table", "thead", "tbody", "tr", "td", "th",
    "span", "div", "figure", "figcaption",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "class", "id",
    "src", "alt", "width", "height",
    "colspan", "rowspan", "scope", "align", "valign",
  ],
  ADD_ATTR: ["style"],
  ALLOW_DATA_ATTR: false,
};

const RICH_CLASSES =
  "prose prose-gray max-w-none text-gray-700 leading-relaxed [&_p]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4 [&_a]:text-blue-600 [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full [&_strong]:font-bold [&_em]:italic [&_mark]:bg-yellow-100 [&_mark]:px-1 [&_mark]:rounded [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-4 [&_code]:bg-gray-100 [&_code]:text-red-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_hr]:border-gray-200 [&_hr]:my-6 [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_td]:border [&_td]:border-gray-200 [&_td]:p-3 [&_th]:border [&_th]:border-gray-200 [&_th]:p-3 [&_th]:bg-gray-50 [&_th]:font-semibold";

/**
 * Renders a property description that may be either rich HTML (from the WYSIWYG editor)
 * or plain text (from older listings). HTML is sanitized with DOMPurify on the client side.
 */
export default function DescriptionRenderer({
  description,
  className = "",
}: DescriptionRendererProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null);

  const isHtml = isHtmlDescription(description);

  useEffect(() => {
    if (!isHtml || !description) return;

    // Dynamically import DOMPurify to avoid SSR issues (it needs window/document)
    import("dompurify").then(({ default: DOMPurify }) => {
      setSanitizedHtml(DOMPurify.sanitize(description, PURIFY_OPTIONS));
    });
  }, [description, isHtml]);

  if (!description) return null;

  if (isHtml) {
    // During SSR/hydration, show raw HTML; once client-side, show sanitized version
    const htmlToShow = sanitizedHtml ?? description;

    return (
      <div
        className={`${RICH_CLASSES} ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlToShow }}
      />
    );
  }

  // Plain text fallback — preserve whitespace and line breaks
  return (
    <p className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${className}`}>
      {description}
    </p>
  );
}
