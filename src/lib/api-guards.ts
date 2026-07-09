import { NextResponse } from 'next/server';
import {
  APP_MODE,
  MAX_QUERY_STRING_LENGTH,
  SYSTEM_DATABASES,
} from '@/src/lib/constants';

export function isReadOnlyMode() {
  return APP_MODE === 'readonly';
}

export function readOnlyResponse() {
  return NextResponse.json(
    { error: 'This action is disabled because MONGO_GUI_MODE=readonly.' },
    { status: 403 }
  );
}

export function ensureWritable() {
  return isReadOnlyMode() ? readOnlyResponse() : null;
}

export function isSystemDatabase(dbName: string) {
  return (SYSTEM_DATABASES as readonly string[]).includes(dbName);
}

export function blockSystemDatabaseWrite(dbName: string) {
  if (!isSystemDatabase(dbName)) return null;
  return NextResponse.json(
    { error: `Write operations are blocked on system database "${dbName}".` },
    { status: 403 }
  );
}

export function safeJsonObject(input: string | null, fallback: Record<string, unknown> = {}) {
  const value = input ?? JSON.stringify(fallback);
  if (value.length > MAX_QUERY_STRING_LENGTH) {
    throw new Error(`JSON input is too large. Max ${MAX_QUERY_STRING_LENGTH} characters.`);
  }
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON value must be an object.');
  }
  assertNoDangerousOperators(parsed);
  return parsed as Record<string, unknown>;
}

export function safeJsonArray(input: unknown) {
  if (!Array.isArray(input)) throw new Error('JSON value must be an array.');
  assertNoDangerousOperators(input);
  return input as unknown[];
}

const blockedOperators = new Set([
  '$where',
  '$function',
  '$accumulator',
]);

export function assertNoDangerousOperators(value: unknown) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoDangerousOperators(item);
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (blockedOperators.has(key)) {
      throw new Error(`Operator ${key} is disabled for safety.`);
    }
    assertNoDangerousOperators(child);
  }
}

export function normalizeIndexName(name: string) {
  return decodeURIComponent(name).trim();
}

export function getRequestSize(request: Request) {
  const header = request.headers.get('content-length');
  return header ? Number(header) : null;
}
