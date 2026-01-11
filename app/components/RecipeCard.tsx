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
      className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-500 border ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${isHovered ? 'z-50 border-emerald-200 shadow-2xl shadow-emerald-500/10' : 'z-10 border-gray-200 shadow-md'}`}
      style={{
        transform: isVisible 
          ? (isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)')
          : 'translateY(20px) scale(0.95)',
        transition: 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative h-40 md:h-44 overflow-hidden bg-gray-100">
        <img
          src={recipe.image}
          alt={recipe.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-105' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Match Percentage Badge */}
        <div
          className="absolute top-3 right-3 bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 transition-all duration-300 shadow-lg border border-emerald-200/50"
          style={{
            animationName: recipe.matchPercentage === 100 ? 'scale-in' : 'none',
            animationDuration: recipe.matchPercentage === 100 ? '0.4s' : undefined,
            animationTimingFunction: recipe.matchPercentage === 100 ? 'cubic-bezier(0.4, 0.0, 0.2, 1)' : undefined,
            animationFillMode: recipe.matchPercentage === 100 ? 'forwards' : undefined,
            animationDelay: `${index * 150 + 300}ms`,
            opacity: isVisible ? 1 : 0,
          }}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{recipe.matchPercentage}%</span>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-center justify-center transition-opacity duration-300">
            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-full font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-xl button-shine-effect">
              View Recipe
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={`font-semibold mb-3 line-clamp-1 transition-all duration-300 ${
          isHovered 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent' 
            : 'text-gray-900'
        }`}>
          {recipe.title}
        </h3>
        
        {/* Meta info */}
        <div className="flex items-start gap-4 text-sm text-gray-600 min-h-[2.5rem]">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-2 leading-snug">
              {recipe.prepTime}
            </span>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <ChefHat className="w-4 h-4 flex-shrink-0" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Hover lift effect */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
          isHovered
            ? 'shadow-2xl'
            : 'shadow-sm'
        }`}
      />
    </div>
  );
}
