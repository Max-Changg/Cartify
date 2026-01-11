'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Header } from './components/ui/Header';
import { VoicePanel } from './components/VoicePanel';
import { RecipePanel } from './components/RecipePanel';
import { IngredientsPanel } from './components/ui/IngredientsPanel';
import type { CartItem, Recipe, Ingredient, MicrophoneState } from './types';
import { createClient, AgentEvents } from '@deepgram/sdk';

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('disconnected');
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  
  // AI Agent state
  const [healthGoals, setHealthGoals] = useState('');
  const [cuisinePreferences, setCuisinePreferences] = useState('');
  const [excludedItems, setExcludedItems] = useState<string[]>([]);
  const [conversationTranscript, setConversationTranscript] = useState<string>('');

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

  // Regenerate recipes when selected ingredients change
  useEffect(() => {
    if (selectedIngredients.size > 0 && ingredients.length > 0) {
      regenerateRecipes();
    }
  }, [selectedIngredients]);

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

  // Convert backend shopping items to frontend ingredients
  const convertToIngredients = (items: BackendShoppingItem[]): Ingredient[] => {
    return items.map((item, idx) => ({
      id: item.id,
      name: item.name,
      brand: 'Generic',
      price: item.estimated_price || 0,
      image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&sig=${idx}`,
      available: ['Weee!', 'Local Store']
    }));
  };

  // Regenerate recipes based on selected ingredients
  const regenerateRecipes = async () => {
    if (selectedIngredients.size === 0) return;

    try {
      setIsProcessing(true);
      const selectedIngredientNames = Array.from(selectedIngredients)
        .map(id => ingredients.find(ing => ing.id === id)?.name)
        .filter(Boolean) as string[];

      if (selectedIngredientNames.length === 0) return;

      const response = await fetch('/api/process-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Generate recipes using: ${selectedIngredientNames.join(', ')}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate recipes');
      }

      const data: ShoppingListResponse = await response.json();
      const newRecipes = convertToRecipes(data.recipes);
      setRecipes(newRecipes);
    } catch (err: any) {
      console.error('Error regenerating recipes:', err);
      setError('Failed to regenerate recipes');
    } finally {
      setIsProcessing(false);
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

      // Convert to Recipe format expected by UI
      const formattedRecipes: Recipe[] = recipes.map((r: any, index: number) => ({
        id: `recipe-${Date.now()}-${index}`,
        name: r.name,
        cuisine: r.cuisine,
        servings: r.servings || 4,
        prepTime: r.prepTime || '30 mins',
        healthBenefits: r.healthBenefits || '',
        ingredients: r.ingredients.map((ing: string, idx: number) => ({
          id: `ing-${index}-${idx}`,
          name: ing,
          amount: '1x',
          category: 'other' as const,
        })),
      }));

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

      const { shopping_list } = await shoppingResponse.json();
      console.log('✅ Generated shopping list:', shopping_list);

      // Convert to CartItem format and add to cart
      const newCartItems: CartItem[] = shopping_list.map((item: any, index: number) => ({
        id: `cart-${Date.now()}-${index}`,
        name: item.item,
        amount: item.quantity,
        price: item.estimatedPrice || 0,
        imageUrl: '', // No image for now
        category: item.category || 'other',
        quantity: 1,
        enabled: true,
      }));

      setCartItems(newCartItems);
      console.log('✅ Shopping cart populated with', newCartItems.length, 'items');

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

Your task is to:
1. First ask: "What are your health and fitness goals?" and listen for their response
2. Then ask: "What types of food do you like? Any cuisines, dishes, or ingredients in particular?" and listen for their response
3. Once you have BOTH pieces of information, say EXACTLY this phrase: "Perfect! Let me generate some recipes for you."
4. After that, briefly describe the recipes you'll be generating based on their preferences

Keep responses short (1-2 sentences). Be warm and conversational.

IMPORTANT: You MUST say the EXACT phrase "Perfect! Let me generate some recipes for you." when you have both their health goals AND cuisine preferences. This triggers the recipe generation system.`,
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
              micAudioContext.close();
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

      // Handle audio from agent - accumulate chunks for smooth playback
      connection.on(AgentEvents.Audio, (data: any) => {
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
      });

      // Handle conversation text
      connection.on(AgentEvents.ConversationText, (data: any) => {
        console.log('💬 Conversation:', data);
        const role = data.role === 'user' ? 'You' : 'Agent';
        const content = data.content;
        
        setTranscription(`${role}: ${content}`);
        setConversationTranscript(prev => prev + `\n${role}: ${content}`);

        // Track user responses to extract preferences
        if (data.role === 'user') {
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

        // Detect trigger phrase from agent
        if (data.role === 'assistant' && content.toLowerCase().includes('let me generate some recipes')) {
          console.log('🎯 Trigger detected! Generating recipes...');
          // Wait a moment for the audio to finish, then generate
          setTimeout(() => {
            generateRecipesAndShoppingList();
          }, 1000);
        }
      });

      // Handle user started speaking - clear audio
      connection.on(AgentEvents.UserStartedSpeaking, () => {
        console.log('🎤 User started speaking - interrupting agent');
        // Clear any pending audio when user interrupts
        audioChunkBufferRef.current = [];
        isAgentSpeakingRef.current = false;
        isPlayingRef.current = false;
        setMicState('listening');
      });

      // Handle agent started speaking
      connection.on(AgentEvents.AgentStartedSpeaking, () => {
        console.log('🗣️ Agent started speaking - preparing to accumulate audio');
        setMicState('processing');
        isAgentSpeakingRef.current = true;
        // Clear previous audio buffer
        audioChunkBufferRef.current = [];
      });

      // Handle agent audio done - Combine and play all accumulated chunks
      connection.on(AgentEvents.AgentAudioDone, async () => {
        console.log('✅ Agent finished speaking - combining', audioChunkBufferRef.current.length, 'chunks');
        isAgentSpeakingRef.current = false;
        
        if (audioChunkBufferRef.current.length === 0) {
          console.warn('⚠️ No audio chunks to play!');
          setMicState('listening');
          return;
        }
        
        // Calculate total size
        const totalSize = audioChunkBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
        console.log('  - Total PCM data:', totalSize, 'bytes (', (totalSize / 32000).toFixed(2), 'seconds at 16kHz)');
        
        // Combine all chunks into one buffer
        const combinedPcm = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of audioChunkBufferRef.current) {
          combinedPcm.set(chunk, offset);
          offset += chunk.length;
        }
        
        console.log('🎵 Combined all chunks into single buffer, preparing playback...');
        
        // Play the complete audio (smooth, no choppiness!)
        await playAgentAudio(combinedPcm.buffer);
        
        // Clear buffer for next speech
        audioChunkBufferRef.current = [];
      });

      // Handle errors
      connection.on(AgentEvents.Error, (err: any) => {
        console.error('❌ Agent error:', err);
        setError(err.message || 'Agent error occurred');
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

      console.log('🎵 Creating WAV file with', pcmData.byteLength, 'bytes of PCM data');

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

      console.log('🎵 Decoding WAV file with browser decoder...');
      
      // Decode the complete WAV file using browser's native decoder
      const audioBuffer = await audioContextRef.current.decodeAudioData(wavBuffer.buffer);
      
      console.log('✅ Successfully decoded:', audioBuffer.duration.toFixed(2), 'seconds at', audioBuffer.sampleRate, 'Hz');
      console.log('▶️  Starting smooth playback...');
      
      // Play immediately (single smooth audio)
      isPlayingRef.current = true;
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        console.log('✅ Audio playback finished');
        isPlayingRef.current = false;
        setMicState('listening');
      };
      
      source.start();
      
    } catch (err) {
      console.error('❌ Error playing audio:', err);
      console.error('   PCM data size:', pcmData?.byteLength);
      isPlayingRef.current = false;
      setMicState('listening');
    }
  };

  // Removed playNextAudioChunk - now playing accumulated audio directly

  const stopRecording = () => {
    console.log('Stopping recording...');
    
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

    // Clear audio buffer
    audioChunkBufferRef.current = [];
    isPlayingRef.current = false;

    setMicState('idle');
    setTranscription('');
    console.log('Recording stopped');
  };

  const handleMicClick = () => {
    if (micState === 'idle') {
      startRecording();
    } else if (micState === 'listening' || micState === 'processing') {
      stopRecording();
    }
  };

  const addToCart = (ingredient: Ingredient) => {
    const existingItem = cartItems.find(item => item.id === ingredient.id);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === ingredient.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: ingredient.id,
        name: ingredient.name,
        quantity: 1,
        price: ingredient.price,
        enabled: true,
        brand: ingredient.brand
      }]);
    }

    // Add to selected ingredients
    setSelectedIngredients(prev => new Set(prev).add(ingredient.id));
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
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleIngredient = (id: string) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

      // Call the batch add API endpoint
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemNames }),
      });

      if (!response.ok) {
        throw new Error('Failed to add items to Weee! cart');
      }

      const result = await response.json();
      
      console.log('✅ Weee! cart result:', result);

      // Show success message
      if (result.summary.successful > 0) {
        alert(
          `✅ Successfully added ${result.summary.successful} of ${result.summary.total} items to Weee! cart!\n\n` +
          `The browser window has opened showing your cart. You can now review and checkout.`
        );
      } else {
        setError('Failed to add any items to Weee! cart. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Error during Weee! purchase:', err);
      setError(err.message || 'Failed to process Weee! purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCost = cartItems
    .filter(item => item.enabled)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 lg:pb-0">
      <Header cartItemCount={cartItems.filter(item => item.enabled).length} totalCost={totalCost} />

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {isGeneratingRecipes && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-pulse">
            <p className="text-sm text-blue-600">🧪 Generating personalized recipes and shopping list...</p>
          </div>
        )}

        {backendStatus === 'disconnected' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-600">⚠️ Backend not connected. Please start the backend server.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
          {/* Left Panel - Voice Input & Shopping Cart */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <VoicePanel
              cartItems={cartItems}
              micState={micState}
              transcription={transcription}
              timer={timer}
              totalCost={totalCost}
              onMicClick={handleMicClick}
              onUpdateQuantity={updateQuantity}
              onToggleItem={toggleItem}
              onRemoveItem={removeItem}
              onExportList={handleExportList}
              onQuickPurchase={handleQuickPurchase}
              isProcessing={isProcessing}
            />
          </div>

          {/* Center Panel - Recipe Suggestions */}
          <div className="lg:col-span-4 order-2 lg:order-2">
            <RecipePanel recipes={recipes} />
          </div>

          {/* Right Panel - Ingredient Details */}
          <div className="lg:col-span-3 order-3 lg:order-3">
            <IngredientsPanel 
              ingredients={ingredients} 
              onAddToCart={addToCart}
              selectedIngredients={selectedIngredients}
              onToggleIngredient={toggleIngredient}
            />
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
                ? 'bg-[#10B981] hover:bg-[#059669]'
                : micState === 'listening'
                ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] animate-pulse-scale'
                : 'bg-[#10B981]'
            }`}
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={handleQuickPurchase}
            className="flex-1 text-right bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-xl transition-colors ml-3"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
