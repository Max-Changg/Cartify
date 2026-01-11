# AI Agent Integration - Using Original UI

## How It Works

The AI agent has been integrated directly into your existing voice button workflow. **No UI changes** - the same mic button you used before now powers the AI agent conversational flow.

## Flow

### 1. First Voice Input - Health Goals
- Click the microphone button
- Say your health goals (e.g., "I want low carb meals for weight loss")
- The transcript will show your voice input
- System will prompt: "Great! Now please say what cuisines or foods you like."

### 2. Second Voice Input - Cuisine Preferences
- Click the microphone button again
- Say your cuisine preferences (e.g., "Asian and Mediterranean")
- AI Agent will:
  - Generate 4 personalized recipes
  - Create a consolidated shopping list
  - Display everything in the existing recipe and cart panels

### 3. Subsequent Voice Inputs - Modifications
After recipes are generated, you can continue using voice to:

**Remove ingredients:**
- Say: "Remove onions" or "I don't want garlic"
- AI will regenerate recipes without those items

**Regenerate recipes:**
- Say: "Give me new recipes" or "I want different options"
- AI will create fresh recipes with your same preferences

## Technical Integration

### Voice Flow + AI Agent
```
User clicks mic → Records audio → Transcribes with Deepgram
    ↓
No health goals yet? → Save as health goals → Prompt for cuisine
    ↓
No cuisine yet? → Save cuisine → Generate recipes via Claude API
    ↓
Already have both? → Check for modification commands → Regenerate as needed
```

### API Endpoints Used
- `/api/voice/transcribe` - Deepgram speech-to-text
- `/api/ai-agent` with actions:
  - `generate_recipes` - Creates personalized recipes
  - `generate_shopping_list` - Consolidates ingredients
  - `extract_exclusions` - Identifies unwanted items

## State Management

The app tracks:
- `healthGoals` - User's health objectives (from first voice input)
- `cuisinePreferences` - Preferred food types (from second voice input)
- `excludedItems` - Array of ingredients to avoid
- `recipes` - Generated recipe list (displayed in center panel)
- `cartItems` - Shopping list (displayed in left panel)

## User Experience

✅ **Same UI** - Original mic button and layout
✅ **Multi-step conversation** - Guides user through preferences
✅ **Smart modifications** - Understands "remove" and "regenerate" commands
✅ **Persistent preferences** - Remembers goals throughout session
✅ **Visual feedback** - Uses existing success/processing states

## Example Session

1. **User clicks mic** → Says: "I need high protein low carb meals"
2. **System** → Shows: "Great! Now please say what cuisines or foods you like."
3. **User clicks mic** → Says: "Italian and Asian food"
4. **System** → Generates 4 recipes → Displays in recipe panel → Creates shopping list → Shows in cart
5. **User clicks mic** → Says: "Remove all dairy products"
6. **System** → Regenerates recipes without dairy → Updates cart
7. **User clicks mic** → Says: "Give me different recipes"
8. **System** → Creates new recipes (still high protein, low carb, Italian/Asian, no dairy)

## Key Differences from Original Flow

| Before | Now |
|--------|-----|
| Single voice input | Multi-turn conversation |
| Direct item recognition | Preference-based generation |
| Static recipes | AI-generated personalized recipes |
| Manual list creation | Automatic list consolidation |

## Environment Setup

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DEEPGRAM_API_KEY=your-deepgram-key-here
```

## That's It!

The AI agent is fully integrated into your existing UI. Just start talking!
