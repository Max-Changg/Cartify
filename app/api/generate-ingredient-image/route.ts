import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedImage, saveImageToCache } from '../../lib/imageCache';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * POST /api/generate-ingredient-image
 * Gets a high-quality food image for an ingredient
 * Uses Unsplash API for fast, high-quality food photography
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredientName } = body;

    if (!ingredientName) {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: 400 }
      );
    }

    // First, check if we have a cached image
    const cachedImage = getCachedImage(ingredientName);
    if (cachedImage) {
      return NextResponse.json({
        image: cachedImage,
        source: 'cache',
      });
    }

    // Try Unsplash API if key is available (more reliable)
    let unsplashImageUrl: string | null = null;
    if (UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(ingredientName + ' food ingredient')}&per_page=1&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`;
        const unsplashResponse = await fetch(unsplashUrl);
        
        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            // Use regular size for better quality
            unsplashImageUrl = unsplashData.results[0].urls.regular || 
                             unsplashData.results[0].urls.small || 
                             unsplashData.results[0].urls.thumb;
            
            // Save to cache for future use (non-blocking)
            if (unsplashImageUrl) {
              saveImageToCache(ingredientName, unsplashImageUrl).catch(err => {
                console.log('Failed to cache image (non-critical):', err);
              });
              
              return NextResponse.json({
                image: unsplashImageUrl,
                source: 'unsplash',
              });
            }
          }
        }
      } catch (unsplashError) {
        console.log('Unsplash API failed, trying fallback:', unsplashError);
      }
    }

    // Fallback: Use Unsplash Source API (no key needed, but less reliable)
    // Note: We don't cache Unsplash Source URLs as they're dynamic
    try {
      const unsplashSourceUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(ingredientName + ' food ingredient')}`;
      
      // Test if the URL works
      const testResponse = await fetch(unsplashSourceUrl, { method: 'HEAD', redirect: 'follow' });
      if (testResponse.ok) {
        return NextResponse.json({
          image: unsplashSourceUrl,
          source: 'unsplash-source',
        });
      }
    } catch (unsplashError) {
      // Continue to next option
    }

    // Final fallback: Smart Unsplash placeholder with ingredient name
    return NextResponse.json({
      image: `https://source.unsplash.com/200x200/?${encodeURIComponent(ingredientName + ' food')}`,
      source: 'unsplash-placeholder',
    });
  } catch (error: any) {
    console.error('Error generating ingredient image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

