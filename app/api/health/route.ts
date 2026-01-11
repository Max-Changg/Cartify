import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    deepgram_configured: !!process.env.DEEPGRAM_API_KEY,
    gemini_configured: !!process.env.GEMINI_API_KEY,
    spoonacular_configured: !!process.env.SPOONACULAR_API_KEY,
  })
}
