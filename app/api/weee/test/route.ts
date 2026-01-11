import { getWeeeContext, getWeeePage } from '@/lib/weee-browser'
import { NextResponse } from 'next/server'

interface AddToCartItem {
  name: string
  quantity?: number
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const items: AddToCartItem[] = body.items

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided' },
        { status: 400 }
      )
    }

    console.log('🛒 Starting Weee! add-to-cart flow:', items.map(i => i.name))

    // Ensure browser + logged-in context
    await getWeeeContext()
    const page = await getWeeePage()

    // Go to homepage
    await page.goto('https://www.sayweee.com', { waitUntil: 'networkidle' })

    const results: { name: string; success: boolean; error?: string }[] = []

    for (const item of items) {
      try {
        console.log(`🔍 Searching for "${item.name}"`)

        // Focus search bar
        await page.waitForSelector('input[type="search"]', { timeout: 10000 })
        await page.fill('input[type="search"]', item.name)
        await page.keyboard.press('Enter')

        // Wait for search results
        await page.waitForTimeout(2500)

        // Find first "Add to Cart" button
        const addButton = await page.$(
          'button:has-text("Add"), button:has-text("+")'
        )

        if (!addButton) {
          throw new Error('Add to Cart button not found')
        }

        const quantity = item.quantity ?? 1
        for (let i = 0; i < quantity; i++) {
          await addButton.click()
          await page.waitForTimeout(400)
        }

        console.log(`✅ Added "${item.name}" x${quantity}`)
        results.push({ name: item.name, success: true })
      } catch (err: any) {
        console.error(`❌ Failed to add "${item.name}"`, err.message)
        results.push({
          name: item.name,
          success: false,
          error: err.message,
        })
      }
    }

    await page.close()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('❌ Weee automation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
