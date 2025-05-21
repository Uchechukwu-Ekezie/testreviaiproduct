import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to serve as a CORS proxy for our backend API calls
 * @param request The incoming request with target URL in the query parameter
 * @returns The proxied response from the target URL
 */
export async function POST(request: NextRequest) {
  try {
    // Get the target URL from the query parameters
    const targetUrl = request.nextUrl.searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing target URL' },
        { status: 400 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Get the response data
    const data = await response.json().catch(() => null);
    
    // Create headers for the response
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the proxied response
    return NextResponse.json(data, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the target URL from the query parameters
    const targetUrl = request.nextUrl.searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing target URL' },
        { status: 400 }
      );
    }
    
    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Get the response data
    const data = await response.json().catch(() => null);
    
    // Create headers for the response
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the proxied response
    return NextResponse.json(data, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  // Handle preflight requests
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, {
    status: 204,
    headers
  });
} 