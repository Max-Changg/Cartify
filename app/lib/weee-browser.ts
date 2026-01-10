import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { chromium, type Browser, type BrowserContext } from 'playwright-core'

const WEEE_HOME_URL = 'https://www.sayweee.com'
const USER_DATA_DIR = path.join(process.cwd(), '.weee_user_data')

let browser: Browser | null = null
let context: BrowserContext | null = null

/**
 * Kill any lingering Chrome processes using the user data directory
 */
function killLingeringChromeProcesses() {
  try {
    console.log('🔍 Checking for lingering Chrome processes...')
    
    // Find Chrome processes using our user data directory
    const grepCmd = `ps aux | grep "${USER_DATA_DIR}" | grep -v grep | awk '{print $2}'`
    const pids = execSync(grepCmd, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean)
    
    if (pids.length > 0) {
      console.log(`🔪 Found ${pids.length} lingering Chrome process(es), killing...`)
      
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`)
          console.log(`✅ Killed process ${pid}`)
        } catch (error) {
          console.warn(`⚠️  Could not kill process ${pid}`)
        }
      }
      
      // Wait a bit for processes to die
      execSync('sleep 0.5')
    } else {
      console.log('✅ No lingering Chrome processes found')
    }
  } catch (error) {
    console.warn('⚠️  Could not check for Chrome processes:', error)
  }
}

/**
 * Clean up stale lock files from the user data directory
 */
function cleanupStaleLocks() {
  try {
    const lockFile = path.join(USER_DATA_DIR, 'SingletonLock')
    const lockSocket = path.join(USER_DATA_DIR, 'SingletonSocket')
    const lockCookie = path.join(USER_DATA_DIR, 'SingletonCookie')
    
    let cleaned = 0
    
    if (fs.existsSync(lockFile)) {
      console.log('🧹 Cleaning up SingletonLock...')
      fs.unlinkSync(lockFile)
      cleaned++
    }
    
    if (fs.existsSync(lockSocket)) {
      console.log('🧹 Cleaning up SingletonSocket...')
      fs.unlinkSync(lockSocket)
      cleaned++
    }
    
    if (fs.existsSync(lockCookie)) {
      console.log('🧹 Cleaning up SingletonCookie...')
      fs.unlinkSync(lockCookie)
      cleaned++
    }
    
    if (cleaned > 0) {
      console.log(`✅ Cleaned up ${cleaned} lock file(s)`)
    }
  } catch (error) {
    console.warn('⚠️  Could not clean up lock files:', error)
  }
}

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

  // Kill any lingering Chrome processes and clean up lock files
  killLingeringChromeProcesses()
  cleanupStaleLocks()

  // Launch browser with persistent context
  try {
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
  } catch (error) {
    // If launch fails, do aggressive cleanup and retry
    if (error instanceof Error && error.message.includes('ProcessSingleton')) {
      console.log('⚠️  Lock file issue detected, doing aggressive cleanup and retrying...')
      
      killLingeringChromeProcesses()
      cleanupStaleLocks()
      
      // Wait longer for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Retry launch
      context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
        ],
      })
    } else {
      throw error
    }
  }
  
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

/**
 * Add an item to the Weee! cart
 * 
 * @param itemName - Name of the item to search for
 * @returns Object with success status and details
 */
export async function addItemToWeeeCart(itemName: string) {
  console.log(`🛒 Adding item to cart: "${itemName}"`)
  
  const page = await getWeeePage()
  
  try {
    // Navigate to search results
    const searchUrl = `https://www.sayweee.com/en/search?keyword=${encodeURIComponent(itemName)}`
    console.log(`🔍 Navigating to: ${searchUrl}`)
    await page.goto(searchUrl, { waitUntil: 'networkidle' })
    
    // Wait for search results to load
    await page.waitForTimeout(3000)
    
    // Wait for product cards to be visible
    console.log('⏳ Waiting for product cards to load...')
    await page.waitForSelector('button[data-testid="btn-atc-plus"]', { 
      timeout: 10000 
    }).catch(() => console.log('⚠️  Timeout waiting for add to cart buttons'))
    
    // Find the first product card
    const productCardSelectors = [
      '[class*="ProductCard"]',
      '[class*="product-card"]',
      '[class*="product-item"]',
      '[data-testid*="product"]',
      '.item-card',
      'article',
      'div[class*="product"]',
    ]
    
    let productCard = null
    let productName = 'Unknown Product'
    
    // Try to find a product card
    for (const selector of productCardSelectors) {
      productCard = page.locator(selector).first()
      const isVisible = await productCard.isVisible().catch(() => false)
      
      if (isVisible) {
        console.log(`✅ Found product card with selector: ${selector}`)
        
        // Try to get the product name from within this card
        try {
          const nameElement = productCard.locator('[class*="name"], h3, h4, [class*="title"], [aria-label]').first()
          productName = await nameElement.textContent() || productName
          console.log(`📦 Product found: ${productName.trim()}`)
        } catch (error) {
          console.log('⚠️  Could not extract product name')
        }
        
        break
      }
    }
    
    if (!productCard || !(await productCard.isVisible().catch(() => false))) {
      console.log('❌ No product cards found')
      await page.close()
      return {
        success: false,
        message: 'No products found',
        itemName,
      }
    }
    
    // CRITICAL: Hover over the product card to reveal the "Add to Cart" button
    // The button has max-w-[0] and only expands on hover!
    console.log('🖱️  Hovering over product card to reveal Add to Cart button...')
    await productCard.hover()
    
    // Wait a moment for the hover animation to complete
    await page.waitForTimeout(500)
    
    // Now find the add to cart button (should be visible after hover)
    console.log('🔍 Looking for add to cart button...')
    const addToCartButton = page.locator('button[data-testid="btn-atc-plus"]').first()
    
    // Wait for it to be visible after hover
    await addToCartButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {
      console.log('⚠️  Button still not visible after hover')
    })
    
    const isButtonVisible = await addToCartButton.isVisible().catch(() => false)
    
    if (!isButtonVisible) {
      console.log('❌ Could not find add to cart button even after hover')
      await page.close()
      return {
        success: false,
        message: 'Could not find Add to Cart button',
        itemName,
      }
    }
    
    console.log('✅ Found add to cart button!')

    
    // Bot evasion: Move mouse with random jitter
    console.log('🖱️  Moving mouse to button with random jitter...')
    const buttonBox = await addToCartButton.boundingBox()
    
    if (buttonBox) {
      // Calculate target position with random jitter (±5 pixels)
      const targetX = buttonBox.x + buttonBox.width / 2 + (Math.random() * 10 - 5)
      const targetY = buttonBox.y + buttonBox.height / 2 + (Math.random() * 10 - 5)
      
      // Move mouse with smooth animation
      await page.mouse.move(targetX, targetY, { steps: 10 })
      
      // Random small delay (100-300ms)
      await page.waitForTimeout(100 + Math.random() * 200)
    }
    
    // Click the button
    console.log('👆 Clicking "Add to Cart" button...')
    await addToCartButton.click()
    
    // Wait for potential variant popup or cart update
    await page.waitForTimeout(1500)
    
    // Handle variants popup if it appears
    const variantSelectors = [
      '[class*="variant"], [class*="modal"], [class*="popup"], [role="dialog"]',
    ]
    
    for (const selector of variantSelectors) {
      const variantPopup = page.locator(selector)
      const isVisible = await variantPopup.isVisible().catch(() => false)
      
      if (isVisible) {
        console.log('📋 Variant selection popup detected, selecting first option...')
        
        // Try to find and click the first variant option
        const firstVariant = page.locator('button[class*="variant"], button[class*="option"], [role="radio"]').first()
        const variantVisible = await firstVariant.isVisible().catch(() => false)
        
        if (variantVisible) {
          await firstVariant.click()
          console.log('✅ Selected first variant option')
          await page.waitForTimeout(500)
        }
        
        // Try to find and click the confirm/add button in the popup
        const confirmButton = page.locator('button:has-text("Add"), button:has-text("Confirm"), button:has-text("确认")').first()
        const confirmVisible = await confirmButton.isVisible().catch(() => false)
        
        if (confirmVisible) {
          await confirmButton.click()
          console.log('✅ Confirmed variant selection')
          await page.waitForTimeout(1000)
        }
        
        break
      }
    }
    
    console.log(`✅ Successfully added item to cart: ${productName.trim()}`)
    
    await page.close()
    
    return {
      success: true,
      message: 'Item added to cart',
      itemName,
      productName: productName.trim(),
    }
  } catch (error) {
    console.error('❌ Error adding item to cart:', error)
    await page.close()
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      itemName,
    }
  }
}
