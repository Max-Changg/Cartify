import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// This endpoint tests the Deepgram Agent API from the SERVER side
// to determine if the issue is browser-specific (CORS) or general
export async function GET(request: NextRequest) {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'No API key' }, { status: 500 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Check if we can reach the Agent API endpoint at all
  try {
    const healthCheck = await fetch('https://agent.deepgram.com/', {
      method: 'HEAD',
    });
    results.tests.push({
      test: 'Agent endpoint reachability',
      status: healthCheck.status,
      ok: healthCheck.ok
    });
  } catch (e: any) {
    results.tests.push({
      test: 'Agent endpoint reachability',
      error: e.message
    });
  }

  // Test 2: Test STT endpoint (known working)
  try {
    const sttTest = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com/audio.mp3' })
    });
    results.tests.push({
      test: 'STT API access',
      status: sttTest.status,
      working: sttTest.status !== 401
    });
  } catch (e: any) {
    results.tests.push({
      test: 'STT API access',
      error: e.message
    });
  }

  // Test 3: Check API key scopes
  try {
    const projectsResponse = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
    });
    const projectsData = await projectsResponse.json();
    results.tests.push({
      test: 'API key projects access',
      status: projectsResponse.status,
      projects: projectsData.projects?.length || 0,
      data: projectsData
    });
  } catch (e: any) {
    results.tests.push({
      test: 'API key projects access',
      error: e.message
    });
  }

  // Test 4: Check if there's an Agent-specific endpoint
  try {
    const agentInfoResponse = await fetch('https://api.deepgram.com/v1/agent', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
    });
    results.tests.push({
      test: 'Agent REST API access',
      status: agentInfoResponse.status,
      body: await agentInfoResponse.text().catch(() => 'Could not read body')
    });
  } catch (e: any) {
    results.tests.push({
      test: 'Agent REST API access',
      error: e.message
    });
  }

  // Add recommendations based on results
  results.recommendations = [];
  
  // Check if STT works but Agent doesn't
  const sttResult = results.tests.find((t: any) => t.test === 'STT API access');
  if (sttResult?.working) {
    results.recommendations.push('STT API works - API key is valid');
  }

  results.keyInfo = {
    length: DEEPGRAM_API_KEY.length,
    prefix: DEEPGRAM_API_KEY.substring(0, 8),
    format: DEEPGRAM_API_KEY.length === 40 ? 'Standard (40 chars)' : `Non-standard (${DEEPGRAM_API_KEY.length} chars)`
  };

  return NextResponse.json(results);
}
