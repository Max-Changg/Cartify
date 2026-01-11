'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Header } from './components/ui/Header';
import { VoicePanel } from './components/VoicePanel';
import { RecipePanel } from './components/RecipePanel';
import { IngredientsPanel } from './components/ui/IngredientsPanel';
import type { CartItem, Recipe, Ingredient, MicrophoneState } from './types';

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setMicState('idle');
      };

      // Start recording with timeslice to ensure data is captured
      mediaRecorder.start(100);
      setMicState('listening');
      setError(null);
      setTimer(30);

      // Start timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimer(remaining);
        if (elapsed >= 30) {
          stopRecording();
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to access microphone');
      setMicState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        setMicState('processing');
      } catch (err) {
        console.error('Error stopping recorder:', err);
        setMicState('idle');
      }
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    // Check if audio blob is valid
    if (!audioBlob || audioBlob.size === 0) {
      setError('No audio recorded. Please try again.');
      setIsProcessing(false);
      setMicState('idle');
      return;
    }

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({ detail: 'Transcription failed' }));
        throw new Error(errorData.detail || 'Transcription failed');
      }

      const transcribeData = await transcribeResponse.json();
      const transcriptText = transcribeData.transcript;

      if (!transcriptText || transcriptText.trim() === '') {
        throw new Error('No transcript received. Please try speaking again.');
      }

      setTranscription(transcriptText);

      // Step 2: Process request and generate shopping list
      const processResponse = await fetch('/api/process-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcriptText,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.detail || 'Failed to process request');
      }

      const shoppingListData: ShoppingListResponse = await processResponse.json();

      // Convert and update state
      const newCartItems = convertToCartItems(shoppingListData.items);
      const newRecipes = convertToRecipes(shoppingListData.recipes);
      const newIngredients = convertToIngredients(shoppingListData.items);

      setCartItems(newCartItems);
      setRecipes(newRecipes);
      setIngredients(newIngredients);
      
      // Select all ingredients by default
      setSelectedIngredients(new Set(newIngredients.map(ing => ing.id)));
      
      setMicState('success');

      // Calculate time taken
      const timeTaken = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      setTimer(timeTaken);

      // Reset to idle after showing success
      setTimeout(() => {
        setMicState('idle');
        setTimer(30);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setMicState('idle');
      console.error('Error processing audio:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = () => {
    if (micState === 'idle') {
      startRecording();
    } else if (micState === 'listening') {
      stopRecording();
    }
  };

const handleQuickPurchase = async () => {
  const enabledItems = cartItems.filter(item => item.enabled)

  if (enabledItems.length === 0) {
    setError('No items selected for purchase')
    return
  }

  setIsProcessing(true)

  try {
    const res = await fetch('/api/weee/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: enabledItems.map(item => ({
          name: item.name,       // ✅ string only
          quantity: item.quantity
        })),
      }),
    })

    const data = await res.json()

    if (!res.ok) throw new Error(data.error)

    console.log('✅ Weee results:', data.results)
    alert('✅ Items added to Weee!')
  } catch (err) {
    console.error(err)
    setError('Failed to add items to Weee')
  } finally {
    setIsProcessing(false)
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
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
          Quick Purchase via Weee!
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
