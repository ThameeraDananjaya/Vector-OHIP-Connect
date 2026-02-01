export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ProxyRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  environment: string;
  collection: string;
  endpoint: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logEntry: any = {};
  
  try {
    const body: ProxyRequest = await request.json();
    const { method, url, headers = {}, body: requestBody, environment, collection, endpoint } = body;

    logEntry = {
      collection,
      endpoint,
      method,
      url,
      requestBody: requestBody ? JSON.stringify(requestBody) : null,
    };

    // Get cached token
    const envKey = ['property', 'workflows', 'nor1'].includes(collection) ? 'opera_cloud' : 
                   ['ra_data', 'ra_storage'].includes(collection) ? 'ra_storage' : collection;
    
    const cachedToken = await prisma.tokenCache.findUnique({
      where: { environment: envKey },
    });

    if (!cachedToken || new Date() > cachedToken.expiresAt) {
      logEntry.error = 'Token expired or not found';
      logEntry.statusCode = 401;
      
      await prisma.apiLog.create({ data: { ...logEntry, duration: Date.now() - startTime } });
      
      return NextResponse.json(
        { error: 'Token expired or not found. Please refresh the token.' },
        { status: 401 }
      );
    }

    // Build request headers
    const requestHeaders: Record<string, string> = {
      'Authorization': `${cachedToken.tokenType} ${cachedToken.accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    };

    // Make the API request
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    }

    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    let responseData: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    logEntry.statusCode = response.status;
    logEntry.responseBody = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
    logEntry.duration = duration;

    await prisma.apiLog.create({ data: logEntry });

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      success: response.ok,
      statusCode: response.status,
      data: responseData,
      headers: responseHeaders,
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logEntry.error = error?.message || 'Proxy request failed';
    logEntry.statusCode = 500;
    logEntry.duration = duration;

    try {
      await prisma.apiLog.create({ data: logEntry });
    } catch (logError) {
      console.error('Failed to log API call:', logError);
    }

    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error?.message || 'Proxy request failed' },
      { status: 500 }
    );
  }
}
