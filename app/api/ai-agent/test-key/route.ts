import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({
        valid: false,
        error: 'DEEPGRAM_API_KEY not configured'
      });
    }

    // Test the API key by making a simple request to Deepgram
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        valid: true,
        keyLength: DEEPGRAM_API_KEY.length,
        keyPrefix: DEEPGRAM_API_KEY.substring(0, 8),
        projects: data.projects?.length || 0,
        message: 'API key is valid! If Agent connection still fails, your key may not have Agent API access.'
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        valid: false,
        status: response.status,
        error: errorText.substring(0, 200),
        message: 'API key validation failed'
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      valid: false,
      error: error.message,
      message: 'Failed to validate API key'
    });
  }
}
