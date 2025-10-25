# Product OS (Local)

Product OS is an internal web app that centralizes the **Continuous Discovery** workflow:

- **Discovery Loop:** Outcomes → Opportunities → Experiments → Insights → Metrics
- **AI Reports:** Discovery Pulse (monthly/weekly), with structured prompts and Markdown output
- **Discovery Admin:** Admin UI + REST API under /discovery for hypotheses, assumptions, interviews, and experiments

This repo contains a minimal, maintainable Node.js app with:

- **Backend:** Node.js (ESM), Express, EJS views
- **DB:** Prisma ORM + PostgreSQL
- **Queues:** BullMQ + Redis (jobs + optional scheduling)
- **AI:** OpenAI Chat Completions → JSON → Markdown
- **Auth:** (placeholder; planned: Google OAuth / Magic Link)
- **Frontend:** React (Vite SPA) served separately from the Express API.

---

## Tech Stack

- **Runtime:** Node 20+ (tested with Node 22), ES Modules
- **Web:** Express, EJS, express-ejs-layouts
- **ORM:** Prisma + PostgreSQL
- **Queues:** BullMQ + ioredis
- **AI:** OpenAI (`gpt-4o-mini` by default)
- **Validation:** (Light; planned Zod on inputs)

---

## Project Structure

```
apps/
  server/
    src/
      app.js
      server.js
      routes/
      controllers/
      services/
      queues/
      views/
      db/
    prisma/
      schema.prisma
      seed.js
    __tests__/
  client/
    src/
      main.js
      style.css
    vite.config.js
```

---

## Prerequisites (macOS with Homebrew)

```bash
brew update
brew install postgresql@14 redis

# ensure Postgres binaries on PATH (zsh)
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zprofile && source ~/.zprofile

brew services start postgresql@14
brew services start redis

# verify + create DB
pg_isready -h 127.0.0.1 -p 5432
redis-cli ping
createdb product_os || true
```

If your Postgres user needs a password, use:

```
postgresql://postgres:YOURPASS@127.0.0.1:5432/product_os?schema=public
```

---

## Install & Configure

```bash
npm install
```

Create environment files inside `apps/server/` (Prisma loads from `apps/server/prisma/.env`, the app loads from `apps/server/.env`). Both can share the same values locally:

**`apps/server/prisma/.env`**

```ini
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/product_os?schema=public"
```

**`apps/server/.env`**

```makefile
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/product_os?schema=public"
REDIS_URL=redis://127.0.0.1:6379
OPENAI_API_KEY=        # set to enable real AI summaries
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=30000
```

**Heads-up:** Environment variables exported in the shell override these files.  
If Prisma keeps pointing to an old Supabase URL:

```bash
unset DATABASE_URL DIRECT_URL
launchctl unsetenv DATABASE_URL 2>/dev/null || true
launchctl unsetenv DIRECT_URL 2>/dev/null || true
```

---

## Database: Generate, Migrate, Seed

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
```

**Quick checks:**

```bash
npm exec --workspace @product-os/server prisma -v
psql "postgresql://postgres@127.0.0.1:5432/product_os" -c "\dt"
```

---

## Run the App

### Terminal A — Express API & SSR

```bash
npm run dev:server
# http://localhost:3000
```

### Terminal B — Vite Client (optional, for live CSS/JS tweaks)

```bash
npm run dev:client
# http://localhost:5173
```

### Terminal C — Worker

```bash
npm run worker:discovery
# processes AI report jobs via Redis
```

> Tip: In production run `npm run build` to produce the client bundle, then `npm run start` to boot the server with the prebuilt assets.

---

## Using the UI

1. Go to `/projects`
2. Use **Quick Create** or **New Project**
3. Click **View** on a project to open the Project Detail page
4. Add Insights, Outcomes, Opportunities, Experiments, Metrics, and Snapshots
5. Run **Discovery Pulse**:
   - Button on Project Detail, or
   - `/reports/discovery/run/:projectId`
6. See Reports:
   - `/reports` (list) → click into a report

Reports are stored as Markdown and rendered to HTML.  
If `OPENAI_API_KEY` is empty, the worker returns a stubbed JSON → Markdown (useful for dev).

---

## Scheduling (Optional)

Enable repeatable Discovery Pulses (stored in Redis):

- **Weekly:** every Monday 09:00
- **Monthly:** day-of-month 09:00
- **Disable all:** remove repeatables

You can configure cadence on the Project Detail page (forms call):

```
POST /projects/:id/schedule/weekly
POST /projects/:id/schedule/monthly
POST /projects/:id/schedule/disable
```

---

## NPM Scripts

```json
{
  "scripts": {
    "dev": "node src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "db:seed": "node prisma/seed.js",
    "worker:discovery": "node src/queues/workers/discovery.worker.js"
  }
}
```

---

## Common Pitfalls & Fixes

### BullMQ: “Queue name cannot contain :”

Use names like `reports.discovery` (we already do).

### BullMQ: “Your redis options maxRetriesPerRequest must be null.”

We pass `{ maxRetriesPerRequest: null }` to `new IORedis(...)` in `src/queues/connection.js`.

### Prisma pointing to old Supabase URL

Clear shell exports:

```bash
unset DATABASE_URL DIRECT_URL
```

### Migrations failing weirdly

Reset local DB:

```bash
dropdb product_os
createdb product_os
npx prisma migrate dev --name init
npm run db:seed
```

---

## What’s Implemented

- Continuous Discovery domain models (Prisma)
- CRUD UX for Insights, Outcomes, Opportunities, Experiments, Metrics, Snapshots
- AI Discovery Pulse report (data → prompt → JSON → Markdown → HTML)
- Manual run + optional scheduled runs
- Basic EJS UI and list/detail views

---

## Roadmap (Suggested)

- **Auth:** Google OAuth / magic links; membership roles; route guards
- **Validation:** zod schemas for POST bodies + centralized error handling
- **UX:** toast notifications, inline validation, nicer styling
- **Docs:** Strategy One-Pager & Narrative Roadmap editor (Markdown)
- **Charts:** lightweight metrics charts (optionally via tiny Vite front end)
- **CI/CD:** prisma migrate deploy in pipeline; prod Postgres + Redis (Neon/Supabase, Upstash/Redis Cloud)
