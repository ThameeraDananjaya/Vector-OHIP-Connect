export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface TokenRequest {
  environment: string;
  credentials: Record<string, string>;
}

// Helper to get credential value with multiple possible key names
function getCredential(credentials: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (credentials[key]) return credentials[key];
  }
  return '';
}

async function fetchOperaCloudToken(credentials: Record<string, string>): Promise<any> {
  // Support both naming conventions (camelCase and UPPER_SNAKE_CASE)
  const hostName = getCredential(credentials, 'HostName', 'HOSTNAME', 'hostname', 'Host');
  const appKey = getCredential(credentials, 'AppKey', 'APP_KEY', 'appKey', 'x-app-key');
  const clientId = getCredential(credentials, 'ClientId', 'CLIENT_ID', 'clientId', 'client_id');
  const clientSecret = getCredential(credentials, 'ClientSecret', 'CLIENT_SECRET', 'clientSecret', 'client_secret');
  const enterpriseId = getCredential(credentials, 'EnterpriseId', 'ENTERPRISE_ID', 'enterpriseId');
  
  const tokenUrl = `${hostName}/oauth/v1/tokens`;
  
  console.log('OPERA Cloud Token Request (Client Credentials):', {
    url: tokenUrl,
    appKey: appKey ? appKey.substring(0, 8) + '***' : 'MISSING',
    clientId: clientId ? clientId.substring(0, 8) + '***' : 'MISSING',
    clientSecret: clientSecret ? '***' : 'MISSING',
    enterpriseId: enterpriseId || 'MISSING',
  });
  
  // Client Credentials flow (as per Postman "Get OAuth Token for Client Credentials environments")
  const body = 'grant_type=client_credentials&scope=urn:opc:hgbu:ws:__myscopes__';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-app-key': appKey,
    'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
  };
  
  // enterpriseId header is required for Client Credentials flow
  if (enterpriseId) {
    headers['enterpriseId'] = enterpriseId;
  }

  console.log('OPERA Cloud Token - Headers:', Object.keys(headers));
  console.log('OPERA Cloud Token - Body:', body);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OPERA Cloud Token Error:', response.status, errorText);
    throw new Error(`Token request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function fetchDistributionToken(credentials: Record<string, string>): Promise<any> {
  const hostName = getCredential(credentials, 'HostName', 'HOSTNAME', 'hostname');
  const appKey = getCredential(credentials, 'AppKey', 'APP_KEY', 'appKey');
  const clientId = getCredential(credentials, 'ClientId', 'CLIENT_ID', 'clientId');
  const clientSecret = getCredential(credentials, 'ClientSecret', 'CLIENT_SECRET', 'clientSecret');
  const username = getCredential(credentials, 'Username', 'USERNAME', 'username');
  const password = getCredential(credentials, 'Password', 'PASSWORD', 'password');
  
  // Distribution uses /hdpba/oauth2/v1/token endpoint
  const tokenUrl = `${hostName}/hdpba/oauth2/v1/token`;
  const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password`;

  console.log('Distribution Token Request:', {
    url: tokenUrl,
    appKey: appKey ? '***' : 'MISSING',
    clientId: clientId ? '***' : 'MISSING',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-app-key': appKey,
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Distribution Token Error:', response.status, errorText);
    throw new Error(`Token request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function fetchRAStorageToken(credentials: Record<string, string>): Promise<any> {
  const idcsHostName = getCredential(credentials, 'IDCSHostName', 'IDCS_HOSTNAME', 'idcsHostName');
  const appId = getCredential(credentials, 'APPId', 'APP_ID', 'appId', 'ClientId', 'CLIENT_ID');
  const appSecret = getCredential(credentials, 'APPSecret', 'APP_SECRET', 'appSecret', 'ClientSecret', 'CLIENT_SECRET');
  
  const tokenUrl = `${idcsHostName}/oauth2/v1/token`;
  const body = `grant_type=client_credentials&scope=urn:opc:idm:__myscopes__`;

  console.log('R&A Storage Token Request:', {
    url: tokenUrl,
    appId: appId ? '***' : 'MISSING',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('R&A Storage Token Error:', response.status, errorText);
    throw new Error(`Token request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenRequest = await request.json();
    const { environment, credentials } = body;

    let tokenData: any;

    switch (environment) {
      case 'opera_cloud':
      case 'property':
      case 'workflows':
      case 'nor1':
        tokenData = await fetchOperaCloudToken(credentials);
        break;
      case 'distribution':
        tokenData = await fetchDistributionToken(credentials);
        break;
      case 'ra_storage':
      case 'ra_data':
        tokenData = await fetchRAStorageToken(credentials);
        break;
      default:
        return NextResponse.json({ error: 'Unknown environment' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Cache the token
    await prisma.tokenCache.upsert({
      where: { environment },
      update: {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in || 3600,
        expiresAt,
        scope: tokenData.scope || null,
      },
      create: {
        environment,
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in || 3600,
        expiresAt,
        scope: tokenData.scope || null,
      },
    });

    return NextResponse.json({
      success: true,
      token: {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in || 3600,
        expiresAt: expiresAt.toISOString(),
        environment,
      },
    });
  } catch (error: any) {
    console.error('Token error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to obtain token' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const environment = request.nextUrl.searchParams.get('environment');
    
    if (!environment) {
      return NextResponse.json({ error: 'Environment required' }, { status: 400 });
    }

    const cached = await prisma.tokenCache.findUnique({
      where: { environment },
    });

    if (!cached || new Date() > cached.expiresAt) {
      return NextResponse.json({ valid: false, message: 'Token expired or not found' });
    }

    return NextResponse.json({
      valid: true,
      token: {
        accessToken: cached.accessToken,
        tokenType: cached.tokenType,
        expiresIn: cached.expiresIn,
        expiresAt: cached.expiresAt.toISOString(),
        environment: cached.environment,
      },
    });
  } catch (error: any) {
    console.error('Token check error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to check token' },
      { status: 500 }
    );
  }
}
