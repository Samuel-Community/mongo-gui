# MongoDB WebGUI Modern

Open-source MongoDB web interface inspired by MongoDB Compass.

This project provides a browser-based GUI for exploring MongoDB databases, collections, documents, indexes, schema information, validation rules, aggregation pipelines, explain plans, and collection stats.

> ⚠️ This is an administrative tool. Do not expose it directly to the public internet without HTTPS, strong authentication, rate limiting, and a MongoDB user with the minimum required privileges.

## Main features

- Secure admin login with JWT cookie and bcrypt password hashing.
- MongoDB databases and collections browser.
- Compass-like collection workspace with tabs:
  - Documents
  - Aggregations
  - Schema
  - Indexes
  - Explain Plan
  - Validation
  - Stats
- Query bar with `Filter`, `Project`, and `Sort` fields.
- Document views: Tree, JSON, and Table.
- JSON import and current-page export to JSON/CSV.
- Document edit/delete actions.
- Index list/create/drop actions.
- Aggregation preview builder with `$out` and `$merge` disabled by default.
- Schema analyzer based on a random sample.
- Explain plan summary and raw output.
- Collection stats via `collStats`.
- Read-only mode for safer deployments.
- Safer Nginx and PM2 examples.

## Requirements

- Node.js 20+
- MongoDB 6+
- npm

## Installation

```bash
npm install
cp .env.example .env
npm run build
npm run start:4000
```

The app listens on `127.0.0.1` by default in the provided scripts. Put Nginx, Caddy, or another reverse proxy in front of it.

## Environment variables

```env
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=change_me_with_a_long_random_secret_at_least_32_chars
MONGO_GUI_MODE=full
MONGO_QUERY_MAX_TIME_MS=5000
MAX_IMPORT_BODY_BYTES=20971520
MAX_QUERY_STRING_LENGTH=20000
MAX_AGGREGATION_STAGES=25
MAX_SCHEMA_SAMPLE_SIZE=1000
```

### Read-only mode

Use read-only mode when you only want to inspect data:

```env
MONGO_GUI_MODE=readonly
```

This blocks:

- document import
- document update/delete
- database drop
- collection drop
- index create/drop
- validation changes

## Recommended MongoDB user

Create a MongoDB user with only the permissions needed for the deployment.

For a safe read-only deployment, use a read-only MongoDB user and set:

```env
MONGO_GUI_MODE=readonly
```

For a full admin deployment, restrict access by IP/VPN and use HTTPS.

## Production with PM2

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

The included PM2 config runs:

```bash
npm run start:4000
```

which binds Next.js to `127.0.0.1:4000`.

## Production with Nginx

A safer example config is included in `mongo.conf`.

Important defaults:

- `client_max_body_size 20m`
- login rate limit
- API rate limit
- proxy only to `127.0.0.1:4000`
- sensitive files denied

## Security notes

The project includes several safety protections:

- JWT auth cookie is `httpOnly`.
- `JWT_SECRET` is required.
- bcrypt is used for password hashing.
- System databases `admin`, `local`, and `config` cannot be modified from the UI.
- Query execution has `maxTimeMS`.
- Import size and document count are limited.
- `$where`, `$function`, and `$accumulator` are blocked in user-provided JSON.
- Aggregation write stages `$out` and `$merge` are blocked.
- Deprecated `/api/mongo/databases` endpoint returns `410`.

Known limitations:

- Rate limiting is still in memory. For multi-instance production, use Redis or Nginx limits.
- Large exports currently export only the current loaded page.
- The aggregation builder is JSON-based, not a full visual builder yet.
- Multi-connection management is not implemented yet.
- Role-based users are not implemented yet.

## Development roadmap

Next improvements recommended:

- Multi-connection manager with encrypted connection secrets.
- Users and roles: `readonly`, `editor`, `admin`.
- Audit logs for destructive actions.
- Streaming export for large collections.
- Cursor-based pagination for huge collections.
- Saved queries and saved pipelines.
- Visual aggregation stage builder.
- Visual explain plan tree.

## License

MIT

## Monaco Editor notes

This project keeps Monaco Editor for a Compass-like JSON editing experience.
During `npm install`, the `postinstall` script copies Monaco assets from:

```txt
node_modules/monaco-editor/min/vs
```

to:

```txt
public/monaco/vs
```

If Monaco fails to load in development, run:

```bash
npm run postinstall
```

Then restart the dev server.


## Read-only UI protection

When `MONGO_GUI_MODE=readonly`, write actions are blocked server-side and disabled in the interface. This disables imports, document edits/deletes, bulk updates/deletes, database/collection drops, index creation/drop and validator updates.


## Search engine indexing

MongoGUI is an administration interface and should not be indexed by search engines.
The app includes multiple protections by default:

- `public/robots.txt` blocks all crawlers.
- Next.js metadata sets `robots: noindex, nofollow`.
- Every response includes `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.

If you deploy behind Nginx, keep the same `X-Robots-Tag` header in your reverse proxy configuration too.


### Next.js production build note

This project uses Next.js 16 proxy routing. Do not keep an old `src/middleware.ts` file in the project directory. If you upgraded from an older archive, delete it and keep only `src/proxy.ts`.

If Next.js detects a parent `package-lock.json`, the project sets `turbopack.root` in `next.config.mjs` to force the correct project root.

