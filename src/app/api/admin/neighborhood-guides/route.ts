import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNeighborhoodGuides,
  createNeighborhoodGuide,
  generateUniqueGuideSlug,
} from "@/lib/neighborhoodGuideData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const published = searchParams.get("published");

  // Allow public access only for published guides
  if (published !== "true") {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  try {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const locationType = searchParams.get("locationType") || "";

    let publishedFilter: boolean | undefined;
    if (published === "true") {
      publishedFilter = true;
    } else if (published === "false") {
      publishedFilter = false;
    }

    const result = await getNeighborhoodGuides({
      page,
      limit,
      search,
      published: publishedFilter,
      locationType: locationType || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching neighborhood guides:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      image,
      metaTitle,
      metaDescription,
      locationType,
      countyId,
      cityId,
      neighborhoodId,
      categories,
      bedrooms,
      listingTypes,
      published,
      sortOrder,
    } = body;

    if (!title || !content || !locationType || !countyId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (
      locationType === "city" && !cityId
    ) {
      return new NextResponse(
        "City is required for city-level guides",
        { status: 400 }
      );
    }

    if (
      locationType === "neighborhood" &&
      (!cityId || !neighborhoodId)
    ) {
      return new NextResponse(
        "City and neighborhood are required for neighborhood-level guides",
        { status: 400 }
      );
    }

    const slug = await generateUniqueGuideSlug(
      customSlug?.trim() || title
    );

    const guide = await createNeighborhoodGuide({
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      image: image || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      locationType,
      countyId,
      cityId: cityId || undefined,
      neighborhoodId: neighborhoodId || undefined,
      categories: categories || [],
      bedrooms: bedrooms || undefined,
      listingTypes: listingTypes || undefined,
      published: published || false,
      sortOrder: sortOrder || 0,
      authorId: session.user.id,
    });

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Error creating neighborhood guide:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      title,
      slug: customSlug,
      excerpt,
      content,
      image,
      metaTitle,
      metaDescription,
      locationType,
      countyId,
      cityId,
      neighborhoodId,
      categories,
      bedrooms,
      listingTypes,
      published,
      sortOrder,
    } = body;

    if (!id) {
      return new NextResponse("Missing guide ID", { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (image !== undefined) updateData.image = image;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      updateData.metaDescription = metaDescription;
    if (locationType !== undefined) updateData.locationType = locationType;
    if (countyId !== undefined) updateData.countyId = countyId;
    if (cityId !== undefined) updateData.cityId = cityId;
    if (neighborhoodId !== undefined)
      updateData.neighborhoodId = neighborhoodId;
    if (categories !== undefined) updateData.categories = categories;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms;
    if (listingTypes !== undefined) updateData.listingTypes = listingTypes;
    if (published !== undefined) updateData.published = published;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    if (title || customSlug !== undefined) {
      let slugSource = customSlug?.trim() || title;
      if (!slugSource && customSlug !== undefined) {
        const existing = await import(
          "@/lib/neighborhoodGuideData"
        ).then((m) => m.getNeighborhoodGuideById(id));
        slugSource = existing?.title;
      }
      if (slugSource) {
        updateData.slug = await generateUniqueGuideSlug(
          slugSource,
          id
        );
      }
    }

    const { updateNeighborhoodGuide } = await import(
      "@/lib/neighborhoodGuideData"
    );
    const guide = await updateNeighborhoodGuide(id, updateData);

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Error updating neighborhood guide:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing guide ID", { status: 400 });
    }

    const { deleteNeighborhoodGuide } = await import(
      "@/lib/neighborhoodGuideData"
    );
    await deleteNeighborhoodGuide(id);

    return new NextResponse("Guide deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting neighborhood guide:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
