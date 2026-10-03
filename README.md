# Shortly — link sharing, with a little more thought

A full-stack URL shortener with custom aliases, protected workspaces, link expiry, and click analytics.

## Features

- Email/password accounts with bcrypt password hashing and JWT authentication in HTTP-only cookies.
- Create random short links or choose your own custom alias. Aliases accept 3–30 letters, numbers, hyphens, or underscores and are unique across users.
- Follow `http://localhost:5000/<alias>` to redirect to the saved destination. Redirects honor disabled and expired links and return a temporary 302 redirect.
- Private dashboard with search, active/expired filtering, URL copy, disable/enable, and delete actions.
- Optional expiration date, click totals, last-click timestamp, and a 14-day per-link click chart.
- Rate limiting, security headers, HTTP/HTTPS URL validation, ownership checks, and privacy-conscious click records (no raw IP address is stored).

## Stack

React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React; Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Helmet, CORS, and express-rate-limit.

## Architecture

```text
client (Vite :5173) ── JSON + HTTP-only cookie ──> server (Express :5000) ──> MongoDB
                                                     │
Browser ── GET /<shortCode> ──> URL lookup ── 302 ──> destination
                                      └── click record (asynchronous)
```

The `Url.shortCode` field is the canonical identifier for both generated codes and custom aliases. A unique MongoDB index prevents two users from claiming the same code. The redirect route queries that field directly. The URL owner is checked on all dashboard operations, and the owner is never accepted from request input.

## Project structure

```text
client/src/             React pages, components, auth context, API client, styles
server/src/config/      MongoDB connection
server/src/models/      User, URL, and click schemas and indexes
server/src/controllers/ Request handlers
server/src/services/    Alias validation and unique code generation
server/src/middleware/  Authentication and centralized errors
server/src/routes/      REST API routes
```

## Prerequisites

- Node.js 20 or newer and npm.
- MongoDB running locally. MongoDB Community Server can be installed from the official MongoDB download page. On Windows, start the MongoDB Server service from Services, or run `mongod --dbpath C:\data\db` after creating that data directory.

## Local setup

From the repository root:

```bash
npm install
```

Copy `server/.env.example` to `server/.env`, then set a private JWT secret (at least 32 random characters is recommended). Copy `client/.env.example` to `client/.env` if you need to change the API URL. The default MongoDB URI is `mongodb://127.0.0.1:27017/url_shortener`.

Start both applications:

```bash
npm run dev
```

Open http://localhost:5173. The API health endpoint is http://localhost:5000/health. The API server exits with a clear error if MongoDB is unavailable; start the local MongoDB service and run `npm run dev` again.

Production frontend build and server start:

```bash
npm run build
npm start
```

The Vite frontend is a separate static asset in production and should be hosted behind a web server/CDN. Set `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `VITE_API_URL` for the deployment environment. Terminate TLS at the host or reverse proxy. Secure cookies are enabled in production.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PORT` | Server | API port, default `5000` |
| `MONGODB_URI` | Server | MongoDB connection URI |
| `JWT_SECRET` | Server | Signs authentication cookies; keep private |
| `CLIENT_URL` | Server | Allowed frontend origin, default `http://localhost:5173` |
| `NODE_ENV` | Server | Enables secure cookies in production |
| `IP_HASH_SECRET` | Server | Optional separate secret for anonymized click IP hashes |
| `VITE_API_URL` | Client | API base URL, default `http://localhost:5000/api` |

## Authentication and security

Passwords are hashed with bcrypt and never serialized. The seven-day JWT is stored in an HTTP-only, same-site cookie. The API also accepts Bearer tokens for clients that need them. CORS is restricted to the configured client origin. Helmet adds common security headers, auth and link creation are rate-limited, and only HTTP/HTTPS URLs are accepted. Link list, deletion, editing, and analytics queries always include the authenticated owner ID. Redirects only expose the destination URL through the browser redirect.

Click events store the referrer, user-agent, timestamp, and a keyed hash of the request IP; the raw IP is discarded. Click logging is asynchronous and does not delay the redirect response.

## API

All JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`. Authenticated endpoints use the HTTP-only session cookie.

| Method | Endpoint | Auth | Request / response |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | `{name,email,password}`; creates an account and cookie. Password: 8+ chars with uppercase, lowercase, and a digit. |
| `POST` | `/api/auth/login` | No | `{email,password}`; authenticates and sets cookie. |
| `POST` | `/api/auth/logout` | No | Clears the session cookie. |
| `GET` | `/api/auth/me` | Yes | Returns the current public user. |
| `POST` | `/api/urls` | Yes | `{originalUrl,alias?,expiresAt?}`; returns the created URL including `shortUrl`. |
| `GET` | `/api/urls?search=` | Yes | Lists up to 200 links owned by the user; search covers destination and alias. |
| `GET` | `/api/urls/stats` | Yes | Returns total links, clicks, active links, and expired links. |
| `GET` | `/api/urls/:id/analytics` | Yes | Returns owned link details, click count, and daily 14-day trend. |
| `PATCH` | `/api/urls/:id` | Yes | `{isActive?,expiresAt?}`; updates an owned link. |
| `DELETE` | `/api/urls/:id` | Yes | Deletes an owned link and its click records. |
| `GET` | `/:shortCode` | No | Redirects active, unexpired short code/alias to its destination with HTTP 302; unavailable links return 404. |
| `GET` | `/health` | No | Basic process health response. |

Expected errors include `400` invalid input, `401` missing/invalid session, `404` missing or inaccessible link, `409` duplicate email/alias, and `429` rate limit reached.

## Indexes

- `User.email` unique index supports sign-in and prevents duplicate accounts.
- `Url.shortCode` unique index makes the public alias lookup fast and prevents alias collisions.
- `Url.user` and compound `{ user, createdAt }` indexes support private dashboard listing.
- `Click.url` and compound `{ url, timestamp }` indexes support click counts and time-series analytics.

## Tests

No automated test suite is configured yet. The core UI and production build are verified during development. Before deploying, add integration tests using a disposable MongoDB instance and Supertest for registration, ownership, alias conflicts, redirects, expiration, and click tracking.

## Future improvements

- Add automated API integration tests and an OpenAPI document.
- Support custom domains, branded QR codes, and richer aggregate analytics.
- Use a queue and managed cache when traffic warrants their added operational cost.
- Add CSRF protection before using cross-site cookie deployments; keep the frontend and API on the same site when possible.
