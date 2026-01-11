import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Ingredient } from '../../types';
import { IngredientCard } from './IngredientCard';

interface IngredientsPanelProps {
  ingredients: Ingredient[];
  onAddToCart: (ingredient: Ingredient) => void;
  selectedIngredients?: Set<string>;
  onToggleIngredient?: (id: string) => void;
}

export function IngredientsPanel({ 
  ingredients, 
  onAddToCart,
  selectedIngredients = new Set(),
  onToggleIngredient
}: IngredientsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ingredient.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (ingredient: Ingredient) => {
    onAddToCart(ingredient);
    setAddedItems(new Set(addedItems).add(ingredient.id));
    
    // Remove the "added" state after animation
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(ingredient.id);
        return newSet;
      });
    }, 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 h-fit sticky top-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Ingredients</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Ingredients List */}
      <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
        {filteredIngredients.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No ingredients found</p>
        ) : (
          filteredIngredients.map(ingredient => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onAddToCart={handleAddToCart}
              isAdded={addedItems.has(ingredient.id)}
              isSelected={selectedIngredients.has(ingredient.id)}
              onToggle={onToggleIngredient}
            />
          ))
        )}
      </div>
    </div>
  );
}
