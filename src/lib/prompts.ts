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

export function thumbnailPrompt(vars: { brief: string }) {
  const hookStyle = readPromptFile("hook-style.md");
  return fillTemplate(readPromptFile("thumbnail.md"), {
    hookStyle,
    brief: vars.brief,
  });
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