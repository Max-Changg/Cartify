// app/lib/recipeEngine.ts
import OpenAI from "openai"
import { AMAZON_FRESH_MOCK } from "../../data/amazon_fresh_mock"

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({ apiKey });
}

function extractJSON(text: string) {
  // Remove markdown code fences if model includes them
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()

  return JSON.parse(cleaned)
}

export async function generateRecipes(prompt: string) {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `
You are a recipe generator.

STRICT RULES:
- Output VALID JSON ONLY
- NO markdown
- NO backticks
- NO explanations

JSON schema:
{
  "recipes": [
    {
      "title": string,
      "ingredients": string[],
      "steps": string[],
      "health_tags": string[]
    }
  ]
}
`
      },
      {
        role: "user",
        content: `
User preferences:
${prompt}

Available ingredients:
${AMAZON_FRESH_MOCK.join(", ")}
`
      }
    ]
  })

  const raw = response.choices[0].message.content
  if (!raw) throw new Error("Empty OpenAI response")

  return extractJSON(raw)
}
