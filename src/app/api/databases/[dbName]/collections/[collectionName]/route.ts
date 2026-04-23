import { NextResponse } from 'next/server';
import clientPromise from '@/src/lib/mongodb';
import { SYSTEM_DATABASES } from '@/src/lib/constants';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string }> }
) {
  try {
    const { dbName, collectionName } = await params;

    // Block operations on system databases — with an actual return this time
    if ((SYSTEM_DATABASES as readonly string[]).includes(dbName)) {
      return NextResponse.json(
        { error: `Cannot drop collections from system database "${dbName}"` },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    await client.db(dbName).collection(collectionName).drop();

    return NextResponse.json({
      success: true,
      message: `Collection "${collectionName}" dropped from "${dbName}"`,
    });
  } catch (err) {
    console.error('Drop collection error:', err);
    return NextResponse.json({ error: 'Failed to drop collection' }, { status: 500 });
  }
}
