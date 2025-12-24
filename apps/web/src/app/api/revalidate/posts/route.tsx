import { revalidateTag } from "@/utils/viteCache";

export async function GET() {
  revalidateTag("get-posts-by-slug");
  revalidateTag("get-post-overviews");
  return Response.json({success: true});
}
