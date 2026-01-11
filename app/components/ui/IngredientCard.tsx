import { Plus, Check, Store } from 'lucide-react';
import type { Ingredient } from '../../types';

interface IngredientCardProps {
  ingredient: Ingredient;
  onAddToCart: (ingredient: Ingredient) => void;
  isAdded: boolean;
  isSelected?: boolean;
  onToggle?: (id: string) => void;
}

export function IngredientCard({ 
  ingredient, 
  onAddToCart, 
  isAdded,
  isSelected = false,
  onToggle
}: IngredientCardProps) {
  return (
    <div 
      className={`bg-white border rounded-xl p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-[#10B981] bg-[#F0FDF4]' 
          : 'border-gray-200 hover:border-[#10B981]/30'
      }`}
      onClick={() => onToggle?.(ingredient.id)}
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={ingredient.image}
            alt={ingredient.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-0.5">
            {ingredient.name}
          </h4>
          <p className="text-xs text-gray-500 mb-2">{ingredient.brand}</p>
          
          {/* Store Availability */}
          <div className="flex items-center gap-1 mb-2">
            <Store className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {ingredient.available[0]}
              {ingredient.available.length > 1 && ` +${ingredient.available.length - 1}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              ${ingredient.price.toFixed(2)}
            </span>
            
            <button
              onClick={() => onAddToCart(ingredient)}
              disabled={isAdded}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-1 ${
                isAdded
                  ? 'bg-[#10B981] text-white animate-bounce-in'
                  : 'bg-[#10B981] hover:bg-[#059669] hover:shadow-md text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}