import { NextRequest, NextResponse } from 'next/server'
import { addItemToWeeeCart } from '@/lib/weee-browser'

/**
 * API endpoint to add items to Weee! cart
 * 
 * POST /api/weee/add-to-cart
 * Body: { itemName: string }
 * 
 * Example:
 * curl -X POST http://localhost:3000/api/weee/add-to-cart \
 *   -H "Content-Type: application/json" \
 *   -d '{"itemName":"apple"}'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemName } = body
    
    if (!itemName || typeof itemName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Item name is required',
        },
        { status: 400 }
      )
    }
    
    console.log(`📥 Received request to add item: "${itemName}"`)
    
    // Add item to cart using the browser automation function
    const result = await addItemToWeeeCart(itemName)
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Error in add-to-cart endpoint:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
