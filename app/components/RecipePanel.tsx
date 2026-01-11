import { useState } from 'react';
import type { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';
import { RecipeModal } from './RecipeModal';

const categories = ['all', 'breakfast', 'lunch', 'dinner', 'dessert'];

interface RecipePanelProps {
  recipes: Recipe[];
  isGenerating?: boolean;
}

export function RecipePanel({ recipes, isGenerating = false }: RecipePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = selectedCategory === 'all'
    ? recipes
    : recipes.filter(recipe => recipe.category === selectedCategory);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-2xl shadow-emerald-500/5 border border-gray-100 p-6 h-[calc(100vh-120px)] flex flex-col relative overflow-hidden">
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-gradient"></div>
        
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">
            Recipes You Can Make
          </h2>
          
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 button-shine-effect ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isGenerating && recipes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max items-start overflow-y-auto pr-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-video animate-shimmer" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 animate-float">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold mb-2 text-lg">No recipes yet</p>
              <p className="text-gray-500 text-sm">Speak or type your meal request to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-2 items-start relative">
            {filteredRecipes.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
                index={index}
              />
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}
