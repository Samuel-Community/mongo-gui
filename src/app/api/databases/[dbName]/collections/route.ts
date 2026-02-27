import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dbName: string }> }
) {
  try {
    const { dbName } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    
    const collections = await db.listCollections().toArray();
    
    // Enrich collections with document counts
    const enrichedCollections = await Promise.all(
      collections.map(async (col: any) => {
        const count = await db.collection(col.name).estimatedDocumentCount();
        return {
          ...col,
          documentCount: count,
        };
      })
    );

    return NextResponse.json(enrichedCollections);
  } catch (error: any) {
    console.error("Collections API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
