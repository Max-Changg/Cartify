# Weee! Browser Automation Setup

This project includes Playwright-based browser automation for interacting with sayweee.com.

## 🎉 Recent Updates

### Single Window Mode (Fixed!)
Previously, the automation would open and close a new browser window for each ingredient, which was slow and inefficient.

**Now Fixed:**
- ✅ Uses a **single browser window** for all items
- ✅ Much faster and more efficient
- ✅ Better user experience (no window flickering)
- ✅ More human-like behavior

**Key Functions:**
- `addMultipleItemsToWeeeCart(items)` - Batch add items in one window
- `getOrReuseWeeePage()` - Reuses existing page instead of creating new ones

## 📦 What's Installed

- `@playwright/test` - Playwright testing framework
- `playwright-core` - Playwright browser automation library
- Chromium browser (automatically downloaded)

## 🚀 How to Use

### 1. Core Functions

The main utilities are located in `app/lib/weee-browser.ts`:

#### `getWeeeContext()` - Browser Context Management
```typescript
import { getWeeeContext } from '@/lib/weee-browser'

// Get browser context (launches browser if not already running)
const context = await getWeeeContext()
```

#### `getOrReuseWeeePage()` - Single Window (Recommended)
```typescript
import { getOrReuseWeeePage } from '@/lib/weee-browser'

// Reuses existing page/window if available
// Perfect for batch operations!
const page = await getOrReuseWeeePage()
```

#### `getWeeePage()` - New Window
```typescript
import { getWeeePage } from '@/lib/weee-browser'

// Creates a NEW page/tab every time
// Use only when you need multiple windows
const page = await getWeeePage()
```

#### `addMultipleItemsToWeeeCart()` - Batch Add (Recommended)
```typescript
import { addMultipleItemsToWeeeCart } from '@/lib/weee-browser'

// Add multiple items using ONE browser window
const result = await addMultipleItemsToWeeeCart(['apple', 'banana', 'milk'])
```

#### `addItemToWeeeCart()` - Single Item
```typescript
import { addItemToWeeeCart } from '@/lib/weee-browser'

// Add single item (can optionally reuse a page)
const result = await addItemToWeeeCart('apple')

// OR reuse an existing page
const page = await getOrReuseWeeePage()
const result = await addItemToWeeeCart('apple', page)
```

### 2. Features

✅ **Persistent Session**
- User data saved in `.weee_user_data/` folder
- Stay logged in across sessions
- Cookies and local storage preserved

✅ **Headed Mode**
- Browser window visible (`headless: false`)
- Watch automation in real-time
- Easy debugging

✅ **Auto Login Check**
- Detects if you're logged in
- Waits for manual login if needed
- Continues automatically after login

### 3. Example API Route

Test the automation with the example endpoint:

```bash
# Start your Next.js server
npm run dev

# Call the test endpoint
curl http://localhost:3000/api/weee/test
```

Or visit in browser: http://localhost:3000/api/weee/test

### 4. How It Works

1. **First Run**: Browser launches, navigates to Weee!, waits for you to log in
2. **Subsequent Runs**: Reuses saved session, no login needed
3. **Session Check**: Automatically verifies login status before proceeding

## 📝 Example Usage Patterns

### Add Multiple Items (Batch) - NEW! 🎉

```bash
# Add multiple items at once
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"items":["apple","banana","milk","eggs"]}'
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 4,
    "successful": 4,
    "failed": 0
  },
  "results": [...],
  "successfulItems": ["apple", "banana", "milk", "eggs"],
  "failedItems": [],
  "message": "Added 4 of 4 item(s) to cart. Browser window left open."
}
```

**Features:**
- ✅ **Single browser window** - No more opening/closing windows for each item!
- ✅ Processes items sequentially
- ✅ Random delays (200-500ms) between items
- ✅ Human-like behavior
- ✅ Detailed results for each item
- ✅ Browser stays open to review

### Add Item to Cart (Single)

```typescript
import { addItemToWeeeCart } from '@/lib/weee-browser'

export async function POST(request: Request) {
  const { itemName } = await request.json()
  
  const result = await addItemToWeeeCart(itemName)
  
  return NextResponse.json(result)
}
```

**Or use the API endpoint:**

```bash
# Add an item to cart
curl -X POST http://localhost:3000/api/weee/add-to-cart \
  -H "Content-Type: application/json" \
  -d '{"itemName":"apple"}'
```

