import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { detail: 'Deepgram API key not configured. Add DEEPGRAM_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Return the API key for the Deepgram SDK
    // The SDK handles WebSocket connection and configuration internally
    return NextResponse.json({
      deepgramKey: DEEPGRAM_API_KEY
    });
  } catch (error: any) {
    console.error('Agent connection setup error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to setup agent connection' },
      { status: 500 }
    );
  }
}
