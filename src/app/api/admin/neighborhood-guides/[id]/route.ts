import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNeighborhoodGuideById,
  updateNeighborhoodGuide,
  deleteNeighborhoodGuide,
  generateUniqueGuideSlug,
} from "@/lib/neighborhoodGuideData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const guide = await getNeighborhoodGuideById(id);

    if (!guide) {
      return new NextResponse("Guide not found", { status: 404 });
    }

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Error fetching neighborhood guide:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();    const {
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
      published,
      sortOrder,
    } = body;

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
    if (neighborhoodId !== undefined) updateData.neighborhoodId = neighborhoodId;
    if (categories !== undefined) updateData.categories = categories;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms;
    if (published !== undefined) updateData.published = published;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    if (title || customSlug !== undefined) {
      let slugSource = customSlug?.trim() || title;
      if (!slugSource && customSlug !== undefined) {
        const existing = await getNeighborhoodGuideById(id);
        slugSource = existing?.title;
      }
      if (slugSource) {
        updateData.slug = await generateUniqueGuideSlug(slugSource, id);
      }
    }

    const guide = await updateNeighborhoodGuide(id, updateData);
    return NextResponse.json(guide);
  } catch (error) {
    console.error("Error updating neighborhood guide:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteNeighborhoodGuide(id);
    return new NextResponse("Guide deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting neighborhood guide:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
