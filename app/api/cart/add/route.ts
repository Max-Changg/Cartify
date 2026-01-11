import { addItemToWeeeCart, navigateToCart } from '@/lib/weee-browser'
import { NextRequest, NextResponse } from 'next/server'

interface AddToCartResult {
  itemName: string
  success: boolean
  productName?: string
  message?: string
  error?: string
}

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
    
    const results: AddToCartResult[] = []
    const successfulItems: string[] = []
    const failedItems: string[] = []
    
    // Loop through items and add each to cart
    for (let i = 0; i < items.length; i++) {
      const itemName = items[i]
      
      console.log(`\n[${i + 1}/${items.length}] Processing: "${itemName}"`)
      
      try {
        // Add item to cart
        const result = await addItemToWeeeCart(itemName)
        
        // Store result
        results.push({
          itemName,
          success: result.success,
          productName: result.productName,
          message: result.message,
        })
        
        if (result.success) {
          successfulItems.push(itemName)
          console.log(`✅ Successfully added: ${itemName}`)
        } else {
          failedItems.push(itemName)
          console.log(`❌ Failed to add: ${itemName} - ${result.message}`)
        }
        
      } catch (error) {
        // Handle individual item errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        results.push({
          itemName,
          success: false,
          error: errorMessage,
        })
        
        failedItems.push(itemName)
        console.log(`❌ Error adding ${itemName}: ${errorMessage}`)
      }
      
      // Add human-like delay between items (except after last item)
    //   if (i < items.length - 1) {
    //     // Random delay between 200-500ms
    //     const delay = Math.floor(Math.random() * 300) + 200
    //     console.log(`⏳ Waiting ${delay}ms before next item...`)
    //     await new Promise(resolve => setTimeout(resolve, delay))
    //   }
    }
    
    // Summary
    console.log('\n📊 Cart Addition Summary:')
    console.log(`✅ Successful: ${successfulItems.length}/${items.length}`)
    console.log(`❌ Failed: ${failedItems.length}/${items.length}`)
    
    if (successfulItems.length > 0) {
      console.log(`✅ Added: ${successfulItems.join(', ')}`)
    }
    
    if (failedItems.length > 0) {
      console.log(`❌ Failed: ${failedItems.join(', ')}`)
    }
    
    // Navigate to cart page if any items were successfully added
    if (successfulItems.length > 0) {
      console.log('\n🛒 Navigating to cart page...')
      await navigateToCart()
    }
    
    console.log('\n🌐 Browser window left open for review and checkout')
    
    // Return comprehensive results
    return NextResponse.json({
      success: true,
      summary: {
        total: items.length,
        successful: successfulItems.length,
        failed: failedItems.length,
      },
      results,
      successfulItems,
      failedItems,
      message: successfulItems.length > 0 
        ? `Added ${successfulItems.length} of ${items.length} item(s) to cart. Navigated to cart page for checkout.`
        : `Failed to add items to cart.`,
      cartUrl: successfulItems.length > 0 ? 'https://www.sayweee.com/en/cart' : null,
    })
    
  } catch (error) {
    console.error('❌ Error in cart/add endpoint:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
