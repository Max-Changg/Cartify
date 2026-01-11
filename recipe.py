import os
import json
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

# ======================================================
# LOAD ENV
# ======================================================

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
assert OPENAI_API_KEY, "❌ Missing OPENAI_API_KEY"

client = OpenAI(api_key=OPENAI_API_KEY)

# ======================================================
# LOAD INGREDIENT UNIVERSE (YOUR DATA)
# ======================================================

with open("amazon_fresh_mock.json", "r", encoding="utf-8") as f:
    MOCK_PRODUCTS = json.load(f)

AVAILABLE_INGREDIENTS = sorted(
    {p["name"].lower() for p in MOCK_PRODUCTS}
)

# ======================================================
# SYSTEM PROMPTS
# ======================================================

INGREDIENT_SELECTION_PROMPT = """
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
"""

RECIPE_GENERATION_PROMPT = """
You are a professional chef.

Using ONLY the provided ingredients, generate 10 simple recipes.

Rules:
- Do NOT introduce new ingredients
- Each recipe must include:
  - title
  - ingredients_used
  - how much of each ingredients needed
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
"""

# ======================================================
# STEP 1: USER PREFERENCES → INGREDIENTS
# ======================================================

def select_ingredients(user_prompt: str) -> List[str]:
    allowed = ", ".join(AVAILABLE_INGREDIENTS)

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": INGREDIENT_SELECTION_PROMPT},
            {
                "role": "user",
                "content": (
                    f"User preferences:\n{user_prompt}\n\n"
                    f"Allowed ingredients:\n{allowed}"
                )
            }
        ],
        temperature=0.3
    )

    parsed = json.loads(response.choices[0].message.content)
    return parsed["ingredients"]

# ======================================================
# STEP 2: INGREDIENTS → RECIPES (CHAT ONLY)
# ======================================================

def generate_recipes(ingredients: List[str]) -> List[Dict]:
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": RECIPE_GENERATION_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Ingredients:\n{', '.join(ingredients)}"
                )
            }
        ],
        temperature=0.5
    )

    parsed = json.loads(response.choices[0].message.content)
    return parsed["recipes"]

# ======================================================
# STEP 3: DISPLAY
# ======================================================

def print_recipe_list(recipes: List[Dict]):
    print("\n📖 Available recipes:")
    for i, r in enumerate(recipes, start=1):
        print(f"{i}. {r['title']}")

def print_full_recipe(recipe: Dict):
    print(f"\n🍽️ {recipe['title']}")

    print("\n🧺 Ingredients used:")
    for ing in recipe["ingredients_used"]:
        print(f" - {ing}")

    print("\n📖 Instructions:")
    for i, step in enumerate(recipe["instructions"], start=1):
        print(f" {i}. {step}")

# ======================================================
# USER SELECTION
# ======================================================

def parse_selection(choice: str, recipes: List[Dict]) -> List[Dict]:
    if choice == "all":
        return recipes

    indices = []
    for part in choice.split(","):
        part = part.strip()
        if part.isdigit():
            idx = int(part) - 1
            if 0 <= idx < len(recipes):
                indices.append(idx)

    return [recipes[i] for i in indices]

# ======================================================
# MAIN
# ======================================================

def main():
    print("\n=== CHAT-ONLY RECIPE BOT (DATA-GROUNDED) ===\n")

    user_prompt = input(
        "Describe the food you like and your health goals:\n> "
    )

    ingredients = select_ingredients(user_prompt)

    print("\n🧺 Selected ingredients (from your dataset):")
    for ing in ingredients:
        print(f" - {ing}")

    recipes = generate_recipes(ingredients)

    print_recipe_list(recipes)

    choice = "hello"
    while (choice != 'none'):
        choice = input(
            "\nWhich recipe(s) do you want to see?\n"
            "Enter numbers (e.g. 1,3) or 'all', enter 'none' to stop:\n> "
        ).strip().lower()

        selected = parse_selection(choice, recipes)

        for recipe in selected:
            print_full_recipe(recipe)

# ======================================================
# RUN
# ======================================================

if __name__ == "__main__":
    main()
