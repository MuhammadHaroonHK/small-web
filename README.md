# Small Web

Small Web is a browser-like app for exploring a collection of community-published websites stored in MongoDB. People can browse pages, follow internal links, search page titles and body text, publish new pages, and keep browsing history for the selected person.

## Technology stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, class-validator
- **Database:** MongoDB with Mongoose
- **HTML handling:** `sanitize-html` and `html-to-text`

## Prerequisites

- Node.js and npm
- MongoDB, either a local MongoDB server or a MongoDB Atlas cluster
- For Atlas, a database user and network access configured for your development machine

## MongoDB and environment configuration

Copy the backend environment template and set a MongoDB connection URI:

```powershell
Set-Location D:\small-web\server
Copy-Item .env.example .env
```

Edit `server/.env`:

```dotenv
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>
```

Replace the placeholders with your Atlas database user, password, cluster host, and database name. For a local MongoDB instance, a URI such as `mongodb://127.0.0.1:27017/smallWeb` can be used instead.

The backend loads `MONGODB_URI` from `server/.env` and exits with an error if the value is missing or MongoDB cannot be reached. Do not commit credentials; `.env` files are ignored by Git.

The frontend also needs the API URL. Create `client/.env.local`:

```powershell
Set-Location D:\small-web\client
Set-Content -Path .env.local -Value 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' -Encoding Ascii
```

| Variable | Used by | Description |
| --- | --- | --- |
| `PORT` | Backend | HTTP port; defaults to `4000`. |
| `MONGODB_URI` | Backend and seed | MongoDB connection string. Required. |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend base URL, including `/api`. |

## Install dependencies

Install dependencies separately in each app:

```powershell
Set-Location D:\small-web\server
npm install

Set-Location D:\small-web\client
npm install
```

## Seed the database

With `server/.env` configured and MongoDB reachable, run:

```powershell
Set-Location D:\small-web\server
npm run seed
```

The seed command builds the backend and inserts or updates stable sample people, websites, and visits. It is safe to run repeatedly.

## Start the applications

Start the backend in one PowerShell terminal:

```powershell
Set-Location D:\small-web\server
npm run start:dev
```

Start the frontend in another terminal:

```powershell
Set-Location D:\small-web\client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API listens on port `4000` with the `/api` prefix.

## Main API endpoints

All endpoints return a JSON response with the result in a `data` property.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/people` | List people available for browsing and publishing. |
| `GET` | `/api/sites` | List published websites. |
| `GET` | `/api/sites/:address` | Retrieve a website by its internal address. URL-encode the address parameter. |
| `POST` | `/api/sites` | Publish a website with `address`, `title`, `html`, and `authorId`. |
| `GET` | `/api/search?q=...` | Search website titles and body text. An empty query returns no results. |
| `POST` | `/api/visits` | Record a page arrival with `personId`, `address`, optional `title`, and `source`. |
| `GET` | `/api/visits/:personId?limit=50` | List a person's browsing history, newest first. |

Visit source values are `typed`, `link`, `back`, `forward`, `history`, and `search`. A visit can be recorded even when the address does not resolve to a stored website.

## Database structure

Mongoose stores three document types:

- **People:** display name and creation timestamp; names have a case-insensitive unique index.
- **Sites:** internal address, title, sanitized HTML, extracted plain-text content, author reference, and timestamps. Addresses are unique; title and body text have a MongoDB text index.
- **Visits:** person reference, visited address, title snapshot, visit timestamp, and navigation source. Visits are indexed by person and descending timestamp for history retrieval. A visit address does not require a matching Site document.

## Browser navigation

The frontend's `useBrowser` hook manages the session navigation stack and current index in React state. Page and search entries are persisted in `sessionStorage`, including the search query and results, so Back and Forward restore the browser view. MongoDB Visits are separate persistent records created for explicit page arrivals; rendering or restoring the search screen does not itself create a visit.

## HTML security

Published HTML is sanitized on the backend using a conservative allowlist before storage, and plain text is extracted for search indexing. The frontend displays page content in a sandboxed iframe with no same-origin access, forms, popups, or top-level navigation. A restrictive content security policy blocks external assets and network requests. A trusted bridge communicates internal link clicks with the parent app, which validates the message and resolves supported internal addresses.
