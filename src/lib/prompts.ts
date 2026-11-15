import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PROMPTS_DIR } from "./paths";

function readPromptFile(name: string) {
  const path = join(PROMPTS_DIR, name);
  if (!existsSync(path)) throw new Error(`Missing prompt file: prompts/${name}`);
  return readFileSync(path, "utf8").trim();
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>,
) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export function titlePrompt(vars: {
  channel: string;
  examples: string;
  brief: string;
}) {
  return fillTemplate(readPromptFile("title.md"), vars);
}

export function thumbnailPrompt(vars: {
  brief: string;
  refNotes?: string;
  supportingNames?: string;
}) {
  const hookStyle = readPromptFile("hook-style.md");
  return fillTemplate(readPromptFile("thumbnail.md"), {
    hookStyle,
    brief: vars.brief,
    refNotes: vars.refNotes?.trim() || "(none)",
    supportingNames: vars.supportingNames?.trim() || "(none)",
  });
}

export function refAnalyzeSystemPrompt(vars: {
  channelTitle: string;
  channelHandle: string;
  channelAvatar: string;
}) {
  return fillTemplate(readPromptFile("ref-analyze.md"), vars);
}

export function formatRefAnalysisForPrompt(
  items: {
    source: string;
    creatorFace: string;
    otherFaces: string;
    layoutToBorrow: string;
    textOnImage: string;
    doNotCopy: string;
    videoTitle?: string;
  }[],
  summary: string,
) {
  const lines = items.map((it, i) => {
    const label = it.videoTitle
      ? `Ref ${i + 1} (${it.source}: ${it.videoTitle})`
      : `Ref ${i + 1} (${it.source})`;
    return [
      label,
      `  Creator face: ${it.creatorFace}`,
      `  Other faces: ${it.otherFaces}`,
      `  Layout to borrow: ${it.layoutToBorrow}`,
      `  Text on image: ${it.textOnImage}`,
      `  Do not copy: ${it.doNotCopy}`,
    ].join("\n");
  });
  return `${summary}\n\n${lines.join("\n\n")}`;
}

export function visionEvalSystemPrompt() {
  return readPromptFile("vision-eval.md");
}

export function nicheInferPrompt(vars: {
  channelTitle: string;
  description: string;
  videoTitles: string;
}) {
  return fillTemplate(readPromptFile("niche-competitors.md"), vars);
}

export function nichePickPrompt(vars: {
  channelTitle: string;
  nicheSummary: string;
  candidates: string;
}) {
  return fillTemplate(readPromptFile("niche-competitors-pick.md"), vars);
}