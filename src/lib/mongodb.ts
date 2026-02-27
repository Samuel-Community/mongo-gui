import { MongoClient } from "mongodb";
import { initAuthDb } from "./auth-db";

// Initialize Auth DB (SQLite) and generate admin password if needed
try {
  initAuthDb();
} catch (e) {
  console.error("Failed to initialize Auth DB:", e);
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  // During build time or if URI is missing, we provide a dummy promise that will fail when awaited
  clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'));
} else {
  if (process.env.NODE_ENV === "development") {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;
