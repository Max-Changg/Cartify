import { NextResponse } from 'next/server'
import { navigateToCart } from '@/lib/weee-browser'

/**
 * API endpoint to navigate to the Weee! cart page
 * 
 * POST /api/cart/view
 * 
 * Opens the cart page so you can review items and checkout
 */
export async function POST() {
  try {
    console.log('📥 Received request to view cart')
    
    const result = await navigateToCart()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in cart/view endpoint:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
