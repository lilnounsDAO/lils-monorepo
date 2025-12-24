import { getAuctionById } from "@/data/auction/getAuctionById";

// Convert BigInt values to strings for JSON serialization
function serializeBigInt(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Unfortunte workaround for nextjs bug with server actions from tanstack
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auction = await getAuctionById(params.id);
  return Response.json(serializeBigInt(auction));
}
