import { Clock, ChefHat, TrendingUp } from 'lucide-react';
import type { Recipe } from '../types';
import { useState, useEffect } from 'react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  index?: number;
}

export function RecipeCard({ recipe, onClick, index = 0 }: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Staggered fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-gray-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={recipe.image}
          alt={recipe.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-105' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Match Percentage Badge */}
        <div
          className={`absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 transition-all duration-300 ${
            recipe.matchPercentage === 100 ? 'animate-shimmer-badge' : ''
          }`}
          style={{
            animationName: recipe.matchPercentage === 100 ? 'scale-in' : 'none',
            animationDuration: recipe.matchPercentage === 100 ? '0.4s' : undefined,
            animationTimingFunction: recipe.matchPercentage === 100 ? 'cubic-bezier(0.4, 0.0, 0.2, 1)' : undefined,
            animationFillMode: recipe.matchPercentage === 100 ? 'forwards' : undefined,
            animationDelay: `${index * 150 + 300}ms`,
            opacity: isVisible ? 1 : 0,
          }}
        >
          <TrendingUp className="w-3 h-3 text-[#14B8A6]" />
          <span className="text-sm font-semibold text-gray-900">{recipe.matchPercentage}%</span>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300">
            <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              View Recipe
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-1 transition-colors duration-300 group-hover:text-[#14B8A6]">
          {recipe.title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1 transition-all duration-300 group-hover:text-gray-900">
            <Clock className="w-4 h-4 transition-opacity duration-300" style={{ opacity: isVisible ? 1 : 0 }} />
            <span>{recipe.prepTime}</span>
          </div>
          <div className="flex items-center gap-1 transition-all duration-300 group-hover:text-gray-900">
            <ChefHat className="w-4 h-4 transition-opacity duration-300" style={{ opacity: isVisible ? 1 : 0 }} />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Hover lift effect */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
          isHovered
            ? 'shadow-2xl -translate-y-1'
            : 'shadow-sm'
        }`}
      />
    </div>
  );
}