**Features:**
- ✅ Searches for the item
- ✅ Finds first in-stock product
- ✅ Hovers to reveal button
- ✅ Mouse movement with random jitter (bot evasion)
- ✅ Handles variant selection popups
- ✅ Detailed console logging

### Add Item to Cart (Built-in Function)

```typescript
import { addItemToWeeeCart } from '@/lib/weee-browser'

export async function POST(request: Request) {
  const { itemName } = await request.json()
  
  const result = await addItemToWeeeCart(itemName)
  
  return NextResponse.json(result)
}
```

**Or use the API endpoint:**

```bash
# Add an item to cart
curl -X POST http://localhost:3000/api/weee/add-to-cart \
  -H "Content-Type: application/json" \
  -d '{"itemName":"apple"}'
```

**Features:**
- ✅ Searches for the item
- ✅ Finds first in-stock product
- ✅ Mouse movement with random jitter (bot evasion)
- ✅ Handles variant selection popups
- ✅ Detailed console logging

### Basic Navigation

```typescript
import { getWeeeContext } from '@/lib/weee-browser'

export async function GET() {
  const context = await getWeeeContext()
  const page = await context.newPage()
  
  await page.goto('https://www.sayweee.com/en/s?keyword=apple')
  
  // Extract data
  const products = await page.locator('.product-item').all()
  
  await page.close()
  return NextResponse.json({ count: products.length })
}
```

### Scraping Product Information

```typescript
import { getWeeePage } from '@/lib/weee-browser'

export async function GET() {
  const page = await getWeeePage()
  
  await page.goto('https://www.sayweee.com/en/product/...')
  
  const productData = await page.evaluate(() => {
    return {
      name: document.querySelector('.product-name')?.textContent,
      price: document.querySelector('.price')?.textContent,
      // ... more fields
    }
  })
  
  await page.close()
  return NextResponse.json(productData)
}
```

### Adding to Cart

**✅ Recommended: Use Batch Function (Single Window)**

```typescript
import { addMultipleItemsToWeeeCart } from '@/lib/weee-browser'

export async function POST(request: Request) {
  const { items } = await request.json()
  
  // This uses a SINGLE browser window for all items
  const result = await addMultipleItemsToWeeeCart(items)
  
  return NextResponse.json(result)
}
```

**Legacy: Single Item (Opens New Window)**

```typescript
import { addItemToWeeeCart } from '@/lib/weee-browser'

export async function POST(request: Request) {
  const { itemName } = await request.json()
  
  // Note: This will open a new window each time
  // For multiple items, use addMultipleItemsToWeeeCart instead
  const result = await addItemToWeeeCart(itemName)
  
  return NextResponse.json(result)
}
```

**Manual approach with custom logic:**

```typescript
import { getWeeePage } from '@/lib/weee-browser'

export async function POST(request: Request) {
  const { productUrl } = await request.json()
  const page = await getWeeePage()
  
  await page.goto(productUrl)
  await page.click('button:has-text("Add to Cart")')
  await page.waitForTimeout(1000) // Wait for cart to update
  
  await page.close()
  return NextResponse.json({ success: true })
}
```

## 🛠️ Configuration

### Customizing Browser Options

Edit `app/lib/weee-browser.ts`:

```typescript
context = await chromium.launchPersistentContext(USER_DATA_DIR, {
  headless: false,          // Set to true for headless mode
  viewport: { width: 1280, height: 800 },
  slowMo: 100,              // Slow down by 100ms (for debugging)
  // Add more options...
})
```

### Changing User Data Location

```typescript
const USER_DATA_DIR = path.join(process.cwd(), 'my-custom-folder')
```

## 🔒 Security Notes

- `.weee_user_data/` is in `.gitignore` (never commit it!)
- Contains your login session and cookies
- Keep this folder secure and private

## 📚 Playwright Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Actions](https://playwright.dev/docs/input)
- [Assertions](https://playwright.dev/docs/test-assertions)

## 🐛 Troubleshooting

### Browser doesn't launch
```bash
# Reinstall browsers
npx playwright install chromium
```

### Login not detected
- Check if login selectors are correct in `checkIfLoggedIn()`
- Update selectors based on Weee!'s current HTML structure
- Add console logs to debug

### Session expired
- Delete `.weee_user_data/` folder
- Browser will launch and ask you to log in again

## 🎯 Next Steps

1. Create custom automation scripts
2. Add error handling and retries
3. Implement rate limiting
4. Add logging for debugging
5. Create scheduled jobs with cron

---

**Happy Automating! 🤖**
