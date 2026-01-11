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

