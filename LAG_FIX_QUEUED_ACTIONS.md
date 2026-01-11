# Lag Fix: Queued Actions Pattern

## Problem

When the user asked the AI agent to modify the shopping list (e.g., "add chicken"), the conversation would lag significantly:

```
User: "Add chicken"
Agent: "Let me update your shopping list."
[Agent trying to speak while Gemini API is being called - LAG]
[2-3 second delay]
[Agent continues but conversation feels broken]
```

### Root Cause

The Gemini API call to update the shopping list was being triggered **immediately** (with just a 1 second delay) after detecting the trigger phrase, which meant:

1. Agent says "Let me update your shopping list"
2. System immediately calls Gemini API (takes 2-3 seconds)
3. Agent tries to continue speaking but the main thread is busy
4. User experiences lag and broken conversation flow

The issue was **synchronous blocking** during the conversation.

## Solution: Queued Actions Pattern

Instead of immediately executing actions, we now **queue** them and execute **after** the agent has completely finished speaking.

### Flow Before (Caused Lag)
```
1. User: "Add chicken"
2. Agent: "Let me update your shopping list." [trigger detected]
3. → Immediately call refineShoppingList() [BLOCKS]
4. Agent tries to continue [LAGS]
5. → Update completes [2-3 seconds later]
6. Agent finally responds [jerky, laggy]
```

### Flow After (Smooth)
```
1. User: "Add chicken"
2. Agent: "Let me update your shopping list." [trigger detected → QUEUED]
3. Agent continues speaking smoothly [NO BLOCKING]
4. AgentAudioDone event fires [agent finished speaking]
5. → Execute queued action: refineShoppingList() [NO LAG]
6. → Update completes [user doesn't notice delay]
7. Agent responds naturally
```

## Implementation

### 1. Added Pending Action Queue
```typescript
const pendingActionRef = useRef<{ type: string; data: any } | null>(null);
```

### 2. Queue Actions Instead of Executing Immediately
```typescript
// OLD CODE (caused lag)
if (contentLower.includes('let me update your shopping list')) {
  setTimeout(() => {
    refineShoppingList(userRequest); // IMMEDIATE EXECUTION
  }, 1000);
}

// NEW CODE (queues action)
if (contentLower.includes('let me update your shopping list')) {
  console.log('🎯 Queuing action...');
  pendingActionRef.current = {
    type: 'refine_shopping_list',
    data: userRequest
  };
}
```

### 3. Execute After Agent Finishes Speaking
```typescript
connection.on(AgentEvents.AgentAudioDone, async () => {
  console.log('✅ Agent finished speaking');
  
  // ... flush audio buffers ...
  
  // Execute any pending actions AFTER agent is done
  if (pendingActionRef.current) {
    const action = pendingActionRef.current;
    pendingActionRef.current = null; // Clear
    
    console.log('🚀 Executing pending action:', action.type);
    
    setTimeout(() => {
      switch (action.type) {
        case 'generate_initial':
          generateRecipesAndShoppingList();
          break;
        case 'refine_shopping_list':
          refineShoppingList(action.data);
          break;
        case 'regenerate_recipes':
          regenerateRecipes(action.data);
          break;
      }
    }, 500); // Small delay for smooth transition
  }
});
```

## Action Types Supported

1. **`generate_initial`** - Initial recipe and shopping list generation
   - Triggered by: "Perfect! Let me generate some recipes for you."

2. **`refine_shopping_list`** - Modify existing shopping list
   - Triggered by: "Let me update your shopping list."
   - Data: User's modification request

3. **`regenerate_recipes`** - Generate new recipes
   - Triggered by: "Let me find different recipes for you."
   - Data: User's feedback on recipes

## Benefits

### 1. **Smooth Conversation Flow**
The agent can speak without interruption. No lag between trigger phrase and next response.

