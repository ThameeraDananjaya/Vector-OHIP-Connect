export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const collection = request.nextUrl.searchParams.get('collection');

    const where = collection ? { collection } : {};

    const logs = await prisma.apiLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Logs error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await prisma.apiLog.deleteMany({});
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error: any) {
    console.error('Clear logs error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
