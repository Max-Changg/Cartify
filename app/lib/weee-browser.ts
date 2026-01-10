import { chromium, type BrowserContext, type Browser } from 'playwright-core'
import * as path from 'path'

const WEEE_HOME_URL = 'https://www.sayweee.com'
const USER_DATA_DIR = path.join(process.cwd(), '.weee_user_data')

let browser: Browser | null = null
let context: BrowserContext | null = null

/**
 * Check if the context is still valid (not closed)
 */
async function isContextValid(ctx: BrowserContext | null): Promise<boolean> {
  if (!ctx) return false
  
  try {
    // Try to get pages - this will fail if context is closed
    const pages = ctx.pages()
    return pages !== null
  } catch (error) {
    return false
  }
}

/**
 * Get or create a persistent browser context for Weee! automation.
 * 
 * Features:
 * - Persistent user data (saved in .weee_user_data folder)
 * - Headed mode (visible browser window)
 * - Waits for manual login if not already logged in
 * - Auto-reopens if browser was closed manually
 * 
 * @returns {Promise<BrowserContext>} Playwright browser context
 */
export async function getWeeeContext(): Promise<BrowserContext> {
  // Check if existing context is still valid
  const isValid = await isContextValid(context)
  
  if (context && isValid) {
    console.log('✅ Reusing existing browser context')
    return context
  }
  
  // Reset if context was closed
  if (context && !isValid) {
    console.log('🔄 Previous browser was closed, creating new one...')
    context = null
  }

  console.log('🌐 Launching browser for Weee! automation...')
  console.log(`📁 User data directory: ${USER_DATA_DIR}`)

  // Launch browser with persistent context
  context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false, // Visible browser
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled', // Hide automation flags
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  })
  
  // Listen for context close event to reset the variable
  context.on('close', () => {
    console.log('🔒 Browser context closed')
    context = null
  })

  // Get the first page or create a new one
  const pages = context.pages()
  const page = pages.length > 0 ? pages[0] : await context.newPage()

  // Check if we're on Weee! and logged in
  const currentUrl = page.url()
  
  if (!currentUrl.includes('sayweee.com')) {
    console.log('🔄 Navigating to Weee! homepage...')
    await page.goto(WEEE_HOME_URL, { waitUntil: 'networkidle' })
  }

  // Check if user is logged in
  const isLoggedIn = await checkIfLoggedIn(page)

  if (!isLoggedIn) {
    console.log('⚠️  Not logged in to Weee!')
    console.log('👤 Please log in manually in the browser window...')
    console.log('⏳ Waiting for login...')

    // Wait for login to complete
    await waitForLogin(page)
    
    console.log('✅ Login detected! Continuing...')
  } else {
    console.log('✅ Already logged in to Weee!')
  }

  return context
}

/**
 * Check if the user is logged in to Weee!
 */
async function checkIfLoggedIn(page: any): Promise<boolean> {
  try {
    // Check for common login indicators
    // Adjust these selectors based on Weee!'s actual HTML structure
    
    // Method 1: Check for logout button or user menu
    const userMenuExists = await page.locator('[data-testid="user-menu"], .user-menu, [aria-label*="Account"], [aria-label*="Profile"]').count() > 0
    
    if (userMenuExists) {
      return true
    }

    // Method 2: Check if we're on a login page
    const isLoginPage = page.url().includes('/login') || page.url().includes('/signin')
    if (isLoginPage) {
      return false
    }

    // Method 3: Check for login button (if exists, user is not logged in)
    const loginButtonExists = await page.locator('text=/log in|sign in/i').first().isVisible().catch(() => false)
    
    return !loginButtonExists
  } catch (error) {
    console.error('Error checking login status:', error)
    return false
  }
}

/**
 * Wait for the user to log in manually
 */
async function waitForLogin(page: any): Promise<void> {
  const maxWaitTime = 5 * 60 * 1000 // 5 minutes
  const checkInterval = 2000 // Check every 2 seconds

  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    const isLoggedIn = await checkIfLoggedIn(page)
    
    if (isLoggedIn) {
      return
    }

    // Wait before checking again
    await page.waitForTimeout(checkInterval)
  }

  throw new Error('Login timeout: User did not log in within 5 minutes')
}

/**
 * Close the browser context and browser
 */
export async function closeWeeeContext(): Promise<void> {
  if (context) {
    await context.close()
    context = null
  }
  
  if (browser) {
    await browser.close()
    browser = null
  }
  
  console.log('🔒 Browser closed')
}

/**
 * Get a new page from the context
 */
export async function getWeeePage() {
  const ctx = await getWeeeContext()
  
  try {
    return await ctx.newPage()
  } catch (error) {
    // If creating a new page fails, reset context and try again
    console.log('⚠️  Failed to create page, resetting context...')
    context = null
    const newCtx = await getWeeeContext()
    return await newCtx.newPage()
  }
}
