# 🚀 Quick Start - Voice Agent Shopping List

## 1. Setup (One-time)

Make sure your `.env.local` file has both API keys:

```bash
DEEPGRAM_API_KEY=your_deepgram_key_here
GEMINI_API_KEY=your_gemini_key_here
```

## 2. Start the App

The dev server should already be running. If not:

```bash
npm run dev
```

Visit: http://localhost:3000

## 3. Use the Voice Agent

### Step 1: Click the Microphone 🎤
Click the microphone button in the Voice Panel (left side).

### Step 2: Answer Two Questions

**Question 1**: "What are your health and fitness goals?"
- Example answers:
  - "I want to lose weight and eat healthier"
  - "Build muscle and gain weight"
  - "Just maintain a balanced diet"

**Question 2**: "What types of food do you like? Any cuisines, dishes, or ingredients in particular?"
- Example answers:
  - "I love Italian and Mediterranean food"
  - "Asian cuisine, especially Thai and Japanese"
  - "Vegetarian dishes with lots of vegetables"

### Step 3: Watch the Magic ✨

The agent will say: **"Perfect! Let me generate some recipes for you."**

Then automatically:
1. 🧪 Blue loading banner appears
2. 📋 4 personalized recipes populate in the center panel
3. 🛒 Shopping cart auto-fills with all ingredients
4. ✅ You can adjust quantities or remove items

### Step 4: Get Your Shopping List

- Click **"Export List"** to download a text file
- Or click **"Quick Purchase"** to copy to clipboard

## Expected Output

### Recipes (Center Panel)
You'll see 4 recipes tailored to your preferences, each with:
- Recipe name
- Cuisine type
- Servings & prep time
- Health benefits
- Full ingredient list

### Shopping Cart (Left Panel)
Automatically populated with:
- All ingredients from all 4 recipes
- Quantities consolidated (duplicates merged)
- Estimated prices
- Categorized by type (produce, protein, dairy, etc.)

## Troubleshooting

### Voice agent not connecting
- Check console: Should see "✅ Welcome to Deepgram Voice Agent!"
- Verify `DEEPGRAM_API_KEY` is set
- Grant microphone permissions

### Audio sounds bad
- **This should be fixed now!** Audio is configured at 16kHz with smoothing
- If still poor, check your internet connection
- Use Chrome or Edge for best audio quality
- Try using headphones to prevent echo

### No recipes generated
- Check console: Should see "🎯 Trigger detected!"
- Verify `GEMINI_API_KEY` is set
- Make sure you answered both questions

### Shopping cart empty
- Check console: Should see "✅ Shopping cart populated with X items"
- Check Network tab for `/api/ai-agent` responses

## Console Messages to Look For

✅ **Success indicators:**
```
✅ Got API key from backend
✅ Welcome to Deepgram Voice Agent!
✅ Agent configured!
🎤 Microphone access granted
📝 Captured health goals: [your answer]
📝 Captured cuisine preferences: [your answer]
🎯 Trigger detected! Generating recipes...
✅ Generated recipes: [4 recipes]
✅ Shopping cart populated with X items
```

## What's Happening Behind the Scenes

1. **Deepgram Voice Agent** (nova-3 + aura-2-thalia-en):
   - Listens to your voice
   - Speaks responses back to you
   - Manages natural conversation flow

2. **OpenAI GPT-4o-mini**:
   - Understands conversation context
   - Extracts your preferences
   - Decides when to trigger recipe generation

3. **Google Gemini 2.0 Flash**:
   - Generates 4 personalized recipes
   - Creates consolidated shopping list
   - Estimates quantities and prices

## Next Steps

- Adjust ingredient quantities
- Remove unwanted items
- Add more items manually
- Export your shopping list
- Happy cooking! 🍳

---

For detailed technical documentation, see [VOICE_AGENT_COMPLETE.md](./VOICE_AGENT_COMPLETE.md)
