import { NextResponse } from 'next/server';
import clientPromise from '@/src/lib/mongodb';
import { SYSTEM_DATABASES } from '@/src/lib/constants';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ dbName: string }> }
) {
  try {
    const { dbName } = await params;

    if ((SYSTEM_DATABASES as readonly string[]).includes(dbName)) {
      return NextResponse.json(
        { error: `Cannot drop system database "${dbName}"` },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    await client.db(dbName).dropDatabase();

    return NextResponse.json({ success: true, message: `Database "${dbName}" dropped` });
  } catch (err) {
    console.error('Drop database error:', err);
    return NextResponse.json({ error: 'Failed to drop database' }, { status: 500 });
  }
}
