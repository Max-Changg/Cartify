import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, voice = 'aura-2-thalia-en' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('🎤 Synthesizing speech:', text.substring(0, 50) + '...');

    // Call Deepgram TTS API
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}&encoding=linear16&sample_rate=16000&container=none`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepgram TTS error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to synthesize speech' },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();
    console.log('✅ Synthesized audio:', audioData.byteLength, 'bytes');

    // Return the audio data
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/pcm',
        'Content-Length': audioData.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Synthesis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}
