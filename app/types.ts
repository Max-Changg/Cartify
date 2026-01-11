// Shared types for Cartify app

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  enabled: boolean;
  brand?: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  prepTime: string;
  difficulty: string;
  matchPercentage: number;
  category: string;
  ingredients: string[];
  steps: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  available: string[];
}

export type MicrophoneState = 'idle' | 'listening' | 'processing' | 'success';

// AI Agent conversation types
export type ConversationState = 'initial' | 'asking_health' | 'asking_cuisine' | 'generating_recipes' | 'generating_shopping' | 'complete';

export interface ConversationMessage {
  speaker: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
}

export interface AIAgentRecipe {
  name: string;
  cuisine: string;
  servings: number;
  prepTime: string;
  healthBenefits: string;
  ingredients: string[];
}

export interface AIAgentShoppingItem {
  item: string;
  quantity: string;
  category: string;
  estimatedPrice?: number;
}

export interface AIAgentState {
  conversationState: ConversationState;
  healthGoals: string;
  cuisinePreferences: string;
  excludedItems: string[];
  aiRecipes: AIAgentRecipe[];
  aiShoppingList: AIAgentShoppingItem[];
  transcript: ConversationMessage[];
  isGenerating: boolean;
}

