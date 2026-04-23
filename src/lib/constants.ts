// ─────────────────────────────────────────────
// Application-wide constants — single source of truth
// ─────────────────────────────────────────────

// Auth
export const JWT_EXPIRATION        = '24h';
export const JWT_COOKIE_NAME       = 'auth_token';
export const JWT_COOKIE_MAX_AGE    = 60 * 60 * 24; // 24h in seconds

// Rate limiting (brute-force protection on login)
export const RATE_LIMIT_MAX_ATTEMPTS = 10;
export const RATE_LIMIT_WINDOW_MS    = 15 * 60 * 1000; // 15 minutes

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 200;

// Import
export const MAX_IMPORT_DOCUMENTS = 10_000;

// System databases that must never be dropped or modified via the UI
export const SYSTEM_DATABASES = ['admin', 'local', 'config'] as const;
export type SystemDatabase = typeof SYSTEM_DATABASES[number];
