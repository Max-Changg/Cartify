import { z } from 'zod'

// Item schema using Zod (equivalent to Pydantic model)
export const ItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
})

export type Item = z.infer<typeof ItemSchema>

// In-memory storage (replace with database in production)
export const itemsDb: Item[] = []
export let itemIdCounter = 1

// Helper to get next ID
export function getNextItemId(): number {
  return itemIdCounter++
}
