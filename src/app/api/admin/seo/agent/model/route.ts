import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveModel, setActiveModel, getModelSnapshot } from "@/lib/seo/config";
import { getOpenRouterModels } from "@/lib/seo/models";

/**
 * GET /api/admin/seo/agent/model
 * Returns the current active model and the full list of OpenRouter models.
 * Pass ?refresh=1 to bypass the catalog cache.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    const catalog = await getOpenRouterModels({ refresh });

    const activeModelId = getActiveModel();
    const activeModel =
      getModelSnapshot(activeModelId) ||
      catalog.find((m) => m.id === activeModelId) ||
      null;

    return NextResponse.json({
      success: true,
      activeModelId,
      activeModel,
      availableModels: catalog,
    });
  } catch (error) {
    console.error("Error fetching SEO agent model:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch model config" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/seo/agent/model
 * Sets the active model. Body: { modelId: string }
 * The model must exist in the OpenRouter catalog; its metadata is snapshotted
 * alongside the selection for cost tracking.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { modelId } = body;

    if (!modelId || typeof modelId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid modelId" },
        { status: 400 }
      );
    }

    const catalog = await getOpenRouterModels();
    const model = catalog.find((m) => m.id === modelId);

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: `Model "${modelId}" was not found in the OpenRouter catalog. Refresh the model list and try again.`,
        },
        { status: 400 }
      );
    }

    const result = setActiveModel(modelId, model);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      activeModelId: modelId,
      activeModel: model,
    });
  } catch (error) {
    console.error("Error setting SEO agent model:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update model config" },
      { status: 500 }
    );
  }
}
