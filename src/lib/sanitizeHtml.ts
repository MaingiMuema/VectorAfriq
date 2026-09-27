/**
 * Sanitize HTML content to prevent XSS attacks.
 * This is a lightweight sanitizer that strips dangerous tags and attributes.
 * For production, consider using DOMPurify for more comprehensive protection.
 */

const DANGEROUS_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "textarea",
  "button",
  "select",
  "link",
  "meta",
  "base",
  "applet",
];

const DANGEROUS_ATTRS = [
  "onerror",
  "onload",
  "onclick",
  "onmouseover",
  "onfocus",
  "onblur",
  "onsubmit",
  "onchange",
  "onkeydown",
  "onkeyup",
  "onkeypress",
  "onmousedown",
  "onmouseup",
  "onmousemove",
  "onmouseout",
  "oncontextmenu",
  "ondblclick",
  "onwheel",
  "onresize",
  "onscroll",
  "onabort",
  "onbeforeinput",
  "oninput",
  "oninvalid",
  "onreset",
  "onsearch",
  "onselect",
  "onsubmit",
  "onchange",
  "onhashchange",
  "onpopstate",
  "onstorage",
  "onanimationend",
  "onanimationiteration",
  "onanimationstart",
  "ontransitionend",
  "onpointerdown",
  "onpointermove",
  "onpointerup",
  "onpointercancel",
  "onpointerover",
  "onpointerout",
  "onpointerenter",
  "onpointerleave",
  "ongotpointercapture",
  "onlostpointercapture",
  "oncut",
  "oncopy",
  "onpaste",
  "onbeforecopy",
  "onbeforecut",
  "onbeforepaste",
  "onauxclick",
];

/**
 * Sanitize HTML content by removing dangerous tags and attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let sanitized = html;

  // Remove dangerous tags and their content
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, "gis");
    sanitized = sanitized.replace(regex, "");
    // Also handle self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, "gis");
    sanitized = sanitized.replace(selfClosingRegex, "");
  }

  // Remove dangerous attributes from all tags
  for (const attr of DANGEROUS_ATTRS) {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, "gi");
    sanitized = sanitized.replace(regex, "");
    // Also handle without quotes
    const regexNoQuotes = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]+`, "gi");
    sanitized = sanitized.replace(regexNoQuotes, "");
  }

  // Remove javascript: URLs
  sanitized = sanitized.replace(
    /href\s*=\s*["']javascript:[^"']*["']/gi,
    'href="#"'
  );
  sanitized = sanitized.replace(
    /src\s*=\s*["']javascript:[^"']*["']/gi,
    'src=""'
  );

  // Remove data: URLs except for images
  sanitized = sanitized.replace(
    /src\s*=\s*["']data:(?!image)[^"']*["']/gi,
    'src=""'
  );

  return sanitized;
}

/**
 * Client-side sanitization using DOMParser for more comprehensive protection.
 * This runs in the browser and can handle more complex cases.
 */
export function sanitizeHtmlClient(html: string): string {
  if (typeof window === "undefined") {
    return sanitizeHtml(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove script tags
  doc.querySelectorAll("script").forEach((el) => el.remove());

  // Remove iframe tags
  doc.querySelectorAll("iframe").forEach((el) => el.remove());

  // Remove event handlers
  const allElements = doc.querySelectorAll("*");
  allElements.forEach((el) => {
    const attributes = el.attributes;
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attr = attributes[i];
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    }

    // Remove javascript: URLs
    if (el.hasAttribute("href")) {
      const href = el.getAttribute("href");
      if (href?.startsWith("javascript:")) {
        el.setAttribute("href", "#");
      }
    }

    if (el.hasAttribute("src")) {
      const src = el.getAttribute("src");
      if (src?.startsWith("javascript:")) {
        el.removeAttribute("src");
      }
    }
  });

  return doc.body.innerHTML;
}
