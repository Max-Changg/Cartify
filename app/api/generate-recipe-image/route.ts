import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * POST /api/generate-recipe-image
 * Gets a high-quality food image for a recipe using Unsplash API
 * 
 * Body: { recipeName: string }
 * Returns: { image: string, source: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeName } = body;

    if (!recipeName) {
      return NextResponse.json(
        { error: 'Recipe name is required' },
        { status: 400 }
      );
    }

    // Use Unsplash API for high-quality recipe images
    if (UNSPLASH_ACCESS_KEY) {
      try {
        // Create a good search query for the recipe
        const query = `${recipeName} food recipe`;
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
        
        const unsplashResponse = await fetch(unsplashUrl);
        
        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            // Use regular size for better quality (good for recipe cards)
            const imageUrl = unsplashData.results[0].urls.regular || 
                           unsplashData.results[0].urls.small || 
                           unsplashData.results[0].urls.thumb;
            
            return NextResponse.json({
              image: imageUrl,
              source: 'unsplash',
              photographer: unsplashData.results[0].user.name,
              photographerUrl: unsplashData.results[0].user.links.html,
            });
          }
        }
      } catch (unsplashError) {
        console.log('Unsplash API failed:', unsplashError);
      }
    }

    // Fallback: Use Unsplash Source API (no key needed, but less reliable)
    const fallbackUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(recipeName + ' food')}`;
    return NextResponse.json({
      image: fallbackUrl,
      source: 'unsplash-source',
    });
  } catch (error: any) {
    console.error('Error generating recipe image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

