import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return sync health status for all rules
  // In production this would query the database
  return NextResponse.json({
    status: 'ok',
    lastCheckAt: new Date().toISOString(),
  });
}
