import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { detail: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Validate API key format
    if (DEEPGRAM_API_KEY.length < 20 || !/[a-zA-Z0-9]/.test(DEEPGRAM_API_KEY)) {
      return NextResponse.json(
        { detail: 'Deepgram API key format appears invalid. Please check your .env file.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { detail: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Try Deepgram SDK first
    try {
      const deepgram = createClient(DEEPGRAM_API_KEY);
      
      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        Buffer.from(audioData),
        {
          model: 'nova-2',
          smart_format: true,
        }
      );

      if (error) {
        throw error;
      }

      if (result?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        const transcript = result.results.channels[0].alternatives[0].transcript;
        if (transcript.trim()) {
          return NextResponse.json({ transcript });
        }
      }
    } catch (sdkError: any) {
      // Fallback to REST API
      console.log('SDK failed, trying REST API:', sdkError.message);
    }

    // Fallback to REST API
    const restUrl = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
    const response = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { detail: `Deepgram REST API error: ${response.status} - ${errorText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      const transcript = data.results.channels[0].alternatives[0].transcript;
      if (transcript.trim()) {
        return NextResponse.json({ transcript });
      }
    }

    return NextResponse.json(
      { detail: 'Deepgram returned empty transcript. Please try speaking again.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { detail: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}

