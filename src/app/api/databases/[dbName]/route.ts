import { NextResponse } from "next/server";
import clientPromise from "@/src/lib/mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dbName: string }> }
) {
  try {
    const { dbName } = await params;
    
    // Prevent dropping system databases
    if (["admin", "local", "config"].includes(dbName)) {
      return NextResponse.json(
        { error: "Cannot drop system databases (admin, local, config)" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    
    await db.dropDatabase();
    
    return NextResponse.json({ success: true, message: `Database ${dbName} dropped successfully` });
  } catch (error: any) {
    console.error("Drop Database API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
