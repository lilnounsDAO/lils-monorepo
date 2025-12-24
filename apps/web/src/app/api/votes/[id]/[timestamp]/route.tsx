import { getProposalVotesAfterTimestamp } from "@/data/goldsky/governance/getProposalVotes";

// Unfortunte workaround for nextjs bug with server actions from tanstack
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string; timestamp: string }> },
) {
  const params = await props.params;
  const votes = await getProposalVotesAfterTimestamp(
    params.id, // Goldsky uses string IDs
    parseInt(params.timestamp),
  );
  return Response.json(votes);
}
