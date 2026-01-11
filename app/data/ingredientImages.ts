/**
 * Static ingredient image mappings
 * Maps ingredient names to image URLs
 * You can add your own static images here
 */

export const INGREDIENT_IMAGES: Record<string, string> = {
  // Common ingredients - add your static image URLs here
  // Example format:
  // 'chicken breast': '/images/ingredients/chicken-breast.jpg',
  // 'broccoli': '/images/ingredients/broccoli.jpg',
};

/**
 * Get image URL for an ingredient
 * Returns static image if available, otherwise generates a unique Unsplash URL
 */
export function getIngredientImage(ingredientName: string): string {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Check if we have a static image for this ingredient
  if (INGREDIENT_IMAGES[normalizedName]) {
    return INGREDIENT_IMAGES[normalizedName];
  }
  
  // Check for partial matches (e.g., "chicken" matches "chicken breast")
  for (const [key, imageUrl] of Object.entries(INGREDIENT_IMAGES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return imageUrl;
    }
  }
  
  // Fallback: Generate unique Unsplash URL based on ingredient name
  const nameHash = ingredientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://source.unsplash.com/200x200/?${encodeURIComponent(ingredientName + ' food ingredient')}&sig=${nameHash}`;
}

