// AUTO-GENERATED FROM recipe.py
// Chat-only, data-grounded recipe engine in TypeScript
// No Python backend required
import "dotenv/config";
import * as fs from "fs";
import * as readline from "readline";
import OpenAI from "openai";

// ======================================================
// TYPES
// ======================================================

export interface Recipe {
  title: string;
  ingredients_used: string[];
  instructions: string[];
}

// ======================================================
// LOAD ENV
// ======================================================

if (!process.env.OPENAI_API_KEY) {
  throw new Error("❌ Missing OPENAI_API_KEY");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ======================================================
// LOAD INGREDIENT UNIVERSE
// ======================================================

const raw = fs.readFileSync("amazon_fresh_mock.json", "utf-8");
const MOCK_PRODUCTS = JSON.parse(raw) as { name: string }[];

const AVAILABLE_INGREDIENTS = Array.from(
  new Set(MOCK_PRODUCTS.map(p => p.name.toLowerCase()))
).sort();

// ======================================================
// SYSTEM PROMPTS
// ======================================================

const INGREDIENT_SELECTION_PROMPT = `
You are a culinary assistant.

You may ONLY select ingredients from the allowed ingredient list.
Do NOT invent ingredients.

Task:
Given a user's food preferences and health goals,
select 6–10 relevant ingredients from the allowed list.

Rules:
- Use ONLY ingredients from the allowed list
- Do NOT suggest recipes yet
- Do NOT add new ingredients
- Output valid JSON only

JSON format:
{
  "ingredients": ["ingredient 1", "ingredient 2"]
}
`;

const RECIPE_GENERATION_PROMPT = `
You are a professional chef.

Using ONLY the provided ingredients, generate 10 simple recipes.

Rules:
- Do NOT introduce new ingredients
- Each recipe must include:
  - title
  - ingredients_used
  - step_by_step_instructions
- Keep recipes simple and realistic
- Output valid JSON only

JSON format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "ingredients_used": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"]
    }
  ]
}
`;

// ======================================================
// STEP 1: USER PREFERENCES → INGREDIENTS
// ======================================================

async function selectIngredients(userPrompt: string): Promise<string[]> {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: INGREDIENT_SELECTION_PROMPT },
      {
        role: "user",
        content: `User preferences:\n${userPrompt}\n\nAllowed ingredients:\n${AVAILABLE_INGREDIENTS.join(", ")}`
      }
    ]
  });

  const text = response.choices[0].message.content || "{}";
  return JSON.parse(text).ingredients as string[];
}

// ======================================================
// STEP 2: INGREDIENTS → RECIPES
// ======================================================

async function generateRecipes(ingredients: string[]): Promise<Recipe[]> {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.5,
    messages: [
      { role: "system", content: RECIPE_GENERATION_PROMPT },
      {
        role: "user",
        content: `Ingredients:\n${ingredients.join(", ")}`
      }
    ]
  });

  const text = response.choices[0].message.content || "{}";
  return JSON.parse(text).recipes as Recipe[];
}

// ======================================================
// USER SELECTION
// ======================================================

function parseSelection(choice: string, recipes: Recipe[]): Recipe[] {
  if (choice === "all") return recipes;

  return choice
    .split(",")
    .map(n => recipes[parseInt(n.trim()) - 1])
    .filter(Boolean);
}

// ======================================================
// MAIN (CLI)
// ======================================================

async function main() {
  console.log("\n=== CHAT-ONLY RECIPE BOT (TYPECRIPT) ===\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Describe the food you like and your health goals:\n> ", async userPrompt => {
    const ingredients = await selectIngredients(userPrompt);

    console.log("\n🧺 Selected ingredients:");
    ingredients.forEach(i => console.log(" - " + i));

    const recipes = await generateRecipes(ingredients);

    console.log("\n📖 Available recipes:");
    recipes.forEach((r, i) => console.log(`${i + 1}. ${r.title}`));

    let choice = "";
    while (choice !== "none") {
      choice = await new Promise<string>(resolve =>
        rl.question(
          "\nWhich recipe(s) do you want to see? (1,3 | all | none)\n> ",
          resolve
        )
      );

      if (choice === "none") break;

      const selected = parseSelection(choice, recipes);
      selected.forEach(r => {
        console.log(`\n🍽️ ${r.title}`);
        console.log("Ingredients:");
        r.ingredients_used.forEach(i => console.log(" - " + i));
        console.log("Instructions:");
        r.instructions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
      });
    }

    rl.close();
  });
}

main();
