import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { detail: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      action, 
      userText, 
      healthGoals, 
      cuisinePreferences, 
      excludedItems,
      currentRecipes 
    } = body;

    switch (action) {
      case 'extract_exclusions':
        return await extractExclusions(userText);
      
      case 'generate_recipes':
        return await generateRecipes(healthGoals, cuisinePreferences, excludedItems || []);
      
      case 'generate_shopping_list':
        return await generateShoppingList(currentRecipes);
      
      default:
        return NextResponse.json(
          { detail: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('AI Agent error:', error);
    return NextResponse.json(
      { detail: error.message || 'AI Agent processing failed' },
      { status: 500 }
    );
  }
}

async function extractExclusions(userText: string) {
  const prompt = `From this user request: "${userText}"
Extract the food items they want to exclude. Return ONLY a JSON array of item names, no other text:
["item1", "item2"]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    const cleanedText = textContent.replace(/```json|```/g, "").trim();
    const itemsToExclude = JSON.parse(cleanedText);
    
    return NextResponse.json({ excluded_items: itemsToExclude });
  } catch (err: any) {
    console.error('Exclusion extraction error:', err);
    throw new Error('Failed to extract exclusions');
  }
}

async function generateRecipes(healthGoals: string, cuisinePreferences: string, excludedItems: string[]) {
  const excludedText = excludedItems.length > 0 
    ? ` Exclude these ingredients: ${excludedItems.join(', ')}.` 
    : '';
  
  const prompt = `Generate 4 diverse recipes based on these preferences:
- Health goals: ${healthGoals}
- Cuisine preferences: ${cuisinePreferences}
${excludedText}

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "name": "Recipe Name",
    "cuisine": "Cuisine Type",
    "servings": 4,
    "prepTime": "30 mins",
    "healthBenefits": "Brief health benefit",
    "ingredients": ["ingredient 1", "ingredient 2"]
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    const cleanedText = textContent.replace(/```json|```/g, "").trim();
    const recipes = JSON.parse(cleanedText);
    
    return NextResponse.json({ recipes });
  } catch (err: any) {
    console.error('Recipe generation error:', err);
    throw new Error('Failed to generate recipes');
  }
}

async function generateShoppingList(recipes: any[]) {
  const allIngredients = recipes.flatMap((r: any) => r.ingredients);
  const prompt = `Consolidate these ingredients into a shopping list with quantities:
${allIngredients.join(', ')}

IMPORTANT: Return ONLY the top 10 MOST ESSENTIAL items. Prioritize:
1. Main proteins and produce
2. Items needed across multiple recipes
3. Core ingredients that are not common pantry staples

The user can add more items later through voice commands.

Return ONLY a JSON array with this structure (MAX 10 items), no other text:
[
  {
    "item": "Item name",
    "quantity": "Amount needed",
    "category": "produce/protein/dairy/pantry/other",
    "estimatedPrice": 2.99
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    const cleanedText = textContent.replace(/```json|```/g, "").trim();
    let shoppingList = JSON.parse(cleanedText);
    
    // Ensure we have at most 10 items
    if (shoppingList.length > 10) {
      shoppingList = shoppingList.slice(0, 10);
    }
    
    return NextResponse.json({ shopping_list: shoppingList });
  } catch (err: any) {
    console.error('Shopping list generation error:', err);
    throw new Error('Failed to generate shopping list');
  }
}
