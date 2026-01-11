import { NextRequest, NextResponse } from 'next/server'
import { addItemToWeeeCart, addMultipleItemsToWeeeCart } from '@/lib/weee-browser'

/**
 * API endpoint to add items to Weee! cart
 * 
 * POST /api/weee/add-to-cart
 * Body: { itemName: string } OR { items: string[] }
 * 
 * Single item example:
 * curl -X POST http://localhost:3000/api/weee/add-to-cart \
 *   -H "Content-Type: application/json" \
 *   -d '{"itemName":"apple"}'
 * 
 * Multiple items example:
 * curl -X POST http://localhost:3000/api/weee/add-to-cart \
 *   -H "Content-Type: application/json" \
 *   -d '{"items":["apple","banana","milk"]}'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemName, items } = body
    
    // Handle multiple items (batch)
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Items array cannot be empty',
          },
          { status: 400 }
        )
      }
      
      console.log(`📥 Received request to add ${items.length} items`)
      
      // Add all items using single browser window
      const result = await addMultipleItemsToWeeeCart(items)
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }
    
    // Handle single item
    if (!itemName || typeof itemName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Item name is required (use "itemName" for single item or "items" for multiple)',
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
