import { NextRequest, NextResponse } from 'next/server'
import { itemsDb, ItemSchema } from '@/lib/db'

type Params = Promise<{ id: string }>

// GET /api/items/[id] - Get a specific item
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  const itemId = parseInt(id, 10)
  
  const item = itemsDb.find((i) => i.id === itemId)
  
  if (!item) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(item)
}

// PUT /api/items/[id] - Update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id, 10)
    const body = await request.json()
    
    // Validate with Zod
    const validatedItem = ItemSchema.parse(body)
    
    // Find item index
    const itemIndex = itemsDb.findIndex((i) => i.id === itemId)
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }
    
    // Update item
    const updatedItem = {
      ...validatedItem,
      id: itemId,
    }
    itemsDb[itemIndex] = updatedItem
    
    return NextResponse.json(updatedItem)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  const itemId = parseInt(id, 10)
  
  const itemIndex = itemsDb.findIndex((i) => i.id === itemId)
  
  if (itemIndex === -1) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    )
  }
  
  // Remove item
  itemsDb.splice(itemIndex, 1)
  
  return NextResponse.json({
    message: 'Item deleted successfully',
  })
}
