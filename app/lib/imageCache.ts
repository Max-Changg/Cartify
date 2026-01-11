import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'images', 'cache');
const CACHE_MAP_FILE = path.join(process.cwd(), 'app', 'data', 'imageCache.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Ensure cache map file exists
if (!fs.existsSync(CACHE_MAP_FILE)) {
  fs.writeFileSync(CACHE_MAP_FILE, JSON.stringify({}, null, 2));
}

interface ImageCacheEntry {
  ingredientName: string;
  cachedImagePath: string;
  unsplashUrl: string;
  cachedAt: string;
}

/**
 * Get cached image path for an ingredient
 */
export function getCachedImage(ingredientName: string): string | null {
  try {
    const cacheMap = JSON.parse(fs.readFileSync(CACHE_MAP_FILE, 'utf-8'));
    const normalizedName = ingredientName.toLowerCase().trim();
    
    if (cacheMap[normalizedName]) {
      const entry: ImageCacheEntry = cacheMap[normalizedName];
      const imagePath = path.join(CACHE_DIR, entry.cachedImagePath);
      
      // Check if file actually exists
      if (fs.existsSync(imagePath)) {
        // Return public URL path
        return `/images/cache/${entry.cachedImagePath}`;
      } else {
        // File doesn't exist, remove from cache
        delete cacheMap[normalizedName];
        fs.writeFileSync(CACHE_MAP_FILE, JSON.stringify(cacheMap, null, 2));
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reading image cache:', error);
    return null;
  }
}

/**
 * Save an image to cache
 */
export async function saveImageToCache(
  ingredientName: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const normalizedName = ingredientName.toLowerCase().trim();
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Generate filename from ingredient name (sanitized)
    const sanitizedName = normalizedName.replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    const filename = `${sanitizedName}_${timestamp}.jpg`;
    const filePath = path.join(CACHE_DIR, filename);
    
    // Save image file
    fs.writeFileSync(filePath, buffer);
    
    // Update cache map
    const cacheMap = JSON.parse(fs.readFileSync(CACHE_MAP_FILE, 'utf-8'));
    cacheMap[normalizedName] = {
      ingredientName: normalizedName,
      cachedImagePath: filename,
      unsplashUrl: imageUrl,
      cachedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(CACHE_MAP_FILE, JSON.stringify(cacheMap, null, 2));
    
    // Return public URL path
    return `/images/cache/${filename}`;
  } catch (error) {
    console.error('Error saving image to cache:', error);
    return null;
  }
}

/**
 * Check if an ingredient has a cached image
 */
export function hasCachedImage(ingredientName: string): boolean {
  return getCachedImage(ingredientName) !== null;
}

