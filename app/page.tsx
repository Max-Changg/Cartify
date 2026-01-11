'use client';

import { AgentEvents, createClient } from '@deepgram/sdk';
import { Mic } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RecipePanel } from './components/RecipePanel';
import { ShoppingCartPanel } from './components/ShoppingCartPanel';
import { Header } from './components/ui/Header';
import { VoicePanel } from './components/VoicePanel';
import type { CartItem, ConversationMessage, MicrophoneState, Recipe } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Backend interfaces
interface BackendShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  estimated_price?: number;
  unit?: string;
  in_cart: boolean;
}

interface BackendRecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  in_shopping_list: boolean;
}

interface BackendRecipe {
  id: number;
  title: string;
  image?: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string;
  ingredients?: BackendRecipeIngredient[];
  used_ingredients_count?: number;
  missing_ingredients_count?: number;
}

interface ShoppingListResponse {
  items: BackendShoppingItem[];
  total_estimated_cost: number;
  recipes: BackendRecipe[];
  user_goals?: {
    health_preferences?: string[];
    dietary_restrictions?: string[];
    budget?: number;
    timeframe?: string;
  };
}

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [micState, setMicState] = useState<MicrophoneState>('idle');
  const [transcription, setTranscription] = useState('');
  const [timer, setTimer] = useState(30);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('disconnected');
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // AI Agent state
  const [healthGoals, setHealthGoals] = useState('');
  const [cuisinePreferences, setCuisinePreferences] = useState('');
  const [excludedItems, setExcludedItems] = useState<string[]>([]);
  const [conversationTranscript, setConversationTranscript] = useState<string>('');
  const [hasGeneratedInitialList, setHasGeneratedInitialList] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const agentWsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const healthGoalsRef = useRef<string>('');
  const cuisinePreferencesRef = useRef<string>('');
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const isAgentSpeakingRef = useRef<boolean>(false);
  const audioChunkBufferRef = useRef<Uint8Array[]>([]);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const currentRecipesRef = useRef<any[]>([]);
  const currentShoppingListRef = useRef<CartItem[]>([]);
  const conversationMessagesRef = useRef<ConversationMessage[]>([]);
  const lastUserRequestRef = useRef<string>('');

  useEffect(() => {
    // Check backend health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setBackendStatus(data.status);
      })
      .catch(() => {
        setBackendStatus('disconnected');
      });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Convert backend shopping items to frontend cart items
  const convertToCartItems = (items: BackendShoppingItem[]): CartItem[] => {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: parseInt(item.quantity || '1'),
      price: item.estimated_price || 0,
      enabled: item.in_cart,
      brand: undefined
    }));
  };

  // Convert backend recipes to frontend recipes
  const convertToRecipes = (backendRecipes: BackendRecipe[]): Recipe[] => {
    return backendRecipes.map(recipe => {
      // Calculate match percentage
      const totalIngredients = (recipe.used_ingredients_count || 0) + (recipe.missing_ingredients_count || 0);
      const matchPercentage = totalIngredients > 0 
        ? Math.round(((recipe.used_ingredients_count || 0) / totalIngredients) * 100)
        : 0;

      // Determine category based on title
      const titleLower = recipe.title.toLowerCase();
      let category = 'dinner';
      if (titleLower.includes('breakfast') || titleLower.includes('pancake') || titleLower.includes('waffle') || titleLower.includes('oatmeal')) {
        category = 'breakfast';
      } else if (titleLower.includes('salad') || titleLower.includes('soup') || titleLower.includes('lunch')) {
        category = 'lunch';
      } else if (titleLower.includes('dessert') || titleLower.includes('cake') || titleLower.includes('cookie')) {
        category = 'dessert';
      }

      // Determine difficulty based on prep time
      let difficulty = 'Easy';
      if (recipe.readyInMinutes > 45) {
        difficulty = 'Hard';
      } else if (recipe.readyInMinutes > 25) {
        difficulty = 'Medium';
      }

      // Convert ingredients to string array
      const ingredientStrings = recipe.ingredients?.map(ing => 
        `${ing.amount} ${ing.unit} ${ing.name}`
      ) || [];

      // Generate simple steps
      const steps = [
        `Gather all ingredients: ${ingredientStrings.slice(0, 3).join(', ')}`,
        'Follow the recipe instructions for preparation',
        `Cook for approximately ${recipe.readyInMinutes} minutes`,
        `Serves ${recipe.servings} people`,
        'Enjoy your meal!'
      ];

      return {
        id: recipe.id.toString(),
        title: recipe.title,
        image: recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        prepTime: `${recipe.readyInMinutes} min`,
        difficulty,
        matchPercentage,
        category,
        ingredients: ingredientStrings,
        steps
      };
    });
  };

  const flushAudioBuffer = async () => {
    if (audioChunkBufferRef.current.length === 0) return;
    
    // Calculate total size of accumulated chunks
    const totalSize = audioChunkBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log('  - Flushing', audioChunkBufferRef.current.length, 'chunks (', totalSize, 'bytes)');
    
    // Combine chunks into single buffer
    const combinedPcm = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of audioChunkBufferRef.current) {
      combinedPcm.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Clear the buffer (we've taken these chunks)
    audioChunkBufferRef.current = [];
    
    // Create WAV file and decode
    await playAgentAudio(combinedPcm.buffer);
  };

  const refineShoppingList = async (userRequest: string) => {
    if (isGeneratingRecipes) {
      console.log('⚠️ Already generating, skipping refinement');
      return;
    }
    
    setIsGeneratingRecipes(true);
    console.log('🔄 Refining shopping list based on:', userRequest);
    console.log('🔄 Current shopping list:', currentShoppingListRef.current);
    console.log('🔄 Current recipes:', currentRecipesRef.current);

    try {
      // Call the new refine_shopping_list action
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_shopping_list',
          userRequest: userRequest,
          currentShoppingList: currentShoppingListRef.current,
          currentRecipes: currentRecipesRef.current,
          healthGoals: healthGoalsRef.current,
          cuisinePreferences: cuisinePreferencesRef.current,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API error:', errorData);
        throw new Error(errorData.detail || 'Failed to refine shopping list');
      }

      const { shopping_list } = await response.json();
      console.log('✅ Refined shopping list:', shopping_list);

      // Convert to CartItem format and update cart
      const newCartItems: CartItem[] = (Array.isArray(shopping_list) ? shopping_list : []).map((item: any, index: number) => ({
        id: `cart-${Date.now()}-${index}`,
        name: item.item || item.name || 'Unknown Item',
        quantity: 1,
        price: item.estimatedPrice || item.price || 0,
        enabled: true,
        brand: item.brand,
      }));

      if (newCartItems.length > 0) {
        setCartItems(newCartItems);
        currentShoppingListRef.current = newCartItems;
        console.log('✅ Shopping cart updated with', newCartItems.length, 'items');
      }

      setIsGeneratingRecipes(false);
    } catch (error: any) {
      console.error('❌ Error refining shopping list:', error);
      setError('Failed to refine shopping list: ' + error.message);
      setIsGeneratingRecipes(false);
    }
  };

  const regenerateRecipes = async (userRequest: string) => {
    if (isGeneratingRecipes) return;
    
    setIsGeneratingRecipes(true);
    console.log('🔄 Regenerating recipes based on:', userRequest);

    try {
      // Call the regenerate_recipes action
      const recipesResponse = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_recipes',
          userRequest: userRequest,
          currentRecipes: currentRecipesRef.current,
          healthGoals: healthGoalsRef.current,
          cuisinePreferences: cuisinePreferencesRef.current,
          excludedItems: excludedItems,
        }),
      });

      if (!recipesResponse.ok) {
        throw new Error('Failed to regenerate recipes');
      }

      const { recipes } = await recipesResponse.json();
      console.log('✅ Regenerated recipes:', recipes);

      // Convert to Recipe format expected by UI (same logic as before)
      const formattedRecipes: Recipe[] = recipes.map((r: any, index: number) => {
        const ingredientStrings = (r.ingredients || []).map((ing: any) => {
          if (typeof ing === 'string') {
            return ing;
          }
          const amount = ing.amount || '1';
          const unit = ing.unit || '';
          const name = ing.name || ing.item || '';
          return `${amount} ${unit} ${name}`.trim();
        });
        
        const recipeName = (r.name || r.title || '').toLowerCase();
        let category = 'dinner';
        
        if (r.mealType && ['breakfast', 'lunch', 'dinner', 'dessert'].includes(r.mealType.toLowerCase())) {
          category = r.mealType.toLowerCase();
        } else if (recipeName.includes('breakfast') || recipeName.includes('pancake') || recipeName.includes('waffle') || 
            recipeName.includes('oatmeal') || recipeName.includes('cereal') || recipeName.includes('toast') ||
            recipeName.includes('egg') || recipeName.includes('bacon') || recipeName.includes('smoothie') ||
            recipeName.includes('muffin') || recipeName.includes('bagel')) {
          category = 'breakfast';
        } else if (recipeName.includes('lunch') || recipeName.includes('sandwich') || recipeName.includes('wrap') ||
                   recipeName.includes('salad') || recipeName.includes('soup') || recipeName.includes('bowl')) {
          category = 'lunch';
        } else if (recipeName.includes('dessert') || recipeName.includes('cake') || recipeName.includes('cookie') ||
                   recipeName.includes('pie') || recipeName.includes('ice cream') || recipeName.includes('pudding') ||
                   recipeName.includes('brownie') || recipeName.includes('tart')) {
          category = 'dessert';
        } else if (r.cuisine) {
          const cuisineLower = r.cuisine.toLowerCase();
          if (['breakfast', 'lunch', 'dinner', 'dessert'].includes(cuisineLower)) {
            category = cuisineLower;
          }
        }
        
        return {
          id: `recipe-${Date.now()}-${index}`,
          title: r.name || r.title,
          image: r.image || `https://source.unsplash.com/800x600/?${encodeURIComponent((r.name || r.title) + ' food')}`,
          prepTime: r.prepTime || '30 mins',
          difficulty: 'Medium',
          matchPercentage: 100,
          category: category,
          ingredients: ingredientStrings,
          steps: [
            `Prepare ingredients: ${ingredientStrings.slice(0, 3).join(', ')}`,
            'Follow the recipe instructions',
            `Cook for ${r.prepTime || '30 mins'}`,
            `Serves ${r.servings || 4} people`,
            'Enjoy!'
          ],
        };
      });

      setRecipes(formattedRecipes);
      currentRecipesRef.current = recipes;

      // Also regenerate shopping list with new recipes
      const shoppingResponse = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_shopping_list',
          currentRecipes: recipes,
        }),
      });

      if (shoppingResponse.ok) {
        const responseData = await shoppingResponse.json();
        const shopping_list = responseData.shopping_list || [];
        
        const newCartItems: CartItem[] = (Array.isArray(shopping_list) ? shopping_list : []).map((item: any, index: number) => ({
          id: `cart-${Date.now()}-${index}`,
          name: item.item || item.name || 'Unknown Item',
          quantity: 1,
          price: item.estimatedPrice || item.price || 0,
          enabled: true,
          brand: item.brand,
        }));

        if (newCartItems.length > 0) {
          setCartItems(newCartItems);
          currentShoppingListRef.current = newCartItems;
          console.log('✅ Shopping cart updated with', newCartItems.length, 'items');
        }
      }

      setIsGeneratingRecipes(false);
    } catch (error: any) {
      console.error('❌ Error regenerating recipes:', error);
      setError('Failed to regenerate recipes: ' + error.message);
      setIsGeneratingRecipes(false);
    }
  };

  const generateRecipesAndShoppingList = async () => {
    if (isGeneratingRecipes) return; // Prevent duplicate calls
    
    setIsGeneratingRecipes(true);
    console.log('🧪 Generating recipes and shopping list...');
    console.log('Health goals:', healthGoalsRef.current);
    console.log('Cuisine preferences:', cuisinePreferencesRef.current);

    try {
      // Step 1: Generate recipes
      const recipesResponse = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_recipes',
          healthGoals: healthGoalsRef.current,
          cuisinePreferences: cuisinePreferencesRef.current,
          excludedItems: excludedItems,
        }),
      });

      if (!recipesResponse.ok) {
        throw new Error('Failed to generate recipes');
      }

      const { recipes } = await recipesResponse.json();
      console.log('✅ Generated recipes:', recipes);
      
      // Store raw recipes for future refinement
      currentRecipesRef.current = recipes;

      // Convert to Recipe format expected by UI
      const formattedRecipes: Recipe[] = recipes.map((r: any, index: number) => {
        // Handle ingredients - can be array of strings or objects
        const ingredientStrings = (r.ingredients || []).map((ing: any) => {
          if (typeof ing === 'string') {
            return ing;
          }
          // Handle object format
          const amount = ing.amount || '1';
          const unit = ing.unit || '';
          const name = ing.name || ing.item || '';
          return `${amount} ${unit} ${name}`.trim();
        });
        
        // Determine category based on mealType from API, recipe name, or cuisine
        const recipeName = (r.name || r.title || '').toLowerCase();
        let category = 'dinner'; // default
        
        // First, check if API provided mealType
        if (r.mealType && ['breakfast', 'lunch', 'dinner', 'dessert'].includes(r.mealType.toLowerCase())) {
          category = r.mealType.toLowerCase();
        } else if (recipeName.includes('breakfast') || recipeName.includes('pancake') || recipeName.includes('waffle') || 
            recipeName.includes('oatmeal') || recipeName.includes('cereal') || recipeName.includes('toast') ||
            recipeName.includes('egg') || recipeName.includes('bacon') || recipeName.includes('smoothie') ||
            recipeName.includes('muffin') || recipeName.includes('bagel')) {
          category = 'breakfast';
        } else if (recipeName.includes('lunch') || recipeName.includes('sandwich') || recipeName.includes('wrap') ||
                   recipeName.includes('salad') || recipeName.includes('soup') || recipeName.includes('bowl')) {
          category = 'lunch';
        } else if (recipeName.includes('dessert') || recipeName.includes('cake') || recipeName.includes('cookie') ||
                   recipeName.includes('pie') || recipeName.includes('ice cream') || recipeName.includes('pudding') ||
                   recipeName.includes('brownie') || recipeName.includes('tart')) {
          category = 'dessert';
        } else if (r.cuisine) {
          // Use cuisine as fallback if it matches a category
          const cuisineLower = r.cuisine.toLowerCase();
          if (['breakfast', 'lunch', 'dinner', 'dessert'].includes(cuisineLower)) {
            category = cuisineLower;
          }
        }
        
        return {
          id: `recipe-${Date.now()}-${index}`,
          title: r.name || r.title, // RecipePanel expects 'title'
          image: r.image || `https://source.unsplash.com/800x600/?${encodeURIComponent((r.name || r.title) + ' food')}`,
          prepTime: r.prepTime || '30 mins',
          difficulty: 'Medium', // Default difficulty
          matchPercentage: 100, // Default match
          category: category,
          ingredients: ingredientStrings,
          steps: [
            `Prepare ingredients: ${ingredientStrings.slice(0, 3).join(', ')}`,
            'Follow the recipe instructions',
            `Cook for ${r.prepTime || '30 mins'}`,
            `Serves ${r.servings || 4} people`,
            'Enjoy!'
          ],
        };
      });

      setRecipes(formattedRecipes);

      // Step 2: Generate shopping list from recipes
      const shoppingResponse = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_shopping_list',
          currentRecipes: recipes,
        }),
      });

      if (!shoppingResponse.ok) {
        throw new Error('Failed to generate shopping list');
      }

      const responseData = await shoppingResponse.json();
      const shopping_list = responseData.shopping_list || [];
      
      if (!Array.isArray(shopping_list)) {
        console.warn('Shopping list is not an array:', responseData);
      }
      
      console.log('✅ Generated shopping list:', shopping_list);

      // Convert to CartItem format and add to cart
      const newCartItems: CartItem[] = (Array.isArray(shopping_list) ? shopping_list : []).map((item: any, index: number) => ({
        id: `cart-${Date.now()}-${index}`,
        name: item.item || item.name || 'Unknown Item',
        quantity: 1, // CartItem uses 'quantity'
        price: item.estimatedPrice || item.price || 0,
        enabled: true,
        brand: item.brand,
      }));

      if (newCartItems.length > 0) {
        setCartItems(newCartItems);
        currentShoppingListRef.current = newCartItems;
        setHasGeneratedInitialList(true);
        console.log('✅ Shopping cart populated with', newCartItems.length, 'items');
      } else {
        console.warn('⚠️ No items to add to cart');
        setError('No items were generated for the shopping list. Please try again.');
      }

      setIsGeneratingRecipes(false);
    } catch (error: any) {
      console.error('❌ Error generating recipes:', error);
      setError('Failed to generate recipes: ' + error.message);
      setIsGeneratingRecipes(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported');
      }

      setMicState('listening');
      setError(null);
      recordingStartTimeRef.current = Date.now();

      // Get API key from backend
      console.log('Getting API key from backend...');
      const connectResponse = await fetch('/api/ai-agent/connect', {
        method: 'POST',
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get agent connection info');
      }

      const { deepgramKey } = await connectResponse.json();
      console.log('✅ Got API key from backend');

      // Use Deepgram SDK as documented
      // Reference: https://developers.deepgram.com/docs/voice-agent
      console.log('Creating Deepgram client...');
      const deepgram = createClient(deepgramKey);
      const connection = deepgram.agent();
      
      // Store connection reference for cleanup
      agentWsRef.current = connection as any;

      // Initialize AudioContext for playing agent responses
      // Use default sample rate (usually 48000) and let browser handle resampling
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        console.log('🔊 AudioContext created with sample rate:', audioContextRef.current.sampleRate);
      }

      // Handle Welcome event - configure agent after connection opens
      connection.on(AgentEvents.Welcome, async () => {
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ WELCOME TO DEEPGRAM VOICE AGENT');
        console.log('='.repeat(60));
        
        // Configure the agent as per Deepgram documentation
        // https://developers.deepgram.com/docs/voice-agent-audio-playback
        connection.configure({
          audio: {
            input: {
              encoding: "linear16",
              sample_rate: 16000,
            },
            output: {
              encoding: "linear16",
              sample_rate: 16000,
              container: "none",  // Per docs: TTS WebSocket doesn't support containerized formats
            },
          },
          agent: {
            language: "en",
            listen: {
              provider: {
                type: "deepgram",
                model: "nova-3",
              },
            },
            think: {
              provider: {
                type: "open_ai",
                model: "gpt-4o-mini",
              },
              prompt: `You are a virtual assistant for helping build a shopping list based on health goals and food preferences.

INITIAL CONVERSATION:
1. First ask: "What are your health and fitness goals?" and listen for their response
2. Then ask: "What types of food do you like? Any cuisines, dishes, or ingredients in particular?" and listen for their response
3. Once you have BOTH pieces of information, say EXACTLY: "Perfect! Let me generate some recipes for you."

FEEDBACK LOOP (after generation or modification):
4. ALWAYS ask for feedback after the list updates: "How does the shopping list look? Would you like me to add or remove anything?"
5. Listen for their response:
   - If they want changes → acknowledge and say the appropriate trigger phrase (see below)
   - If they say "everything looks good" / "looks great" / "that's perfect" / "I'm happy with it" → say EXACTLY: "Great! When you're ready, click the purchase button and I'll fill in your cart for you."
   - If unclear → ask a clarifying question

REFINEMENT TRIGGERS:
- If user wants to modify shopping list (e.g., "add more protein", "remove soy sauce", "I already have X") → say EXACTLY: "Let me update your shopping list." THEN after update, ask again: "How does the list look now? Any other changes?"
- If user wants different recipes (e.g., "show me different recipes", "I don't like these") → say EXACTLY: "Let me find different recipes for you." THEN after update, ask again: "How does everything look? Would you like any changes?"

FINAL CONFIRMATION:
- Only when user explicitly indicates they're happy with the list (e.g., "looks good", "perfect", "I'm done"), say the purchase button message
- DO NOT move to purchase until user confirms they're satisfied

Keep responses short (1-2 sentences). Be warm and conversational.

CRITICAL TRIGGER PHRASES (say these EXACTLY):
- "Perfect! Let me generate some recipes for you." = Initial generation
- "Let me update your shopping list." = Modify shopping list
- "Let me find different recipes for you." = Regenerate recipes
- "Great! When you're ready, click the purchase button and I'll fill in your cart for you." = User is done, ready for checkout`,
            },
            speak: {
              provider: {
                type: "deepgram",
                model: "aura-2-thalia-en",
              },
            },
            greeting: "Hello! Let's build your shopping list. First off, what are your health and fitness goals?",
          },
        });

        console.log('✅ Agent configured!');

        // Start microphone streaming after configuration
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 16000,
              channelCount: 1,
              echoCancellation: true,  // Per docs: helps prevent agent from hearing itself
              noiseSuppression: true,
              autoGainControl: true,
            }
          });

          console.log('🎤 Microphone access granted');

          // Use Web Audio API to capture PCM16 audio at 16kHz (standard for voice)
          const micAudioContext = new AudioContext({ sampleRate: 16000 });
          const source = micAudioContext.createMediaStreamSource(stream);
          const processor = micAudioContext.createScriptProcessor(2048, 1, 1);

          source.connect(processor);
          processor.connect(micAudioContext.destination);

          processor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            
            // Convert Float32 to Int16 (PCM16)
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Send PCM16 data to Deepgram via SDK (as ArrayBuffer)
            connection.send(pcm16.buffer as ArrayBuffer);
          };

          // Store for cleanup
          mediaRecorderRef.current = {
            stop: () => {
              processor.disconnect();
              source.disconnect();
              // Check if AudioContext is not already closed before closing
              if (micAudioContext.state !== 'closed') {
                micAudioContext.close().catch(err => {
                  console.warn('Error closing mic AudioContext:', err);
                });
              }
              stream.getTracks().forEach(track => track.stop());
            },
            stream,
            state: 'recording'
          } as any;

          console.log('📡 Streaming audio to agent...');
        } catch (micError: any) {
          console.error('❌ Microphone access error:', micError);
          setError('Microphone access denied');
          setMicState('idle');
        }
      });

      // Handle connection open
      connection.on(AgentEvents.Open, () => {
        console.log('🔌 Connection opened');
      });

      // Handle settings applied - CRITICAL for audio quality verification
      connection.on(AgentEvents.SettingsApplied, (data: any) => {
        console.log('✅ Settings Applied:', data);
        console.log('  - Audio input:', data?.audio?.input);
        console.log('  - Audio output:', data?.audio?.output);
      });

      // Handle audio from agent - streaming approach for low latency
      connection.on(AgentEvents.Audio, (data: any) => {
        // Don't process audio if paused
        if (isPausedRef.current) return;
        
        const size = data?.byteLength || data?.length || 0;
        console.log('🔊 Audio chunk received:', size, 'bytes');
        
        // Convert to Uint8Array for accumulation
        let chunkData: Uint8Array;
        if (data instanceof Uint8Array) {
          chunkData = data;
        } else if (data instanceof ArrayBuffer) {
          chunkData = new Uint8Array(data);
        } else if (data?.buffer) {
          chunkData = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else {
          console.warn('⚠️ Unknown audio data type:', typeof data);
          return;
        }
        
        // Accumulate chunks
        audioChunkBufferRef.current.push(chunkData);
        console.log('  - Accumulated chunks:', audioChunkBufferRef.current.length);
        
        // Start playing after accumulating 15 chunks (~1 second of audio)
        // Larger buffer = ultra-smooth playback
        if (audioChunkBufferRef.current.length === 25) {
          console.log('🎵 Initial buffer filled (25 chunks), flushing to playback...');
          flushAudioBuffer();
        }
        
        // Continue flushing every 30 chunks for smooth, continuous segments
        if (audioChunkBufferRef.current.length % 30 === 0 && audioChunkBufferRef.current.length > 15) {
          console.log('🎵 Periodic flush (30 chunks accumulated)');
          flushAudioBuffer();
        }
      });

      // Handle conversation text
      connection.on(AgentEvents.ConversationText, (data: any) => {
        console.log('💬 Conversation:', data);
        const role = data.role === 'user' ? 'user' : 'assistant';
        const content = data.content;
        
        // Add message to conversation array
        const newMessage: ConversationMessage = {
          speaker: role,
          text: content,
          timestamp: new Date(),
        };
        
        // Update ref immediately for trigger detection
        conversationMessagesRef.current = [...conversationMessagesRef.current, newMessage];
        
        setConversationMessages(prev => [...prev, newMessage]);
        setTranscription(`${role === 'user' ? 'You' : 'Agent'}: ${content}`);
        setConversationTranscript(prev => prev + `\n${role === 'user' ? 'You' : 'Agent'}: ${content}`);

        // Track user responses to extract preferences
        if (data.role === 'user') {
          // Store the last user request for refinement
          lastUserRequestRef.current = content;
          console.log('📝 Stored user request:', content);
          
          // Check if this is likely a health goals response (first question)
          if (!healthGoalsRef.current && content.length > 10) {
            console.log('📝 Captured health goals:', content);
            healthGoalsRef.current = content;
          }
          // Check if this is likely a cuisine preference response (second question)
          else if (healthGoalsRef.current && !cuisinePreferencesRef.current && content.length > 5) {
            console.log('📝 Captured cuisine preferences:', content);
            cuisinePreferencesRef.current = content;
          }
        }

        // Detect trigger phrases from agent
        if (data.role === 'assistant') {
          const contentLower = content.toLowerCase();
          
          // Initial generation trigger
          if (contentLower.includes('let me generate some recipes')) {
            console.log('🎯 Initial generation trigger detected!');
            setTimeout(() => {
              generateRecipesAndShoppingList();
            }, 1000);
          }
          // Shopping list refinement trigger
          else if (contentLower.includes('let me update your shopping list')) {
            console.log('🎯 Shopping list refinement trigger detected!');
            const userRequest = lastUserRequestRef.current;
            console.log('🎯 Using user request:', userRequest);
            setTimeout(() => {
              if (userRequest) {
                refineShoppingList(userRequest);
              } else {
                console.error('❌ No user request found for refinement');
              }
            }, 1000);
          }
          // Recipe regeneration trigger
          else if (contentLower.includes('let me find different recipes')) {
            console.log('🎯 Recipe regeneration trigger detected!');
            const userRequest = lastUserRequestRef.current;
            console.log('🎯 Using user request:', userRequest);
            setTimeout(() => {
              if (userRequest) {
                regenerateRecipes(userRequest);
              } else {
                console.error('❌ No user request found for regeneration');
              }
            }, 1000);
          }
        }
      });

      // Handle user started speaking - clear all audio
      connection.on(AgentEvents.UserStartedSpeaking, () => {
        console.log('🎤 User started speaking - interrupting agent');
        
        // Don't process if paused
        if (isPausedRef.current) return;
        
        // Clear ALL audio buffers immediately
        audioChunkBufferRef.current = [];
        audioQueueRef.current = [];
        isAgentSpeakingRef.current = false;
        isPlayingRef.current = false;
        
        setMicState('listening');
        setIsConversationActive(true); // Conversation is now active
      });

      // Handle agent started speaking
      connection.on(AgentEvents.AgentStartedSpeaking, () => {
        console.log('🗣️ Agent started speaking - preparing to accumulate audio');
        
        // Don't process if paused
        if (isPausedRef.current) return;
        
        setMicState('processing');
        isAgentSpeakingRef.current = true;
        // Clear previous audio buffer
        audioChunkBufferRef.current = [];
      });

      // Handle agent audio done - Flush any remaining chunks
      connection.on(AgentEvents.AgentAudioDone, async () => {
        console.log('✅ Agent finished speaking');
        isAgentSpeakingRef.current = false;
        
        // Flush any remaining buffered chunks
        if (audioChunkBufferRef.current.length > 0) {
          console.log('🎵 Final flush:', audioChunkBufferRef.current.length, 'remaining chunks');
          await flushAudioBuffer();
        } else {
          console.log('  - No remaining chunks to flush');
        }
        
        // Will return to listening when playback queue finishes
      });

      // Handle errors
      connection.on(AgentEvents.Error, (err: any) => {
        // console.error('❌ Agent error:', err);
        // setError(err.message || 'Agent error occurred');
        setMicState('idle');
      });

      // Handle connection close
      connection.on(AgentEvents.Close, () => {
        console.log('🔌 Connection closed');
        setMicState('idle');
      });

      // Handle unhandled events
      connection.on(AgentEvents.Unhandled, (data: any) => {
        console.log('📦 Unhandled event:', data);
      });

      // Send keep-alive every 5 seconds
      const keepAliveInterval = setInterval(() => {
        if (agentWsRef.current) {
          console.log('💓 Keep alive');
          connection.keepAlive();
        } else {
          clearInterval(keepAliveInterval);
        }
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
      setMicState('idle');
      console.error('Error starting agent:', err);
    }
  };

  const playAgentAudio = async (audioData: ArrayBuffer | Uint8Array | unknown) => {
    if (!audioContextRef.current) return;

    let pcmData: ArrayBuffer | undefined;
    
    try {
      // Handle different data formats
      if (audioData instanceof ArrayBuffer) {
        pcmData = audioData;
      } else if (audioData instanceof Uint8Array) {
        pcmData = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength) as ArrayBuffer;
      } else if (typeof audioData === 'object' && audioData !== null && 'buffer' in audioData) {
        const bufferLike = audioData as { buffer: ArrayBuffer; byteOffset: number; byteLength: number };
        pcmData = bufferLike.buffer.slice(bufferLike.byteOffset, bufferLike.byteOffset + bufferLike.byteLength) as ArrayBuffer;
      } else {
        console.warn('Unknown audio data format:', typeof audioData);
        return;
      }

      // Per Deepgram docs: Prepend WAV header for browser playback
      // https://developers.deepgram.com/docs/voice-agent-audio-playback
      const wavHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x00, 0x00, 0x00, 0x00, // Placeholder for file size
        0x57, 0x41, 0x56, 0x45, // "WAVE"
        0x66, 0x6d, 0x74, 0x20, // "fmt "
        0x10, 0x00, 0x00, 0x00, // Chunk size (16)
        0x01, 0x00,             // Audio format (1 for PCM)
        0x01, 0x00,             // Number of channels (1 for mono)
        0x80, 0x3e, 0x00, 0x00, // Sample rate (16000 Hz)
        0x00, 0x7d, 0x00, 0x00, // Byte rate (32000 = 16000*1*2)
        0x02, 0x00,             // Block align (2)
        0x10, 0x00,             // Bits per sample (16)
        0x64, 0x61, 0x74, 0x61, // "data"
        0x00, 0x00, 0x00, 0x00  // Placeholder for data size
      ]);

      // Concatenate WAV header with PCM data
      const wavBuffer = new Uint8Array(wavHeader.length + pcmData.byteLength);
      wavBuffer.set(wavHeader, 0);
      wavBuffer.set(new Uint8Array(pcmData), wavHeader.length);

      // Update file size in header
      const fileSize = wavBuffer.length - 8;
      wavBuffer[4] = fileSize & 0xff;
      wavBuffer[5] = (fileSize >> 8) & 0xff;
      wavBuffer[6] = (fileSize >> 16) & 0xff;
      wavBuffer[7] = (fileSize >> 24) & 0xff;

      // Update data chunk size
      const dataSize = pcmData.byteLength;
      wavBuffer[40] = dataSize & 0xff;
      wavBuffer[41] = (dataSize >> 8) & 0xff;
      wavBuffer[42] = (dataSize >> 16) & 0xff;
      wavBuffer[43] = (dataSize >> 24) & 0xff;
      
      // Decode the WAV file using browser's native decoder
      const audioBuffer = await audioContextRef.current.decodeAudioData(wavBuffer.buffer);
      
      console.log('  - Decoded:', audioBuffer.duration.toFixed(2), 's, adding to queue');
      
      // Add to playback queue
      audioQueueRef.current.push(audioBuffer);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextAudioChunk();
      }
      
    } catch (err) {
      console.error('❌ Error preparing audio:', err);
      console.error('   PCM data size:', pcmData?.byteLength);
    }
  };

  const playNextAudioChunk = () => {
    if (audioQueueRef.current.length === 0) {
      console.log('✅ Playback queue empty');
      isPlayingRef.current = false;
      
      // Only return to listening if agent is done speaking
      if (!isAgentSpeakingRef.current) {
        setMicState('listening');
        setIsConversationActive(true); // Keep conversation active
      }
      return;
    }

    isPlayingRef.current = true;
    setMicState('processing');
    
    const audioBuffer = audioQueueRef.current.shift()!;
    const hasMoreChunks = audioQueueRef.current.length > 0;
    const isLastChunk = !hasMoreChunks && !isAgentSpeakingRef.current;
    
    console.log('▶️  Playing buffer:', audioBuffer.duration.toFixed(2), 's (queue:', audioQueueRef.current.length, 'remaining)', isLastChunk ? '[LAST CHUNK]' : '');
    
    const source = audioContextRef.current!.createBufferSource();
    source.buffer = audioBuffer;
    
    // Add smooth fade-in/out to prevent clicks between segments
    const gainNode = audioContextRef.current!.createGain();
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current!.destination);
    
    const now = audioContextRef.current!.currentTime;
    const fadeTime = 0.005; // 5ms fade - minimal but prevents clicks
    
    // Only fade in if not the first chunk (prevents cutting beginning)
    // For first chunk, start at full volume
    if (isPlayingRef.current) {
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + fadeTime);
    } else {
      gainNode.gain.setValueAtTime(1, now);
    }
    
    // Only fade out if there are more chunks coming (NOT on last chunk!)
    // This prevents cutting off the end of speech
    if (!isLastChunk && hasMoreChunks) {
      const endTime = now + audioBuffer.duration;
      gainNode.gain.setValueAtTime(1, endTime - fadeTime);
      gainNode.gain.linearRampToValueAtTime(0.8, endTime); // Gentle fade to 80%, not silence
    } else {
      // Last chunk: maintain full volume to the end
      gainNode.gain.setValueAtTime(1, now);
    }
    
    source.onended = () => {
      // Play next buffer immediately when this one ends
      playNextAudioChunk();
    };
    
    source.start();
  };

  const pauseConversation = () => {
    console.log('Pausing conversation...');
    
    // Stop AI audio playback immediately
    if (audioContextRef.current && isPlayingRef.current) {
      // Stop all audio sources
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    }
    
    // Clear audio buffers to stop any pending audio
    audioChunkBufferRef.current = [];
    audioQueueRef.current = [];
    isAgentSpeakingRef.current = false;
    
    // Stop microphone input (but keep connection open for resume)
    if (mediaRecorderRef.current) {
      try {
        if (typeof mediaRecorderRef.current.stop === 'function') {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
      // Don't set to null - we'll reuse it on resume
    }

    setMicState('paused');
    setIsPaused(true);
    isPausedRef.current = true;
    console.log('Conversation paused - messages remain visible');
  };

  const stopRecording = () => {
    console.log('Stopping recording completely...');
    
    // Close Deepgram SDK connection
    if (agentWsRef.current) {
      try {
        // The SDK connection might have different close methods
        if (typeof (agentWsRef.current as any).close === 'function') {
          (agentWsRef.current as any).close();
        } else if (typeof (agentWsRef.current as any).finish === 'function') {
          (agentWsRef.current as any).finish();
        }
        agentWsRef.current = null;
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }

    // Stop media recorder / audio processor
    if (mediaRecorderRef.current) {
      try {
        if (typeof mediaRecorderRef.current.stop === 'function') {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
      mediaRecorderRef.current = null;
    }

    // Clear all audio buffers
    audioChunkBufferRef.current = [];
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    isAgentSpeakingRef.current = false;

    setMicState('idle');
    setTranscription('');
    setIsConversationActive(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setConversationMessages([]); // Clear conversation when fully stopped
    conversationMessagesRef.current = []; // Clear ref too
    lastUserRequestRef.current = ''; // Clear last request
    console.log('Recording stopped completely');
  };

  const handleMicClick = () => {
    if (micState === 'idle') {
      // Start conversation
      startRecording();
      setIsConversationActive(true);
      setIsPaused(false);
    } else if (micState === 'paused') {
      // Resume conversation
      console.log('Resuming conversation...');
      setIsPaused(false);
      isPausedRef.current = false;
      // Restart recording
      startRecording();
    } else {
      // Pause conversation (keep messages visible)
      pauseConversation();
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const toggleItem = (id: string) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleExportList = () => {
    if (cartItems.length === 0) {
      setError('No items to export');
      return;
    }

    let exportContent = "🛒 Your Shopping List:\n\n";
    cartItems.forEach(item => {
      if (item.enabled) {
        exportContent += `- ${item.name} (${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
      }
    });
    exportContent += `\nTotal: $${totalCost.toFixed(2)}\n\n`;

    if (recipes.length > 0) {
      exportContent += "🍳 Recipe Suggestions:\n\n";
      recipes.forEach(recipe => {
        exportContent += `--- ${recipe.title} ---\n`;
        exportContent += `Time: ${recipe.prepTime}, Difficulty: ${recipe.difficulty}\n`;
        exportContent += `Match: ${recipe.matchPercentage}%\n`;
        exportContent += "Ingredients:\n";
        recipe.ingredients.forEach(ing => {
          exportContent += `  - ${ing}\n`;
        });
        exportContent += "\n";
      });
    }

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cartify_shopping_list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickPurchase = async () => {
    const enabledItems = cartItems.filter(item => item.enabled);
    if (enabledItems.length === 0) {
      setError('No items selected for purchase');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Extract item names from cart (respecting quantity)
      const itemNames: string[] = [];
      enabledItems.forEach(item => {
        // Add each item according to its quantity
        for (let i = 0; i < item.quantity; i++) {
          itemNames.push(item.name);
        }
      });

      console.log('🛒 Starting Weee! purchase for items:', itemNames);

      // Call the batch add API endpoint with timeout
      // Note: This can take a while as it opens a browser and adds items one by one
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemNames }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Failed to add items to Weee! cart`;
        console.error('❌ API Error:', errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('✅ Weee! cart result:', result);

      // Show success message
      if (result.summary && result.summary.successful > 0) {
        alert(
          `✅ Successfully added ${result.summary.successful} of ${result.summary.total} items to Weee! cart!\n\n` +
          `The browser window has opened showing your cart. You can now review and checkout.`
        );
      } else if (result.success === false) {
        // API returned success: false
        const errorMsg = result.error || result.message || 'Failed to add items to Weee! cart';
        setError(errorMsg);
      } else {
        setError('Failed to add any items to Weee! cart. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Error during Weee! purchase:', err);
      
      let errorMessage = 'Failed to process Weee! purchase. Please try again.';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The Weee! automation is taking longer than expected. Please try again with fewer items.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCost = cartItems
    .filter(item => item.enabled)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDF4] via-[#F9FAFB] to-[#ECFDF5] pb-24 lg:pb-0">
      <Header cartItemCount={cartItems.filter(item => item.enabled).length} totalCost={totalCost} />

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* Removed all notification banners - feedback is now inline and contextual */}
        <div className="min-h-[calc(100vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch ">

            {/* Left Column - Voice Agent */}
            <div className="order-1 lg:order-1">
              <VoicePanel
                micState={micState}
                onMicClick={handleMicClick}
                conversationMessages={conversationMessages}
                isConversationActive={isConversationActive || conversationMessages.length > 0}
              />
            </div>

            {/* Center Column - Recipes */}
            <div className="order-2 lg:order-2 h-full">
              <RecipePanel recipes={recipes} isGenerating={isGeneratingRecipes} />
            </div>

            {/* Right Column - Shopping Cart */}
            <div className="order-3 lg:order-3 h-full">
              <ShoppingCartPanel
                cartItems={cartItems}
                totalCost={totalCost}
                onUpdateQuantity={updateQuantity}
                onToggleItem={toggleItem}
                onRemoveItem={removeItem}
                onExportList={handleExportList}
                onQuickPurchase={handleQuickPurchase}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-bold text-lg text-gray-900">${totalCost.toFixed(2)}</p>
          </div>
          <button
            onClick={handleMicClick}
            disabled={micState !== 'idle' && micState !== 'listening'}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              micState === 'idle'
                ? 'bg-[#14B8A6] hover:bg-[#10B981]'
                : micState === 'listening'
                ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] animate-pulse-scale'
                : 'bg-[#14B8A6]'
            }`}
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={handleQuickPurchase}
            className="flex-1 text-right bg-[#14B8A6] hover:bg-[#10B981] text-white font-semibold py-3 px-4 rounded-xl transition-colors ml-3"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
