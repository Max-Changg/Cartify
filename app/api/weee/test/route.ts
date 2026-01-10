import { getWeeeContext, getWeeePage } from '@/lib/weee-browser'
import { NextResponse } from 'next/server'

/**
 * Example API route that uses Weee! browser automation
 * 
 * GET /api/weee/test
 */
export async function GET() {
  try {
    console.log('🚀 Starting Weee! automation test...')
    
    // Get the browser context (will launch browser and wait for login if needed)
    const context = await getWeeeContext()
    
    // Create a new page
    const page = await getWeeePage()
    
    // Navigate to Weee! homepage
    await page.goto('https://www.sayweee.com', { waitUntil: 'networkidle' })
    
    // Get the page title
    const title = await page.title()
    
    // Get the current URL
    const url = page.url()
    
    console.log(`✅ Successfully accessed Weee! - Title: ${title}`)
    
    // Close the page (keep context open for reuse)
    await page.close()
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Weee!',
      data: {
        title,
        url,
      },
    })
  } catch (error) {
    console.error('❌ Error in Weee! automation:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
