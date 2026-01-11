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
      currentRecipes,
      userRequest,
      currentShoppingList,
      recipeTitle
    } = body;

    switch (action) {
      case 'extract_exclusions':
        return await extractExclusions(userText);
      
      case 'generate_recipes':
        return await generateRecipes(healthGoals, cuisinePreferences, excludedItems || []);
      
      case 'generate_shopping_list':
        return await generateShoppingList(currentRecipes);
      
      case 'refine_shopping_list':
        return await refineShoppingList(userRequest, currentShoppingList, currentRecipes, healthGoals, cuisinePreferences);
      
      case 'regenerate_recipes':
        return await regenerateRecipes(userRequest, currentRecipes, healthGoals, cuisinePreferences, excludedItems || []);
      
      case 'add_recipe_ingredients':
        return await addRecipeIngredients(userRequest, recipeTitle, currentShoppingList, currentRecipes);
      
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
  
  const prompt = `Generate 4 diverse recipes based on these preferences.

CRITICAL REQUIREMENT - CUISINE TYPE:
The user specifically wants: ${cuisinePreferences}
ALL recipes MUST match this cuisine type. This is NON-NEGOTIABLE.

Health considerations (apply within the cuisine type):
${healthGoals}
${excludedText}

IMPORTANT: 
- Include a mix of meal types (breakfast, lunch, dinner, dessert) when possible
- Every recipe MUST be authentic ${cuisinePreferences} cuisine
- Do not mix cuisines or deviate from the requested type
- Balance health goals with authentic ${cuisinePreferences} flavors

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "name": "Recipe Name",
    "cuisine": "${cuisinePreferences}",
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
            responseMimeType: "application/json",
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    
    // Remove markdown code blocks
    let cleanedText = textContent.replace(/```json|```/g, "").trim();
    
    // Extract JSON array if there's extra text
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    let recipes;
    try {
      recipes = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error('❌ Recipe generation JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleanedText.substring(0, 200));
      throw new Error('Gemini returned invalid JSON format');
    }
    
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
    throw new Error('Failed to generate recipes: ' + err.message);
  }
}

async function generateShoppingList(recipes: any[]) {
  const allIngredients = recipes.flatMap((r: any) => r.ingredients);
  const prompt = `Consolidate these ingredients into a shopping list:
${allIngredients.join(', ')}

IMPORTANT: 
- Return ONLY the top 10 MOST ESSENTIAL items
- Each item should have quantity: "1" (always use 1 as the default quantity)
- Prioritize: Main proteins, produce, and core ingredients

The user can adjust quantities later through voice commands.

Return ONLY a JSON array with this structure (MAX 10 items), no other text:
[
  {
    "item": "Item name",
    "quantity": "1",
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
            responseMimeType: "application/json",
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    
    // Remove markdown code blocks
    let cleanedText = textContent.replace(/```json|```/g, "").trim();
    
    // Extract JSON array if there's extra text
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    let shoppingList;
    try {
      shoppingList = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error('❌ Shopping list JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleanedText.substring(0, 200));
      throw new Error('Gemini returned invalid JSON format');
    }
    
    // Ensure we have at most 10 items
    if (shoppingList.length > 10) {
      shoppingList = shoppingList.slice(0, 10);
    }
    
    // Validate that all items have prices
    const itemsWithoutPrice = shoppingList.filter((item: any) => 
      !item.estimatedPrice || typeof item.estimatedPrice !== 'number' || item.estimatedPrice <= 0
    );
    
    if (itemsWithoutPrice.length > 0) {
      console.warn('⚠️ Some items missing valid prices:', itemsWithoutPrice);
      // Add default prices to items missing them
      shoppingList = shoppingList.map((item: any) => ({
        ...item,
        estimatedPrice: item.estimatedPrice && typeof item.estimatedPrice === 'number' && item.estimatedPrice > 0
          ? item.estimatedPrice
          : 2.99 // Default fallback price
      }));
      console.log('✅ Added default prices to items');
    }
    
    // Log pricing summary
    const totalCost = shoppingList.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
    console.log('💰 Shopping list total cost:', `$${totalCost.toFixed(2)}`);
    
    return NextResponse.json({ shopping_list: shoppingList });
  } catch (err: any) {
    console.error('Shopping list generation error:', err);
    throw new Error('Failed to generate shopping list: ' + err.message);
  }
}

async function refineShoppingList(
  userRequest: string, 
  currentShoppingList: any[], 
  currentRecipes: any[],
  healthGoals: string,
  cuisinePreferences: string
) {
  console.log('🔄 refineShoppingList called with:', {
    userRequest,
    currentShoppingListLength: currentShoppingList?.length || 0,
    currentRecipesLength: currentRecipes?.length || 0,
    healthGoals,
    cuisinePreferences
  });

  // Convert current shopping list to text format
  const currentListText = (currentShoppingList || []).map(item => 
    `- ${item.name || 'Unknown'} (quantity: ${item.quantity || 1}, price: $${item.price || 0})`
  ).join('\n') || '(Empty list)';

  const allIngredients = (currentRecipes || []).flatMap((r: any) => r.ingredients || []);
  const ingredientsText = allIngredients.length > 0 ? allIngredients.join(', ') : 'No ingredients available';
  
  const prompt = `You are a shopping list modifier. The user has this exact shopping list:
${currentListText}

The user said: "${userRequest}"

CRITICAL RULES:
1. Make ONLY the specific changes the user requested
2. Keep ALL other items EXACTLY as they are (same quantity, same price, same name)
3. If user says "remove X" or "I already have X" - DELETE that item completely
4. If user says "add X" - ADD the new item(s) with reasonable quantities and realistic prices
5. DO NOT reorganize, rename, or modify any items the user didn't mention
6. DO NOT add items they didn't ask for
7. DO NOT remove items they didn't mention
8. EVERY item (existing and new) MUST have a valid "estimatedPrice" as a number (e.g., 3.99, not "$3.99")

PRICING RULES:
- For existing items: Keep the EXACT price shown above (don't change it!)
- For new items: Use realistic grocery store prices (e.g., chicken breast: 8.99, broccoli: 2.49, protein powder: 24.99)
- Always return estimatedPrice as a plain number, never as a string or with $ symbol

Examples:
- "remove soy sauce" → Remove ONLY soy sauce, keep everything else with same prices
- "add chicken" → Add chicken with estimatedPrice: 8.99, keep everything else with same prices
- "I need more protein" → Add 2-3 protein items with prices, keep everything else with same prices

Return ONLY a raw JSON array with NO explanations, NO markdown, NO extra text:
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
            temperature: 0.2, // Lower temperature for more consistent JSON output
            maxOutputTokens: 2000,
            responseMimeType: "application/json", // Force JSON response
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    console.log('📄 Raw Gemini response:', textContent);
    
    // Remove markdown code blocks
    let cleanedText = textContent.replace(/```json|```/g, "").trim();
    
    // Extract JSON array if there's extra text
    // Look for pattern: [...] 
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
      console.log('📄 Extracted JSON array:', cleanedText.substring(0, 100) + '...');
    } else {
      console.error('❌ No JSON array found in response');
      console.error('Full text:', textContent);
    }
    
    let shoppingList;
    try {
      shoppingList = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleanedText.substring(0, 200));
      throw new Error('Gemini returned invalid JSON format');
    }
    
    // Ensure we have at most 15 items
    if (shoppingList.length > 15) {
      shoppingList = shoppingList.slice(0, 15);
    }
    
    console.log('✅ Successfully parsed shopping list:', shoppingList.length, 'items');
    
    // Validate that all items have prices
    const itemsWithoutPrice = shoppingList.filter((item: any) => 
      !item.estimatedPrice || typeof item.estimatedPrice !== 'number' || item.estimatedPrice <= 0
    );
    
    if (itemsWithoutPrice.length > 0) {
      console.warn('⚠️ Some items missing valid prices:', itemsWithoutPrice);
      // Add default prices to items missing them
      shoppingList = shoppingList.map((item: any) => ({
        ...item,
        estimatedPrice: item.estimatedPrice && typeof item.estimatedPrice === 'number' && item.estimatedPrice > 0
          ? item.estimatedPrice
          : 2.99 // Default fallback price
      }));
      console.log('✅ Added default prices to items');
    }
    
    // Log pricing summary
    const totalCost = shoppingList.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
    console.log('💰 Refined list total cost:', `$${totalCost.toFixed(2)}`);
    
    return NextResponse.json({ shopping_list: shoppingList });
  } catch (err: any) {
    console.error('Shopping list refinement error:', err);
    throw new Error('Failed to refine shopping list: ' + err.message);
  }
}

async function regenerateRecipes(
  userRequest: string,
  currentRecipes: any[],
  healthGoals: string,
  cuisinePreferences: string,
  excludedItems: string[]
) {
  const currentRecipeNames = currentRecipes.map(r => r.name || r.title).join(', ');
  const excludedText = excludedItems.length > 0 
    ? ` Exclude these ingredients: ${excludedItems.join(', ')}.` 
    : '';
  
  const prompt = `The user currently has these recipes: ${currentRecipeNames}

The user said: "${userRequest}"

CRITICAL - CUISINE REQUIREMENT:
User's preferred cuisine: ${cuisinePreferences}
ALL new recipes MUST match this cuisine type unless user explicitly requested different cuisine.

Health considerations (apply within the cuisine type):
${healthGoals}
${excludedText}

Based on this feedback, generate 4 NEW different recipes that better match what they're looking for. You should:
- If they want different cuisines, change the cuisine style as requested
- If they don't like the current recipes, go in a completely different direction
- If they want more of a certain meal type, prioritize that (e.g., more breakfast options)
- If they mention specific foods or restrictions, incorporate those
- AVOID repeating the recipes they already have
- Stay authentic to the ${cuisinePreferences} cuisine style unless explicitly asked to change

IMPORTANT: Include a mix of meal types (breakfast, lunch, dinner, dessert) when possible.

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "name": "Recipe Name",
    "cuisine": "Cuisine Type (should be ${cuisinePreferences} unless user requested different)",
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
            temperature: 0.8, // Higher temperature for more variety
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    
    // Remove markdown code blocks
    let cleanedText = textContent.replace(/```json|```/g, "").trim();
    
    // Extract JSON array if there's extra text
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    let recipes;
    try {
      recipes = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error('❌ Recipe regeneration JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleanedText.substring(0, 200));
      throw new Error('Gemini returned invalid JSON format');
    }
    
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
    console.error('Recipe regeneration error:', err);
    throw new Error('Failed to regenerate recipes: ' + err.message);
  }
}

async function addRecipeIngredients(
  userRequest: string,
  recipeTitle: string,
  currentShoppingList: any[],
  currentRecipes: any[]
) {
  console.log('🍳 addRecipeIngredients called:', {
    userRequest,
    recipeTitle,
    currentShoppingListLength: currentShoppingList?.length || 0,
    currentRecipesLength: currentRecipes?.length || 0
  });

  // Find the recipe by title (fuzzy match)
  const targetRecipe = currentRecipes.find((recipe: any) => {
    const title = (recipe.name || recipe.title || '').toLowerCase();
    const searchTerm = recipeTitle.toLowerCase();
    return title.includes(searchTerm) || searchTerm.includes(title);
  });

  if (!targetRecipe) {
    console.error('❌ Recipe not found:', recipeTitle);
    return NextResponse.json(
      { error: 'Recipe not found', shopping_list: currentShoppingList },
      { status: 200 } // Return current list unchanged
    );
  }

  console.log('✅ Found recipe:', targetRecipe.name || targetRecipe.title);

  const recipeIngredients = targetRecipe.ingredients || [];
  const currentListText = (currentShoppingList || []).map(item => 
    `- ${item.name || 'Unknown'}`
  ).join('\n') || '(Empty list)';

  const recipeIngredientsText = recipeIngredients.join(', ');

  const prompt = `The user has this shopping list:
${currentListText}

The user wants to make this recipe: "${targetRecipe.name || targetRecipe.title}"
Recipe ingredients: ${recipeIngredientsText}

TASK: Compare the recipe ingredients with the current shopping list. Add any missing ingredients to the list with quantity "1".

RULES:
1. Keep ALL existing items in the list (same quantity, same price, same name)
2. For each recipe ingredient NOT in the current list, add it with:
   - quantity: "1"
   - estimatedPrice: realistic grocery price (number)
   - category: appropriate category
3. Use smart matching (e.g., "chicken breast" matches "chicken", "tomato" matches "tomatoes")
4. If an ingredient is already in the list, DO NOT add it again
5. Return the COMPLETE updated shopping list (existing + new items)

Return ONLY a raw JSON array with NO explanations, NO markdown, NO extra text:
[
  {
    "item": "Item name",
    "quantity": "1",
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
            responseMimeType: "application/json",
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0]?.content?.parts[0]?.text || "";
    console.log('📄 Raw Gemini response:', textContent.substring(0, 200));

    // Remove markdown code blocks
    let cleanedText = textContent.replace(/```json|```/g, "").trim();

    // Extract JSON array if there's extra text
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    let shoppingList;
    try {
      shoppingList = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleanedText.substring(0, 200));
      throw new Error('Gemini returned invalid JSON format');
    }

    // Validate prices
    const itemsWithoutPrice = shoppingList.filter((item: any) => 
      !item.estimatedPrice || typeof item.estimatedPrice !== 'number' || item.estimatedPrice <= 0
    );

    if (itemsWithoutPrice.length > 0) {
      console.warn('⚠️ Some items missing valid prices:', itemsWithoutPrice);
      shoppingList = shoppingList.map((item: any) => ({
        ...item,
        estimatedPrice: item.estimatedPrice && typeof item.estimatedPrice === 'number' && item.estimatedPrice > 0
          ? item.estimatedPrice
          : 2.99
      }));
    }

    const totalCost = shoppingList.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
    console.log('✅ Updated list with recipe ingredients:', shoppingList.length, 'items');
    console.log('💰 Total cost:', `$${totalCost.toFixed(2)}`);

    return NextResponse.json({ shopping_list: shoppingList });
  } catch (err: any) {
    console.error('Recipe ingredient addition error:', err);
    throw new Error('Failed to add recipe ingredients: ' + err.message);
  }
}
