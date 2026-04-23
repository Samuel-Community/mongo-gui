import { NextResponse } from 'next/server';
import clientPromise from '@/src/lib/mongodb';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MAX_IMPORT_DOCUMENTS } from '@/src/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string }> }
) {
  try {
    const { dbName, collectionName } = await params;
    const { searchParams } = new URL(request.url);

    // Bounded pagination — no unbounded queries
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE))));

    let filter: Record<string, unknown> = {};
    const filterStr = searchParams.get('filter') ?? '{}';
    try {
      filter = JSON.parse(filterStr);
      if (typeof filter !== 'object' || Array.isArray(filter)) {
        return NextResponse.json({ error: 'Filter must be a JSON object' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid filter JSON' }, { status: 400 });
    }

    const client     = await clientPromise;
    const collection = client.db(dbName).collection(collectionName);

    const [total, documents] = await Promise.all([
      collection.countDocuments(filter),
      collection.find(filter).skip((page - 1) * limit).limit(limit).toArray(),
    ]);

    return NextResponse.json({
      documents,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Documents GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string }> }
) {
  try {
    const { dbName, collectionName } = await params;
    const data = await request.json().catch(() => null);

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Import data must be a JSON array' }, { status: 400 });
    }
    if (data.length === 0) {
      return NextResponse.json({ error: 'Array is empty' }, { status: 400 });
    }
    if (data.length > MAX_IMPORT_DOCUMENTS) {
      return NextResponse.json(
        { error: `Import limited to ${MAX_IMPORT_DOCUMENTS.toLocaleString()} documents at once` },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const result = await client.db(dbName).collection(collectionName).insertMany(data);

    return NextResponse.json({
      message: `Successfully imported ${result.insertedCount} documents`,
      insertedCount: result.insertedCount,
    });
  } catch (err) {
    console.error('Documents POST error:', err);
    return NextResponse.json({ error: 'Failed to import documents' }, { status: 500 });
  }
}
