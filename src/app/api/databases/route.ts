import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    // Enrich database info with collection counts
    const enrichedDatabases = await Promise.all(
      databases.map(async (dbInfo: any) => {
        const db = client.db(dbInfo.name);
        const collections = await db.listCollections().toArray();
        return {
          ...dbInfo,
          collectionCount: collections.length,
        };
      })
    );

    return NextResponse.json(enrichedDatabases);
  } catch (error: any) {
    console.error("Databases API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
