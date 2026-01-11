import { X, Clock, ChefHat, TrendingUp } from 'lucide-react';
import type { Recipe } from '../types';
import { useEffect } from 'react';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Match Badge */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <span className="font-semibold text-gray-900">{recipe.matchPercentage}% Match</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{recipe.title}</h2>
          
          <div className="flex items-center gap-6 mb-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{recipe.prepTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
            <ul className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#10B981] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action Button */}
          <button className="w-full mt-6 bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 rounded-xl transition-colors">
            Add All Ingredients to Cart
          </button>
        </div>
      </div>
    </div>
  );
}