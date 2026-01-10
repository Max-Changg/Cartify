import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Package } from 'lucide-react'

interface Item {
  id: number
  name: string
  description: string
  price: number
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [status, setStatus] = useState<string>('disconnected')

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => {
        setStatus(data.status)
      })
      .catch(() => {
        setStatus('disconnected')
      })

    // Fetch items
    fetch('http://localhost:8000/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Error fetching items:', err))
  }, [])

  const addSampleItem = async () => {
    const newItem = {
      name: `Sample Item ${items.length + 1}`,
      description: 'This is a sample item from the frontend',
      price: Math.floor(Math.random() * 100) + 10
    }

    try {
      const response = await fetch('http://localhost:8000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      })
      const createdItem = await response.json()
      setItems([...items, createdItem])
    } catch (err) {
      console.error('Error creating item:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Cartify
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Full-Stack Starter Template
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              Backend: {status === 'healthy' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
              <CardDescription>This baseline includes everything you need to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Backend</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Python 3.x</li>
                    <li>✓ FastAPI</li>
                    <li>✓ Uvicorn</li>
                    <li>✓ Pydantic</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Frontend</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ React 18</li>
                    <li>✓ TypeScript</li>
                    <li>✓ Vite</li>
                    <li>✓ Tailwind CSS</li>
                    <li>✓ shadcn/ui</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Items</h2>
            </div>
            <Button onClick={addSampleItem}>
              Add Sample Item
            </Button>
          </div>

          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No items yet</p>
                <Button onClick={addSampleItem} variant="outline">
                  Create Your First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <div className="text-2xl font-bold">${item.price.toFixed(2)}</div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
