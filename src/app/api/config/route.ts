import { publicConfig } from "@/lib/config";

export async function GET() {
  return Response.json(publicConfig());
}