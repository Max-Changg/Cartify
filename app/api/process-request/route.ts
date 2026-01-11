import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  estimated_price?: number;
  unit?: string;
  in_cart: boolean;
}

interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  in_shopping_list: boolean;
}

interface Recipe {
  id: number;
  title: string;
  image?: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string;
  ingredients?: RecipeIngredient[];
  used_ingredients_count?: number;
  missing_ingredients_count?: number;
}

interface ShoppingListResponse {
  items: ShoppingItem[];
  total_estimated_cost: number;
  recipes: Recipe[];
  user_goals?: {
    health_preferences?: string[];
    dietary_restrictions?: string[];
    budget?: number;
    timeframe?: string;
  };
}

async function processWithGemini(transcript: string, budget?: number): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const genai = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Try different models
  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-pro-latest',
  ];

  let model;
  let lastError;

  for (const modelName of modelNames) {
    try {
      model = genai.getGenerativeModel({ model: modelName });
      break;
    } catch (e: any) {
      lastError = e.message;
      continue;
    }
  }

  if (!model) {
    throw new Error(`Could not initialize any Gemini model. Last error: ${lastError}`);
  }

  const prompt = `You are a professional nutritionist and meal planning expert. Generate a healthy, balanced weekly meal plan shopping list.

User request: "${transcript}"

IMPORTANT GUIDELINES:
- Focus on WHOLE FOODS: fresh vegetables, fruits, lean proteins, whole grains, legumes
- AVOID processed foods, fast food copycats, excessive sugar, or unhealthy options
- Create a BALANCED meal plan with variety (different proteins, vegetables, grains)
- Include ingredients for complete meals (breakfast, lunch, dinner) not just snacks or desserts
- Prioritize nutrient-dense foods that support health
- Stay within budget: $${budget || 'reasonable'}
- Plan for a full week of meals

Generate a shopping list that includes:
- Fresh vegetables (variety of colors: leafy greens, bell peppers, tomatoes, etc.)
- Fresh fruits
- Lean proteins (chicken breast, fish, beans, lentils, eggs)
- Whole grains (brown rice, quinoa, whole wheat pasta/bread, oats)
- Healthy fats (olive oil, nuts, avocado)
- Dairy or plant-based alternatives
- Basic pantry staples (spices, garlic, onions)

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just JSON):
{
    "goals": {
        "health_preferences": ["healthy", "balanced meals", "whole foods"],
        "dietary_restrictions": [],
        "budget": ${budget || null},
        "timeframe": "week"
    },
    "shopping_list": [
        {
            "name": "item name (use common grocery store names)",
            "quantity": "amount needed for the week",
            "unit": "unit of measurement (lb, oz, bunch, etc.)",
            "estimated_price": estimated_price_in_dollars
        }
    ]
}

Be specific with quantities and realistic with prices. Focus on healthy, whole food ingredients for complete meals. Return ONLY the JSON, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error(`Gemini processing error: ${error.message}`);
  }
}

async function getRecipesFromGemini(
  ingredients: string[],
  shoppingListItems: ShoppingItem[],
  number: number = 5
): Promise<Recipe[]> {
  if (!GEMINI_API_KEY) {
    return [];
  }

  try {
    const genai = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const shoppingListNames = new Set(shoppingListItems.map(item => item.name.toLowerCase().trim()));
    const ingredientsStr = ingredients.slice(0, 15).join(', ');

    const prompt = `Generate ${number} healthy, balanced recipes using these ingredients: ${ingredientsStr}

For each recipe, provide:
1. A creative, appetizing recipe title
2. List of ingredients with amounts and units
3. Estimated cooking time in minutes
4. Number of servings
5. Brief description (1-2 sentences)

Return ONLY a valid JSON array with this exact structure:
[
    {
        "title": "Recipe Title",
        "ingredients": [
            {"name": "ingredient name", "amount": 2, "unit": "cups"}
        ],
        "readyInMinutes": 30,
        "servings": 4,
        "description": "Brief description of the recipe"
    }
]

