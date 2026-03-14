import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string }> }
) {
  try {
    const { dbName, collectionName } = await params;
    
    // Prevent dropping system collections if necessary (optional, but good practice)
    if (dbName === "admin" || dbName === "local" || dbName === "config") {
       // Usually we don't want to mess with these via UI
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    
    await db.collection(collectionName).drop();
    
    return NextResponse.json({ 
      success: true, 
      message: `Collection ${collectionName} dropped successfully from ${dbName}` 
    });
  } catch (error: any) {
    console.error("Drop Collection API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
