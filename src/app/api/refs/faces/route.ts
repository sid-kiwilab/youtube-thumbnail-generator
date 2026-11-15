import { readdirSync } from "node:fs";
import { join } from "node:path";

const FACES_DIR = join(process.cwd(), "public", "refs", "faces");
const IMAGE = /\.(png|jpe?g|webp)$/i;

export async function GET() {
  let names: string[];
  try {
    names = readdirSync(FACES_DIR)
      .filter((n) => IMAGE.test(n))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch {
    return Response.json({ faces: [] });
  }

  const faces = names.map((name) => {
    const base = name.replace(/\.(png|jpe?g|webp)$/i, "");
    return {
      name: base,
      label: name,
      src: `/refs/faces/${name}`,
      isSid: /^sid-/i.test(base),
    };
  });

  return Response.json({ faces });
}