Focus on:
- Healthy, whole food recipes
- Balanced nutrition
- Practical cooking times
- Use ingredients from the list provided
- Avoid processed foods, fast food copycats, or unhealthy options

Return ONLY the JSON array, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const recipesData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    const recipes: Recipe[] = [];
    
    // Fetch images for all recipes in parallel
    const imagePromises = recipesData.slice(0, number).map(async (recipeData: any, idx: number) => {
      let recipeImage: string | undefined = undefined;
      
      // Fetch image from Unsplash API
      if (UNSPLASH_ACCESS_KEY && recipeData.title) {
        try {
          const query = `${recipeData.title} food recipe`;
          const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
          const unsplashResponse = await fetch(unsplashUrl);
          
          if (unsplashResponse.ok) {
            const unsplashData = await unsplashResponse.json();
            if (unsplashData.results && unsplashData.results.length > 0) {
              recipeImage = unsplashData.results[0].urls.regular || 
                           unsplashData.results[0].urls.small || 
                           unsplashData.results[0].urls.thumb;
            }
          }
        } catch (error) {
          console.log(`Failed to fetch image for ${recipeData.title}:`, error);
        }
      }
      
      // Fallback to Unsplash Source API if no image found
      if (!recipeImage && recipeData.title) {
        recipeImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(recipeData.title + ' food')}`;
      }
      
      return { idx, image: recipeImage };
    });
    
    const imageResults = await Promise.all(imagePromises);
    const imageMap = new Map(imageResults.map(r => [r.idx, r.image]));
    
    for (let idx = 0; idx < Math.min(recipesData.length, number); idx++) {
      const recipeData = recipesData[idx];
      const recipeIngredients: RecipeIngredient[] = [];
      let usedCount = 0;
      let missingCount = 0;

      for (const ing of recipeData.ingredients || []) {
        const ingName = ing.name?.toLowerCase().trim() || '';
        const inList = Array.from(shoppingListNames).some(
          slName => ingName.includes(slName) || slName.includes(ingName)
        );

        if (inList) {
          usedCount++;
        } else {
          missingCount++;
        }

        recipeIngredients.push({
          name: ing.name || '',
          amount: ing.amount || 0,
          unit: ing.unit || '',
          in_shopping_list: inList,
        });
      }

      recipes.push({
        id: idx + 1000,
        title: recipeData.title || '',
        image: imageMap.get(idx) || undefined, // Use fetched Unsplash image
        readyInMinutes: recipeData.readyInMinutes || 30,
        servings: recipeData.servings || 4,
        sourceUrl: undefined,
        ingredients: recipeIngredients,
        used_ingredients_count: usedCount,
        missing_ingredients_count: missingCount,
      });
    }

    return recipes;
  } catch (error: any) {
    console.error('Error generating recipes with Gemini:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { detail: 'Text is required' },
        { status: 400 }
      );
    }

    // Extract budget from transcript if mentioned
    const budgetMatch = text.match(/\$(\d+)/);
    const budget = budgetMatch ? parseFloat(budgetMatch[1]) : undefined;

    // Process with Gemini
    const geminiResult = await processWithGemini(text, budget);

    // Extract shopping list items
    const shoppingItems: ShoppingItem[] = [];
    let totalCost = 0.0;

    if (geminiResult.shopping_list) {
      geminiResult.shopping_list.forEach((itemData: any, idx: number) => {
        const item: ShoppingItem = {
          id: `item_${idx}`,
          name: itemData.name || '',
          quantity: itemData.quantity || '1',
          unit: itemData.unit || '',
          estimated_price: itemData.estimated_price || 0.0,
          in_cart: false,
        };
        shoppingItems.push(item);
        totalCost += item.estimated_price || 0.0;
      });
    }

    // Get recipe suggestions
    const ingredientNames = shoppingItems.map(item => item.name);
    const recipes = await getRecipesFromGemini(ingredientNames, shoppingItems, 5);

    // Create response
    const response: ShoppingListResponse = {
      items: shoppingItems,
      total_estimated_cost: Math.round(totalCost * 100) / 100,
      recipes,
      user_goals: geminiResult.goals,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Process request error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

