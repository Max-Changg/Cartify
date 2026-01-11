# 🎤 Deepgram Voice Agent - Complete Integration

## Overview
The Cartify app now features a fully integrated Deepgram Voice Agent that helps users build personalized shopping lists and recipe recommendations through natural voice conversation.

## How It Works

### 1. **Voice Conversation Flow**
The agent follows this structured conversation:

1. **Greeting**: "Hello! Let's build your shopping list. First off, what are your health and fitness goals?"
2. **Health Goals**: User responds with their health/fitness objectives
3. **Cuisine Preferences**: "What types of food do you like? Any cuisines, dishes, or ingredients in particular?"
4. **Recipe Generation**: Once both pieces of information are collected, the agent says "Perfect! Let me generate some recipes for you."

### 2. **Automatic Recipe & Shopping List Generation**

When the trigger phrase is detected, the system:

1. **Extracts preferences** from the conversation:
   - Health goals (e.g., "lose weight", "gain muscle", "eat healthy")
   - Cuisine preferences (e.g., "Italian", "Asian fusion", "vegetarian")

2. **Generates 4 personalized recipes** using Claude AI (via `/api/ai-agent`):
   - Matched to health goals
   - Based on cuisine preferences
   - Includes ingredients, prep time, and health benefits

3. **Creates shopping list** from recipe ingredients:
   - Consolidates duplicate ingredients
   - Estimates quantities
   - Provides price estimates
   - Categorizes items (produce, protein, dairy, pantry, other)

4. **Populates the UI**:
   - Recipes appear in the center panel
   - Shopping cart auto-fills with all ingredients
   - User can adjust quantities or remove items

### 3. **Technology Stack**

- **Voice Input/Output**: Deepgram Voice Agent API (via SDK)
  - STT Model: `nova-3`
  - TTS Model: `aura-2-thalia-en`
  - Sample Rate: 16kHz (optimized for speech)
  - Real-time bidirectional streaming
  - Audio smoothing with fade-in/fade-out
  
- **Conversation AI**: OpenAI GPT-4o-mini
  - Manages conversation flow
  - Extracts user preferences
  - Triggers recipe generation

- **Recipe Generation**: Google Gemini 2.0 Flash
  - Generates personalized recipes
  - Creates consolidated shopping lists
  - Handles dietary restrictions

## Key Files

### Frontend
- **`app/page.tsx`**: Main integration
  - Deepgram SDK client setup
  - Voice streaming (PCM16 audio)
  - Conversation tracking
  - UI state management
  - Automatic recipe generation trigger

### Backend APIs
- **`app/api/ai-agent/connect/route.ts`**: Returns Deepgram API key
- **`app/api/ai-agent/route.ts`**: Recipe & shopping list generation
  - `generate_recipes`: Creates 4 personalized recipes
  - `generate_shopping_list`: Consolidates ingredients
  - `extract_exclusions`: Handles dietary restrictions

## Environment Variables Required

```bash
# Required for voice agent
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Required for recipe generation
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

1. **Click the microphone button** in the Voice Panel
2. **Answer the agent's questions**:
   - First: Your health/fitness goals
   - Second: Your cuisine preferences
3. **Wait for recipe generation** (indicated by blue loading banner)
4. **Review recipes** in the center panel
5. **Check shopping cart** - all ingredients are added automatically
6. **Adjust quantities** or remove unwanted items
7. **Export or purchase** your shopping list

## Features

### ✅ Implemented
- [x] Real-time voice conversation with Deepgram Agent
- [x] Natural language understanding via GPT-4o-mini
- [x] Automatic preference extraction from conversation
- [x] Personalized recipe generation (4 recipes)
- [x] Consolidated shopping list creation
- [x] Auto-population of shopping cart
- [x] Visual feedback during generation
- [x] Audio playback of agent responses
- [x] Conversation transcript display

### 🚀 Future Enhancements
- [ ] Add dietary restriction handling (allergies, vegan, etc.)
- [ ] Recipe customization (servings, prep time)
- [ ] Integration with Weee! API for real prices
- [ ] Save favorite recipes
- [ ] Regenerate specific recipes
- [ ] Voice commands for cart management

## Architecture

```
User Voice Input
    ↓
Deepgram Voice Agent (nova-3 STT)
    ↓
OpenAI GPT-4o-mini (conversation management)
    ↓
Preference Extraction (health goals, cuisine)
    ↓
Trigger Detection ("let me generate some recipes")
    ↓
Google Gemini 2.0 Flash (recipe generation)
    ↓
Shopping List Consolidation
    ↓
UI Update (recipes + cart)
    ↓
Deepgram TTS (aura-2-thalia-en)
    ↓
User Hears Response
```

## Debugging

Check browser console for:
- `✅ Welcome to Deepgram Voice Agent!` - Connection successful
- `📝 Captured health goals:` - First preference captured
- `📝 Captured cuisine preferences:` - Second preference captured
- `🎯 Trigger detected!` - Recipe generation triggered
- `✅ Generated recipes:` - Recipes received from API
- `✅ Shopping cart populated with X items` - Cart updated

## Audio Quality

The system is configured for optimal voice quality:

- **16kHz sample rate** - Industry standard for speech
- **Automatic resampling** - Browser upsamples to 48kHz for playback
- **Audio smoothing** - 5ms fade-in/fade-out prevents clicks
- **Echo cancellation** - Built-in noise reduction
- **Auto gain control** - Consistent volume levels

For detailed audio configuration, see [AUDIO_QUALITY_FIX.md](./AUDIO_QUALITY_FIX.md)

## Troubleshooting

### Voice agent not connecting
- Verify `DEEPGRAM_API_KEY` is set in `.env.local`
- Check browser console for connection errors
- Ensure microphone permissions are granted

### Recipes not generating
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Check that trigger phrase is detected in console
- Ensure both health goals and cuisine preferences are captured

### Shopping cart empty
- Check console for shopping list generation logs
- Verify recipe format matches expected structure
- Check network tab for API response errors

## API Endpoints

### POST `/api/ai-agent`
Generates recipes and shopping lists.

**Request Body:**
```json
{
  "action": "generate_recipes",
  "healthGoals": "lose weight and eat healthy",
  "cuisinePreferences": "Italian and Mediterranean",
  "excludedItems": []
}
```

**Response:**
```json
{
  "recipes": [
    {
      "name": "Grilled Chicken Pesto Pasta",
      "cuisine": "Italian",
      "servings": 4,
      "prepTime": "30 mins",
      "healthBenefits": "High protein, balanced carbs",
      "ingredients": ["chicken breast", "penne pasta", "basil pesto", "cherry tomatoes"]
    }
  ]
}
```

### POST `/api/ai-agent/connect`
Returns Deepgram API key for SDK initialization.

**Response:**
```json
{
  "deepgramKey": "your_api_key"
}
```

## Credits

- **Deepgram Voice Agent API**: Real-time voice interaction
- **OpenAI GPT-4o-mini**: Conversation management
- **Google Gemini 2.0 Flash**: Recipe generation
- **Next.js**: Framework
- **React**: UI library
- **TypeScript**: Type safety

---

**Last Updated**: January 11, 2026
**Status**: ✅ Fully Functional
