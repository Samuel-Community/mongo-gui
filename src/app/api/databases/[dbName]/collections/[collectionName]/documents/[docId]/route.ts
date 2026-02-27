import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string; docId: string }> }
) {
  try {
    const { dbName, collectionName, docId } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteOne({ _id: new ObjectId(docId) });
    
    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Document deleted successfully" });
    } else {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Delete Document API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ dbName: string; collectionName: string; docId: string }> }
) {
  try {
    const { dbName, collectionName, docId } = await params;
    const body = await request.json();
    
    // Remove _id from body if present to avoid immutable field error
    const { _id, ...updateData } = body;
    
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(docId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 1) {
      return NextResponse.json({ message: "Document updated successfully" });
    } else {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Update Document API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
