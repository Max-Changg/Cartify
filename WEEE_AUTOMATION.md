# Weee! Browser Automation Setup

This project includes Playwright-based browser automation for interacting with sayweee.com.

## 📦 What's Installed

- `@playwright/test` - Playwright testing framework
- `playwright-core` - Playwright browser automation library
- Chromium browser (automatically downloaded)

## 🚀 How to Use

### 1. Using the Utility Function

The main utility is located in `app/lib/weee-browser.ts`:

```typescript
import { getWeeeContext, getWeeePage } from '@/lib/weee-browser'

// Get browser context (launches browser if not already running)
const context = await getWeeeContext()

// Create a new page
const page = await getWeeePage()

// Navigate and interact
await page.goto('https://www.sayweee.com')
const title = await page.title()

// Close the page when done
await page.close()
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
