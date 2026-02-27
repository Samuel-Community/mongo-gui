// instrumentation.ts
export async function register() {
  // This function runs once when the server starts
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // We import dynamically to ensure this only runs on the server side
    const { initAuthDb } = await import('./lib/auth-db');
    
    console.log('--- Initializing Auth Database ---');
    initAuthDb();
  }
}
