'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Package, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

export default function WeeeTestPage() {
  const [itemName, setItemName] = useState('apple')
  const [itemList, setItemList] = useState('apple\nbanana\nmilk')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testConnection = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/weee/test')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Failed to connect' })
    } finally {
      setLoading(false)
    }
  }

  const cleanup = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/weee/cleanup', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Failed to cleanup' })
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/weee/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Failed to add item' })
    } finally {
      setLoading(false)
    }
  }

  const addMultipleToCart = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      // Parse items from textarea (one per line)
      const items = itemList
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
      
      if (items.length === 0) {
        setResult({ success: false, error: 'No items to add' })
        setLoading(false)
        return
      }
      
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Failed to add items' })
    } finally {
      setLoading(false)
    }
  }

  const viewCart = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/cart/view', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Failed to open cart' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold">Weee! Automation</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Test Playwright browser automation
          </p>
        </div>

        <div className="grid gap-6">
          {/* Cleanup */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle>🧹 Cleanup (If Needed)</CardTitle>
              <CardDescription>
                If browser fails to launch, click here to clean up lock files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={cleanup} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  'Clean Up Lock Files'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle>1. Test Connection</CardTitle>
              <CardDescription>
                Verify the browser launches and you're logged in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testConnection} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Add to Cart */}
          <Card>
            <CardHeader>
              <CardTitle>2. Add Single Item</CardTitle>
              <CardDescription>
                Search for an item and add it to your Weee! cart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Enter item name (e.g., apple)"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button 
                onClick={addToCart} 
                disabled={loading || !itemName}
                className="w-full"
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Add Multiple to Cart */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle>3. Add Multiple Items (Batch)</CardTitle>
              <CardDescription>
                Add multiple items at once with human-like delays. Cart page opens automatically when done!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Item List (one per line)
                </label>
                <textarea
                  value={itemList}
                  onChange={(e) => setItemList(e.target.value)}
                  placeholder="apple&#10;banana&#10;milk"
                  rows={5}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter one item name per line. Random delays (200-500ms) will be added between items.
                </p>
              </div>
              <Button 
                onClick={addMultipleToCart} 
                disabled={loading || !itemList.trim()}
                className="w-full"
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Items...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add All to Cart
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* View Cart */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle>4. View Cart</CardTitle>
              <CardDescription>
                Navigate to your cart to review items and checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={viewCart} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Cart & Checkout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <Package className="w-5 h-5 text-green-500" />
                      Success
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 text-red-500" />
                      Error
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📖 Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>First Time Setup:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Click "Test Connection" - a Chrome browser will open</li>
              <li>Log in to Weee! in the browser window</li>
              <li>Once logged in, the test will complete automatically</li>
              <li>Your session is saved for future use!</li>
            </ol>
            <p className="mt-4"><strong>Adding Items:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Enter an item name (e.g., "apple", "banana", "milk")</li>
              <li>Click "Add to Cart"</li>
              <li>Watch the browser automation in action!</li>
              <li>Check the results below</li>
            </ol>
            <p className="mt-4 text-muted-foreground">
              💡 Tip: Keep the browser window visible to watch the automation work!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
