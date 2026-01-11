# Recipe Ingredients Addition Feature

## Overview
Users can now ask the AI agent to add all ingredients from a specific recipe to their shopping list. The agent intelligently compares the recipe's ingredients with the current shopping list and only adds missing items.

## User Experience

### Workflow
1. User views recipes on the page
2. User likes a specific recipe
3. User asks agent: "I like the recipe titled green bean casserole, can you make sure I have all the ingredients for this dish?"
4. Agent says: "Let me add those recipe ingredients to your list."
5. System adds missing ingredients with quantity 1
6. Agent responds: "Done! I added the recipe ingredients to your list. Would you like any other changes?"

### Example Interactions

**Example 1: Simple Request**
```
User: "Can you add all ingredients from the tofu stir-fry recipe?"
Agent: "Let me add those recipe ingredients to your list."
[System adds: Tofu, Bell peppers, Soy sauce, Ginger, etc.]
Agent: "Done! I added the recipe ingredients to your list. Would you like any other changes?"
```

**Example 2: With Existing Items**
```
Current list: Tofu (1), Rice (1)
User: "I want to make the green bean casserole, add those ingredients"
Agent: "Let me add those recipe ingredients to your list."
[System checks: Tofu exists ✓, adds: Green beans, Cream of mushroom soup, Onions]
Agent: "Done! I added the recipe ingredients to your list. Would you like any other changes?"
```

**Example 3: Full Recipe Title**
```
User: "I like the recipe titled Korean Kimchi Fried Rice, make sure I have everything"
Agent: "Let me add those recipe ingredients to your list."
[System finds recipe, adds missing ingredients]
Agent: "Done! I added the recipe ingredients to your list. Would you like any other changes?"
```

## Technical Implementation

### Frontend Changes

#### 1. New Trigger Phrase
Added to agent prompts:
```
"Let me add those recipe ingredients to your list."
```

#### 2. Recipe Title Extraction
Helper function that extracts recipe name from user request:

```typescript
const extractRecipeTitle = (userRequest: string): string => {
  const patterns = [
    /(?:recipe titled |titled |recipe called |called )["']?([^"']+)["']?/i,
    /(?:the |that )([^,]+?)(?:recipe|dish)/i,
    /(?:from |for )(?:the )?([^,]+?)(?:recipe|dish)/i,
  ];
  
  // Returns extracted title or full request as fallback
};
```

Handles patterns like:
- "recipe titled X"
- "the X recipe"
- "from the X dish"
- "that X recipe"

#### 3. Action Queue Integration
```typescript
else if (contentLower.includes('let me add those recipe ingredients')) {
  pendingActionRef.current = {
    type: 'add_recipe_ingredients',
    data: userRequest
  };
}
```

#### 4. Frontend Processing
```typescript
const addRecipeIngredients = async (userRequest: string) => {
  // Extract recipe title
  const recipeTitle = extractRecipeTitle(userRequest);
  
  // Call backend API
  const response = await fetch('/api/ai-agent', {
    method: 'POST',
    body: JSON.stringify({
      action: 'add_recipe_ingredients',
      userRequest,
      recipeTitle,
      currentShoppingList,
      currentRecipes,
    }),
  });
  
  // Merge new items with existing cart
  // Only add items that don't already exist
};
```

### Backend Changes

#### New API Action: `add_recipe_ingredients`

**File**: `app/api/ai-agent/route.ts`

**Parameters**:
- `userRequest`: Full user request text
- `recipeTitle`: Extracted recipe title
- `currentShoppingList`: Current cart items
- `currentRecipes`: All available recipes

**Process**:
1. Find recipe by title (fuzzy match)
2. Extract recipe ingredients
3. Use Gemini to compare with current list
4. Add missing ingredients with quantity "1"
5. Return updated shopping list

```typescript
async function addRecipeIngredients(
  userRequest: string,
  recipeTitle: string,
  currentShoppingList: any[],
  currentRecipes: any[]
) {
  // Fuzzy match recipe by title
  const targetRecipe = currentRecipes.find(recipe => {
    const title = recipe.name.toLowerCase();
    const search = recipeTitle.toLowerCase();
    return title.includes(search) || search.includes(title);
  });
  
  // Get recipe ingredients
  const recipeIngredients = targetRecipe.ingredients;
  
  // Prompt Gemini to compare and add missing items
  const prompt = `
    Current list: ${currentListText}
    Recipe: "${recipeName}"
    Ingredients: ${recipeIngredients.join(', ')}
    
    Add missing ingredients with quantity "1"
    Use smart matching (chicken = chicken breast)
    Keep existing items unchanged
  `;
  
  // Return updated list
}
```

#### Gemini Prompt Strategy

**Smart Matching**:
- "chicken breast" matches "chicken"
- "tomato" matches "tomatoes"
- Case-insensitive comparison

**Rules**:
1. Keep ALL existing items (same quantity, price, name)
2. Add missing ingredients with quantity "1"
3. Don't duplicate existing items
4. Return complete updated list

### Default Quantity Changes

#### Initial Shopping List Generation
Updated prompt to always use quantity "1":

```typescript
const prompt = `
  ...
  IMPORTANT: 
  - Each item should have quantity: "1" (always use 1 as default)
  ...
`;
```

