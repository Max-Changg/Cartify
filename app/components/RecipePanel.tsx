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
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipes You Can Make</h2>
          
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-[#14B8A6] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-video animate-shimmer" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No recipes yet. Speak or type your meal request to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 h-full">
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
