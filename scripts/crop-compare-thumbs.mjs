#!/usr/bin/env node
/**
 * One-off: extract 16:9 thumbs from full-card compare PNGs.
 */
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public/refs/compare");
const out = (name) => join(dir, name);

async function to169(input, extract, outputName) {
  const buf = await sharp(join(dir, input))
    .extract(extract)
    .resize(1280, 720, { fit: "cover", position: "centre" })
    .png()
    .toFile(out(outputName));
  console.log(outputName, buf.width, buf.height);
}

await to169("good-slap.png", { left: 0, top: 0, width: 838, height: 471 }, "thumb-slap.png");
await to169("good-first-video.png", { left: 0, top: 0, width: 732, height: 412 }, "thumb-first-video.png");