**Before**:
```json
[
  {"item": "Tofu", "quantity": "2", "estimatedPrice": 2.5},
  {"item": "Chicken", "quantity": "1", "estimatedPrice": 4}
]
```

**After**:
```json
[
  {"item": "Tofu", "quantity": "1", "estimatedPrice": 2.5},
  {"item": "Chicken", "quantity": "1", "estimatedPrice": 4}
]
```

Users can still adjust quantities through voice commands:
- "Give me more tofu" → increases quantity
- "I need 3 chickens" → updates quantity to 3

## Conversation Flow

### Complete Flow
```
1. User: "I like the green bean casserole recipe, add those ingredients"
2. Agent: "Let me add those recipe ingredients to your list."
3. → Action queued: 'add_recipe_ingredients'
4. → Agent finishes speaking (AgentAudioDone)
5. → Execute action: addRecipeIngredients(userRequest)
6. → Extract title: "green bean casserole"
7. → Find matching recipe in currentRecipes
8. → Call Gemini to compare ingredients
9. → Add missing items with quantity 1
10. → Update shopping list UI
11. → TTS: "Done! I added the recipe ingredients. Any other changes?"
```

### Error Handling

**Recipe Not Found**:
```
Backend: Returns current list unchanged
Frontend: No error shown, list stays the same
Agent: Still says "Done!" (graceful failure)
```

**Invalid Request**:
```
User: "Add ingredients from that recipe" (no specific recipe)
Backend: Tries fuzzy match, may fail
Frontend: List unchanged
```

## Benefits

### 1. Convenient Recipe Integration
Users can directly add recipe ingredients without manually listing them.

### 2. Smart Deduplication
System doesn't add items you already have.

### 3. Consistent Quantities
New ingredients always start with quantity 1 (can be adjusted later).

### 4. Natural Language
Works with various phrasings:
- "Add ingredients from X"
- "I want to make X, add those ingredients"
- "Make sure I have everything for X recipe"

### 5. No UI Clicking Required
Completely voice-driven workflow.

## Console Logs

### Successful Addition:
```
🎯 Recipe ingredients addition trigger detected! Queuing action...
🎯 User request to queue: I like the green bean casserole recipe...
✅ Agent finished speaking
🚀 Executing pending action: add_recipe_ingredients
🍳 Adding recipe ingredients based on: I like the green bean...
🍳 Extracted recipe title: green bean casserole
🍳 addRecipeIngredients called: {recipeTitle: "green bean casserole", ...}
✅ Found recipe: Green Bean Casserole
📄 Raw Gemini response: [...]
✅ Updated list with recipe ingredients: 13 items
💰 Total cost: $45.67
✅ Added new ingredient "Green Beans"
✅ Added new ingredient "Cream of Mushroom Soup"
📢 Done! I added the recipe ingredients. Any other changes?
```

### Recipe Not Found:
```
🍳 Extracted recipe title: mystery recipe
❌ Recipe not found: mystery recipe
✅ Shopping cart updated with 10 items (unchanged)
```

## Testing Checklist

- [x] Default quantity is 1 for initial generation
- [x] Can request ingredients from specific recipe
- [x] Existing items are not duplicated
- [x] New ingredients added with quantity 1
- [x] Recipe title extraction works with various phrasings
- [x] Fuzzy matching finds recipes
- [x] Prices are estimated for new ingredients
- [x] Total cost updates correctly
- [x] Agent provides clear feedback
- [x] Single feedback message (no duplicates)

## Agent Prompt Updates

**Added to all agent prompts**:

```
REFINEMENT TRIGGERS:
- If user wants ingredients from a specific recipe → 
  say EXACTLY: "Let me add those recipe ingredients to your list." 
  then STOP TALKING

RECIPE INGREDIENTS REQUEST:
- User will mention a specific recipe
- Say the trigger phrase and let system find and add ingredients
```

## Files Modified

1. **app/api/ai-agent/route.ts**
   - Added `add_recipe_ingredients` action to switch statement
   - Created `addRecipeIngredients()` function
   - Updated `generateShoppingList()` to use quantity "1"

2. **app/page.tsx**
   - Added trigger phrase detection for recipe ingredients
   - Created `addRecipeIngredients()` function
   - Created `extractRecipeTitle()` helper
   - Added to action execution switch
   - Updated agent prompts with new trigger
   - Added feedback message for recipe ingredients

## Future Enhancements

### Potential Improvements
1. **Recipe Selection by Number**: "Add ingredients from recipe #2"
2. **Partial Ingredients**: "Add just the produce from recipe X"
3. **Multiple Recipes**: "Add ingredients from recipes 1 and 3"
4. **Quantity Calculation**: "I want to make 2 servings, add ingredients"
5. **Substitutions**: "Add ingredients but substitute chicken for tofu"
6. **Visual Highlighting**: Highlight the recipe when user mentions it

### Voice Commands
Could support variations like:
- "I'm making the X, what else do I need?"
- "Add everything for the X recipe"
- "Get me the ingredients for X"
- "I picked the X recipe, add it to my list"

## Conclusion

The recipe ingredients feature provides a seamless voice-driven workflow for adding complete recipes to the shopping list. With smart deduplication and quantity management, users can build comprehensive shopping lists naturally through conversation.
