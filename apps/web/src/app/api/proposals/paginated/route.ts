import { getProposalOverviewsPaginated } from "@/data/goldsky/governance/getProposalOverviews";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "100", 10);

    // Validate parameters
    if (page < 0 || pageSize < 1 || pageSize > 500) {
      return Response.json(
        { error: "Invalid page or pageSize parameters" },
        { status: 400 }
      );
    }

    const result = await getProposalOverviewsPaginated(page, pageSize);

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch paginated proposals:", error);
    return Response.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}