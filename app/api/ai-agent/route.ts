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

IMPORTANT: Include a mix of meal types (breakfast, lunch, dinner, dessert) when possible.

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "name": "Recipe Name",
    "cuisine": "Cuisine Type",
    "mealType": "breakfast/lunch/dinner/dessert",
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
    
    // Fetch images for all recipes in parallel
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    const recipesWithImages = await Promise.all(
      recipes.map(async (recipe: any) => {
        let imageUrl = '';
        
        // Fetch image from Unsplash API
        if (UNSPLASH_ACCESS_KEY && recipe.name) {
          try {
            const query = `${recipe.name} food recipe`;
            const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
            const unsplashResponse = await fetch(unsplashUrl);
            
            if (unsplashResponse.ok) {
              const unsplashData = await unsplashResponse.json();
              if (unsplashData.results && unsplashData.results.length > 0) {
                imageUrl = unsplashData.results[0].urls.regular || 
                           unsplashData.results[0].urls.small || 
                           unsplashData.results[0].urls.thumb;
              }
            }
          } catch (error) {
            console.log(`Failed to fetch image for ${recipe.name}:`, error);
          }
        }
        
        // Fallback to Unsplash Source API if no image found
        if (!imageUrl && recipe.name) {
          imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(recipe.name + ' food')}`;
        }
        
        return {
          ...recipe,
          image: imageUrl,
        };
      })
    );
    
    return NextResponse.json({ recipes: recipesWithImages });
  } catch (err: any) {
    console.error('Recipe generation error:', err);
    throw new Error('Failed to generate recipes');
  }
}

async function generateShoppingList(recipes: any[]) {
  const allIngredients = recipes.flatMap((r: any) => r.ingredients);
  const prompt = `Consolidate these ingredients into a shopping list with quantities:
${allIngredients.join(', ')}

Return ONLY a JSON array with this structure, no other text:
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
    const shoppingList = JSON.parse(cleanedText);
    
    return NextResponse.json({ shopping_list: shoppingList });
  } catch (err: any) {
    console.error('Shopping list generation error:', err);
    throw new Error('Failed to generate shopping list');
  }
}
