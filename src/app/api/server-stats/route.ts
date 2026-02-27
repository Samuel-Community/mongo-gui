import { NextResponse } from 'next/server';
import clientPromise from '@/src/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const adminDb = client.db().admin();
    
    // Get server status
    const serverStatus = await adminDb.serverStatus();
    
    // Get all databases
    const { databases } = await adminDb.listDatabases();
    
    // Aggregate stats from all databases
    let totalCollections = 0;
    let totalObjects = 0;
    let totalDataSize = 0;
    let totalStorageSize = 0;
    let totalIndexSize = 0;
    let totalAvgObjSizeSum = 0;
    let dbWithStatsCount = 0;

    for (const dbInfo of databases) {
      try {
        const db = client.db(dbInfo.name);
        const stats = await db.stats();
        
        totalCollections += stats.collections || 0;
        totalObjects += stats.objects || 0;
        totalDataSize += stats.dataSize || 0;
        totalStorageSize += stats.storageSize || 0;
        totalIndexSize += stats.indexSize || 0;
        
        if (stats.avgObjSize) {
          totalAvgObjSizeSum += stats.avgObjSize;
          dbWithStatsCount++;
        }
      } catch (err) {
        console.warn(`Could not get stats for database ${dbInfo.name}:`, err);
      }
    }

    const avgObjSize = dbWithStatsCount > 0 ? totalAvgObjSizeSum / dbWithStatsCount : 0;

    return NextResponse.json({
      serverStatus: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
        mem: serverStatus.mem,
        opcounters: serverStatus.opcounters,
      },
      dbStats: {
        db: "All Databases",
        collections: totalCollections,
        objects: totalObjects,
        avgObjSize: avgObjSize,
        dataSize: totalDataSize,
        storageSize: totalStorageSize,
        indexSize: totalIndexSize,
      }
    });
  } catch (error: any) {
    console.error('Server Stats API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