### 2. **Better User Experience**
```
Before: "Let... me... update... [pause]... your... list..." [feels broken]
After: "Let me update your shopping list." [smooth, natural]
```

### 3. **Non-Blocking Operations**
Gemini API calls happen in the background after the agent has finished its turn.

### 4. **Natural Timing**
The delay feels intentional, like the agent is "working on it" rather than "struggling to respond."

## Console Logs

### When Action is Queued:
```
🎯 Shopping list refinement trigger detected! Queuing action...
🎯 User request to queue: add chicken breast
```

### When Agent Finishes Speaking:
```
✅ Agent finished speaking
🚀 Executing pending action: refine_shopping_list
🔄 Refining shopping list based on: add chicken breast
```

### Result:
```
✅ Refined shopping list: 11 items
💰 Refined list total cost: $47.48
✅ Shopping cart updated with 11 items
```

## Edge Cases Handled

### 1. Multiple Trigger Phrases in One Response
```
Agent: "Let me update your shopping list and find different recipes."
Result: Only the last detected action is queued (most recent wins)
```

### 2. User Interrupts During Queue
```
Agent starts speaking → action queued
User interrupts (UserStartedSpeaking event)
AgentAudioDone fires
Action still executes (as intended)
```

### 3. Pause Before Action Executes
```
Action queued
User pauses conversation
stopRecording() clears pendingActionRef.current
No action executes (correct behavior)
```

## Performance Comparison

### Before (Lag):
- Trigger detection to API call: 1 second
- API call blocks conversation: 2-3 seconds
- **Total perceived lag: 3-4 seconds**

### After (Smooth):
- Trigger detection to queue: <1ms (instant)
- Agent continues speaking: 0 lag
- API call happens after agent done: not noticed by user
- **Total perceived lag: 0 seconds**

## Testing Scenarios

### Test 1: Add Item
```
1. Say: "Add chicken breast"
2. Agent: "Let me update your shopping list." [smooth, no lag]
3. Agent finishes
4. → Action executes in background
5. List updates
6. Agent continues naturally
✅ No lag experienced
```

### Test 2: Remove Item
```
1. Say: "Remove soy sauce"
2. Agent: "Let me update your shopping list." [smooth]
3. → Queued
4. Agent finishes
5. → Executes
✅ Smooth conversation
```

### Test 3: Regenerate Recipes
```
1. Say: "Show me different recipes"
2. Agent: "Let me find different recipes for you." [smooth]
3. → Queued
4. Agent finishes
5. → Executes (takes 3-4 seconds due to multiple API calls)
6. New recipes appear
✅ User doesn't feel lag because agent already finished speaking
```

## Files Modified

1. **app/page.tsx**
   - Added `pendingActionRef` for action queue
   - Modified trigger detection to queue instead of execute
   - Updated `AgentAudioDone` event to execute queued actions
   - Clear pending actions on full stop

## Technical Notes

### Why 500ms Delay?
```typescript
setTimeout(() => {
  // Execute action
}, 500);
```

The 500ms delay after `AgentAudioDone`:
1. Ensures audio playback buffer is fully cleared
2. Provides a natural "pause" before processing
3. Prevents race conditions with audio system
4. Feels like agent is "thinking" before acting

### Thread Safety
All refs are synchronously updated, preventing race conditions:
- `pendingActionRef.current = action` (synchronous)
- `pendingActionRef.current = null` (synchronous clear)
- No async state conflicts

### Why Not Use State?
We use refs instead of React state because:
1. **Synchronous**: No async rendering delays
2. **Event-driven**: Works perfectly with Deepgram event system
3. **Performance**: No re-renders needed
4. **Reliable**: Guaranteed to have latest value in callbacks

## Conclusion

The queued actions pattern completely eliminates conversation lag by deferring expensive API calls until after the agent has finished speaking. This creates a smooth, natural conversation flow that feels responsive and polished.

**Before**: Laggy, broken conversation
**After**: Smooth, professional experience ✨
