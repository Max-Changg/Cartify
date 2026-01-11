# Pause & Resume with Context Memory

## Overview
The AI agent now remembers where the conversation left off when you pause and resume, providing a seamless continuation experience.

## Features

### 1. Context-Aware Resume
When you unpause the conversation, the agent:
- **Remembers the last thing it said** and can repeat it
- **Knows if you already have a shopping list** and recipes
- **Continues the conversation naturally** without restarting from the beginning

### 2. Smart Greeting Logic
The agent chooses the appropriate greeting based on the state:

#### Fresh Start (Empty List)
```
Greeting: "Hello! Let's build your shopping list. First off, what are your health and fitness goals?"
Behavior: Asks initial questions to gather preferences
```

#### Resume with Context (Has List/Recipes)
```
Greeting: "I'm back! I was just saying: [last message]"
         OR
         "I'm back! How does the shopping list look? Would you like me to add or remove anything?"
Behavior: Continues helping refine the existing list
```

### 3. Conversation History Included
When resuming, the agent receives:
- Last 6 messages from the conversation
- Number of items in shopping list
- Number of recipes generated
- The exact last message it said before pausing

## How It Works

### State Tracking
```typescript
const lastAgentMessageRef = useRef<string>('');  // Last thing agent said
const conversationMessagesRef = useRef<ConversationMessage[]>([]);  // Full history
const connectionRef = useRef<any>(null);  // Connection reference
```

### Resume Logic
```typescript
const shouldResume = isResume && (cartItems.length > 0 || recipes.length > 0);

if (shouldResume) {
  // Use contextual greeting with last message
  greeting = `I'm back! I was just saying: ${lastAgentMessageRef.current}`;
  
  // Provide conversation history to agent
  const recentMessages = conversationMessagesRef.current.slice(-6);
  contextualPrompt = `...conversation context included...`;
}
```

### Message Tracking
Every time the agent speaks, we store it:
```typescript
if (data.role === 'assistant') {
  lastAgentMessageRef.current = content;
  console.log('📝 Stored agent message for resume:', content);
}
```

## User Experience

### Scenario 1: Pause During Initial Questions
```
Agent: "What are your health and fitness goals?"
User: [Pauses]
User: [Resumes]
Agent: "I'm back! I was just saying: What are your health and fitness goals?"
```

### Scenario 2: Pause After List Generated
```
Agent: "How does the shopping list look? Would you like me to add or remove anything?"
User: [Pauses]
User: [Resumes]
Agent: "I'm back! I was just saying: How does the shopping list look? Would you like me to add or remove anything?"
User: "Add chicken breast"
Agent: "Let me update your shopping list."
```

### Scenario 3: Pause Mid-Refinement
```
Agent: "Let me update your shopping list."
[List updates]
Agent: "How does the list look now? Any other changes?"
User: [Pauses]
User: [Resumes]
Agent: "I'm back! I was just saying: How does the list look now? Any other changes?"
```

### Scenario 4: Resume with Empty List (Restart)
```
User: [Clears list somehow]
User: [Resumes]
Agent: "Hello! Let's build your shopping list. First off, what are your health and fitness goals?"
[Starts fresh because list is empty]
```

## Technical Implementation

### Modified Functions

#### `startRecording(isResume: boolean = false)`
- Accepts `isResume` parameter to indicate resume mode
- Checks if list/recipes exist before deciding on greeting
- Builds contextual prompt with conversation history
- Configures agent with appropriate greeting and context

#### `handleMicClick()`
- Tracks whether this is a fresh start, resume, or pause
- Passes `isResume=true` when resuming from pause
- Passes `isResume=false` for fresh starts

#### Conversation Handler
- Captures and stores every agent message
- Updates `lastAgentMessageRef.current` for resume functionality

### Contextual Prompts

**Fresh Start Prompt:**
- Includes full initial conversation flow
- Asks for health goals and cuisine preferences
- Guides through first-time list generation

**Resume Prompt:**
- Acknowledges continuation
- Provides recent conversation context
- Focuses on refinement and feedback
- Skips initial questions

## Console Logs

### Fresh Start:
```
🎯 Agent mode: FRESH START
🎯 Greeting: Hello! Let's build your shopping list...
```

### Resume:
```
🎯 Agent mode: RESUMING
🎯 Greeting: I'm back! I was just saying: How does the list look?
```

## Benefits

1. **Seamless Experience**: No jarring restart when resuming
2. **Context Preservation**: Agent remembers what it was discussing
3. **Efficient**: Skip redundant questions when list exists
4. **Natural Flow**: Conversation continues as if never interrupted
5. **Smart Fallback**: Restarts properly if list is empty

## Edge Cases Handled

### Case 1: Pause Immediately After Start
```
If lastAgentMessageRef.current is empty:
  - Use default resume greeting
  - Ask about shopping list changes
```

### Case 2: Resume After Clearing List
```
If cartItems.length === 0 AND recipes.length === 0:
  - Treat as fresh start
  - Ask initial questions again
```

### Case 3: Multiple Pause/Resume Cycles
```
Each resume:
  - Uses the very last agent message
  - Includes most recent conversation history
  - Maintains continuity across multiple pauses
```

## Testing Scenarios

### Test 1: Pause and Resume Mid-Conversation
1. Start conversation
2. Answer first question
3. Agent asks second question
4. Pause
5. Resume
6. ✅ Agent should say: "I'm back! I was just saying: [second question]"

### Test 2: Pause After List Generated
1. Complete initial questions
2. Agent generates list
3. Agent asks for feedback
4. Pause
5. Resume
6. ✅ Agent should say: "I'm back! I was just saying: How does the list look?"

### Test 3: Resume with Empty List
1. Complete conversation
2. Clear shopping list and recipes (manually)
3. Pause
4. Resume
5. ✅ Agent should restart: "Hello! Let's build your shopping list..."

### Test 4: Multiple Refinements with Pauses
1. Generate list
2. Make changes
3. Pause
4. Resume
5. Make more changes
6. Pause again
7. Resume again
8. ✅ Agent maintains context throughout all pauses

## Files Modified

1. **app/page.tsx**
   - Added `lastAgentMessageRef` to track last agent message
   - Added `connectionRef` for connection management
   - Updated `startRecording()` to accept `isResume` parameter
   - Added context-aware greeting logic
   - Added conversation history inclusion for resume
   - Updated `handleMicClick()` to pass resume flag
   - Added agent message tracking in conversation handler
   - Clear last agent message on full stop

## Implementation Details

### Greeting Selection Logic
```typescript
const hasExistingList = cartItems.length > 0 || recipes.length > 0;
const shouldResume = isResume && hasExistingList;

if (shouldResume) {
  // Resume mode with context
  greeting = lastAgentMessageRef.current 
    ? `I'm back! I was just saying: ${lastAgentMessageRef.current}` 
    : "I'm back! How does the shopping list look?";
} else {
  // Fresh start mode
  greeting = "Hello! Let's build your shopping list...";
}
```

### Conversation Context Building
```typescript
const recentMessages = conversationMessagesRef.current.slice(-6);
const conversationContext = recentMessages.length > 0
  ? `\n\nRecent conversation:\n${recentMessages.map(m => 
      `${m.speaker === 'user' ? 'User' : 'Assistant'}: ${m.text}`
    ).join('\n')}`
  : '';
```

This gives the agent a detailed understanding of where the conversation left off.
