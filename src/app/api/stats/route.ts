import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const adminDb = client.db().admin();
    
    // Get databases
    const { databases } = await adminDb.listDatabases();
    const dbCount = databases.length;
    
    // Count total collections across all DBs
    let totalCollections = 0;
    for (const dbInfo of databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      totalCollections += collections.length;
    }

    return NextResponse.json({
      dbCount,
      collectionCount: totalCollections,
      status: "online"
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
