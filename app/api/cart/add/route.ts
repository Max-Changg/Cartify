import { addMultipleItemsToWeeeCart, navigateToCart } from '@/lib/weee-browser'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to add multiple items to Weee! cart
 * 
 * POST /api/cart/add
 * Body: { items: string[] }
 * 
 * Example:
 * curl -X POST http://localhost:3000/api/cart/add \
 *   -H "Content-Type: application/json" \
 *   -d '{"items":["apple","banana","milk"]}'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body
    
    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input: "items" must be a non-empty array of strings',
        },
        { status: 400 }
      )
    }
    
    // Validate all items are strings
    if (!items.every(item => typeof item === 'string')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input: all items must be strings',
        },
        { status: 400 }
      )
    }
    
    console.log(`📥 Received request to add ${items.length} item(s) to cart`)
    console.log(`📋 Items: ${items.join(', ')}`)
    
    // Use the new batch function that uses a single browser window
    const batchResult = await addMultipleItemsToWeeeCart(items)
    
    // Navigate to cart page if any items were successfully added
    if (batchResult.summary.successful > 0) {
      console.log('\n🛒 Navigating to cart page...')
      await navigateToCart()
    }
    
    console.log('\n🌐 Browser window left open for review and checkout')
    
    // Return comprehensive results
    return NextResponse.json({
      success: batchResult.success,
      summary: batchResult.summary,
      results: batchResult.results,
      successfulItems: batchResult.successfulItems,
      failedItems: batchResult.failedItems,
      message: batchResult.summary.successful > 0 
        ? `Added ${batchResult.summary.successful} of ${items.length} item(s) to cart. Navigated to cart page for checkout.`
        : `Failed to add items to cart.`,
      cartUrl: batchResult.summary.successful > 0 ? 'https://www.sayweee.com/en/cart' : null,
    })
    
  } catch (error) {
    console.error('❌ Error in cart/add endpoint:', error)
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for Playwright browser installation error
      if (error.message.includes('executablePath') || error.message.includes('browsers are not installed')) {
        errorMessage = 'Playwright browsers not installed. Please run: npx playwright install chromium';
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
