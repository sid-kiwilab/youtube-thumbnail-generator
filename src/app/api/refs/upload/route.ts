import { saveRefUpload } from "@/lib/refs-store";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Invalid form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }
  const blob = file as Blob;
  const name =
    "name" in file && typeof file.name === "string" ? file.name : "upload.jpg";
  const buf = Buffer.from(await blob.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) {
    return Response.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }
  try {
    const { src } = saveRefUpload(name, buf);
    return Response.json({ src, name: src.split("/").pop() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}