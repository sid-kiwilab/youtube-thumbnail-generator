import { listRefLibrary } from "@/lib/refs-store";

export async function GET() {
  return Response.json({ items: listRefLibrary() });
}