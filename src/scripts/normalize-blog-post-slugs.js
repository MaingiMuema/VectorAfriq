require("dotenv").config();
const mysql = require("mysql2/promise");
const slugify = require("slugify");

const PERCENT_ENCODED_SEGMENT_RE = /%(?:[0-9A-Fa-f]{2})+/g;
const MAX_DECODE_PASSES = 3;

function safelyDecodeSlug(value) {
  let decodedValue = value;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    const nextValue = decodedValue.replace(
      PERCENT_ENCODED_SEGMENT_RE,
      (segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      }
    );

    if (nextValue === decodedValue) {
      break;
    }

    decodedValue = nextValue;
  }

  return decodedValue;
}

function normalizeBlogSlugSource(value) {
  return safelyDecodeSlug(value)
    .trim()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/&/g, " and ")
    .replace(/[/"\u201C\u201D()[\]{}:;,!?]+/g, " ")
    .replace(/\s+/g, " ");
}

function generateBlogSlug(value) {
  const slug = slugify(normalizeBlogSlugSource(value), {
    lower: true,
    strict: true,
    trim: true,
  })
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "post";
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "propertyfinder",
  });

  try {
    const [posts] = await connection.execute(
      "SELECT id, title, slug FROM post ORDER BY createdAt ASC, id ASC"
    );
    const reservedSlugs = new Set();
    const updates = [];

    for (const post of posts) {
      const source = post.title || post.slug || post.id;
      const baseSlug = generateBlogSlug(source);
      let nextSlug = baseSlug;
      let suffix = 2;

      while (reservedSlugs.has(nextSlug)) {
        nextSlug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      reservedSlugs.add(nextSlug);

      if (post.slug !== nextSlug) {
        updates.push({
          id: post.id,
          oldSlug: post.slug,
          newSlug: nextSlug,
        });
      }
    }

    if (updates.length === 0) {
      console.log("No blog slugs need normalization.");
      return;
    }

    await connection.beginTransaction();

    for (const update of updates) {
      await connection.execute(
        "UPDATE post SET slug = ?, updatedAt = NOW() WHERE id = ?",
        [update.newSlug, update.id]
      );
    }

    await connection.commit();

    console.log(`Normalized ${updates.length} blog post slug(s).`);
    for (const update of updates) {
      console.log(`${update.id}: ${update.oldSlug} -> ${update.newSlug}`);
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Failed to normalize blog post slugs:", error);
  process.exit(1);
});
