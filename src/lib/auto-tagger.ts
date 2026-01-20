import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Generate 3-5 relevant tags from a design description using Claude.
 * Returns empty array if API key not configured or on any error.
 */
export async function generateTags(
  description: string,
  category: string
): Promise<string[]> {
  // Graceful fallback if no API key
  if (!ANTHROPIC_API_KEY) {
    return [];
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Extract 3-5 relevant tags from this design description. The piece is in the "${category}" category.

Description: "${description}"

Rules:
- Return ONLY a JSON array of strings, nothing else
- Tags should be lowercase, hyphenated (e.g., "visual-identity" not "Visual Identity")
- Tags should be specific and useful for filtering similar work
- Focus on style, medium, technique, and aesthetic qualities

Example output: ["minimal", "geometric", "dark-mode", "editorial"]`,
        },
      ],
    });

    // Extract text from response
    const content = message.content[0];
    if (content.type !== "text") {
      return [];
    }

    // Parse JSON array from response
    const parsed = JSON.parse(content.text);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate and clean tags
    return parsed
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.toLowerCase().trim())
      .filter((tag) => tag.length > 0 && tag.length <= 50)
      .slice(0, 5);
  } catch (error) {
    console.error("Auto-tagging failed:", error);
    return [];
  }
}
