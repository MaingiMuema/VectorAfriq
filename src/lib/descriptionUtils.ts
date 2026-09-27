/**
 * Check if a description string contains HTML tags.
 * This helps distinguish between old plain-text descriptions
 * and new rich-text descriptions created with the WYSIWYG editor.
 */
export function isHtmlDescription(description: string): boolean {
  if (!description) return false;
  const htmlTagRegex = /<\/?(?:p|div|span|h[1-6]|ul|ol|li|b|i|u|strong|em|a|img|blockquote|pre|code|br|hr|table|thead|tbody|tr|td|th|sup|sub|mark|s|span|section|article|header|footer|nav|figure|figcaption|details|summary)[^>]*>/i;
  return htmlTagRegex.test(description);
}

/**
 * Strip HTML tags from a string to get plain text.
 * Useful for meta descriptions, search result previews, and SEO.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate a description to a max length, handling both plain text and HTML.
 * For HTML descriptions, strips tags first before truncating.
 */
export function truncateDescription(description: string, maxLength: number): string {
  if (!description) return '';
  const plainText = isHtmlDescription(description) ? stripHtml(description) : description;
  if (plainText.length <= maxLength) return plainText;
  return `${plainText.substring(0, maxLength).trim()}...`;
}

/**
 * Check if a description has meaningful content.
 * The Tiptap editor outputs empty HTML like <p></p> or <p><br></p> when empty,
 * so we need to strip tags before checking.
 */
export function hasDescriptionContent(description: string): boolean {
  if (!description) return false;
  const plainText = isHtmlDescription(description) ? stripHtml(description) : description;
  return plainText.trim().length > 0;
}
