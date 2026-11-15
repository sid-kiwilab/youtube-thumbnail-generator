export function publicConfig() {
  return {
    hasYoutube: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
    hasOpenRouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    hasOpenAi: Boolean(process.env.OPENAI_API_KEY?.trim()),
    imageModel:
      process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst",
    textModel:
      process.env.OPENROUTER_TEXT_MODEL?.trim() || "openai/gpt-4o-mini",
    nicheModel:
      process.env.OPENROUTER_NICHE_MODEL?.trim() ||
      "anthropic/claude-sonnet-4.5",
  };
}