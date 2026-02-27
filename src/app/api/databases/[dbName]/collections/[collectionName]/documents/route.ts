import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string }> }
) {
  try {
    const { dbName, collectionName } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filterStr = searchParams.get("filter") || "{}";
    
    let filter = {};
    try {
      filter = JSON.parse(filterStr);
    } catch (e) {
      return NextResponse.json({ error: "Invalid filter JSON" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const total = await collection.countDocuments(filter);
    const documents = await collection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Documents API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string }> }
) {
  try {
    const { dbName, collectionName } = await params;
    const data = await request.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Import data must be an array of documents" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const result = await collection.insertMany(data);
    
    return NextResponse.json({ 
      message: `Successfully imported ${result.insertedCount} documents`,
      insertedCount: result.insertedCount
    });
  } catch (error: any) {
    console.error("Import API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
