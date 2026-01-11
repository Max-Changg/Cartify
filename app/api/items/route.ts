import { NextRequest, NextResponse } from 'next/server'
import { itemsDb, getNextItemId, ItemSchema } from '@/lib/db'

// GET /api/items - Get all items
export async function GET() {
  return NextResponse.json(itemsDb)
}

// POST /api/items - Create a new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate with Zod
    const validatedItem = ItemSchema.parse(body)
    
    // Assign ID
    const newItem = {
      ...validatedItem,
      id: getNextItemId(),
    }
    
    // Add to database
    itemsDb.push(newItem)
    
    return NextResponse.json(newItem, { status: 201 })
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
