import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Test WebSocket connection from SERVER side
// If this works but browser doesn't, it's a CORS issue
export async function GET(request: NextRequest) {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'No DEEPGRAM_API_KEY' }, { status: 500 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    apiKey: {
      length: DEEPGRAM_API_KEY.length,
      prefix: DEEPGRAM_API_KEY.substring(0, 8),
    },
    tests: []
  };

  // Test: Try to establish WebSocket connection using HTTP upgrade request
  // This simulates what the WebSocket handshake looks like
  try {
    // WebSocket upgrade request headers
    const upgradeResponse = await fetch('https://agent.deepgram.com/agent', {
      method: 'GET',
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      },
    });

    results.tests.push({
      test: 'HTTP Upgrade request to Agent API',
      status: upgradeResponse.status,
      statusText: upgradeResponse.statusText,
      headers: Object.fromEntries(upgradeResponse.headers.entries()),
    });
  } catch (e: any) {
    results.tests.push({
      test: 'HTTP Upgrade request to Agent API',
      error: e.message,
      errorType: e.name,
    });
  }

  // Test: Check if endpoint accepts regular HTTP (should return 426 Upgrade Required or similar)
  try {
    const httpResponse = await fetch('https://agent.deepgram.com/agent', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
    });

    results.tests.push({
      test: 'Regular HTTP GET to Agent API',
      status: httpResponse.status,
      statusText: httpResponse.statusText,
      body: await httpResponse.text().catch(() => '(could not read)'),
    });
  } catch (e: any) {
    results.tests.push({
      test: 'Regular HTTP GET to Agent API',
      error: e.message,
    });
  }

  // Test: Check with query param auth
  try {
    const queryParamResponse = await fetch(`https://agent.deepgram.com/agent?token=${DEEPGRAM_API_KEY}`, {
      method: 'GET',
    });

    results.tests.push({
      test: 'HTTP GET with query param auth',
      status: queryParamResponse.status,
      statusText: queryParamResponse.statusText,
    });
  } catch (e: any) {
    results.tests.push({
      test: 'HTTP GET with query param auth',
      error: e.message,
    });
  }

  // Analyze results and provide recommendations
  results.analysis = [];
  
  const httpTest = results.tests.find((t: any) => t.test === 'Regular HTTP GET to Agent API');
  if (httpTest?.status === 426) {
    results.analysis.push('Endpoint exists and expects WebSocket upgrade (426 is correct)');
  } else if (httpTest?.status === 401) {
    results.analysis.push('Authentication failed - API key rejected');
  } else if (httpTest?.status === 403) {
    results.analysis.push('Forbidden - API key may lack Agent API permissions');
  } else if (httpTest?.status === 404) {
    results.analysis.push('Endpoint not found - Agent API may not be enabled');
  }

  return NextResponse.json(results);
}
